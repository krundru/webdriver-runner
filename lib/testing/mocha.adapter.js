import path from 'path'
import Mocha from 'mocha'
import shortid from 'shortid'

const NOOP = function() {}

const EVENTS = {
  'suite': 'suite:start',
  'suite end': 'suite:end',
  'test': 'test:start',
  'test end': 'test:end',
  'hook': 'hook:start',
  'hook end': 'hook:end',
  'pass': 'test:pass',
  'fail': 'test:fail',
  'pending': 'test:pending'
}

/**
 * Tree nodes for tracking nested suites & their tests
 */
class Node {
  constructor(parent) {
    this._parent = parent
    this._depth  = (this._parent  || {_depth: -2})._depth + 1
    this._subNodes = []
    this.id = shortid.generate()
    this.stime = new Date().getTime()
  }

  up() {
    return this._parent
  }

  parentId() {
    return this._parent.id
  }

  depth() {
    return this._depth
  }

  duration() {
    return new Date().getTime() - this.stime
  }

  addNode() {
    const newNode = new Node(this)
    this._subNodes.push(newNode)
    return newNode
  }
}

class MochaAdapter {
  constructor(task) {
    this.task = task
    this.specs = task.specs
    this.node = new Node()
  }

  async run() {
    let mochaOpts = {
      ui: 'bdd'
    }

    const mocha = new Mocha(mochaOpts)
    mocha.loadFiles()
    mocha.reporter(NOOP)
    mocha.fullTrace()
    this.specs.forEach((spec) => mocha.addFile(spec))

    return new Promise((resolve) => {
      this.runner = mocha.run((fails) => {
        resolve(fails)
      })

      Object.keys(EVENTS).forEach(event => {
        this.runner.on(event, this.emit.bind(this, EVENTS[event]))
      })
    }).catch(error => console.log(error))
  }

  formatMessage(params) {
    let message = {
      type: params.type,
      rid: this.task.rid
    }

    if (params.err) {
      message.err = {
        message: params.err.message,
        stack: params.err.stack,
        type: params.err.type || params.err.name,
        expected: params.err.expected,
        actual: params.err.actual
      }
    }

    if (params.payload) {
      const payload = params.payload
      message.title = payload.title
      message.parent = payload.parent ? payload.parent.title : null

      /**
       * get title for hooks in root suite
       */
      if (message.parent === '' && payload.parent && payload.parent.suites) {
        message.parent = payload.parent.suites[0].title
      }

      message.pending = payload.pending || false
      message.file = payload.file

      if (payload.ctx && payload.ctx.currentTest) {
        message.currentTest = payload.ctx.currentTest.title
      }

      if (params.type.match(/test/)) {
        message.sid = this.node.id
        message.state = payload.state
        message.duration = payload.duration
        if (payload.pending) {
          message.state = 'pending'
        }
      }

      if (params.type === 'suite:start') {
        this.node = this.node.addNode()
        message.sid = this.node.id
        message.depth = this.node.depth()
        if (!payload.parent.root) {
          message.psid = this.node.parentId()
        }
      }

      if (params.type === 'suite:end') {
        message.sid = this.node.id
        message.duration = this.node.duration()
        message.depth = this.node.depth()
        if (!payload.parent.root) {
          message.psid = this.node.parentId()
        }
        this.node = this.node.up()
      }
    }

    return message
  }

  emit(event, payload, err) {
    // Even a initial suite will have parent whose root field is true.
    if (payload.root) return

    let message = this.formatMessage({
      type: event,
      payload,
      err
    })

    this.send(message, null, {}, () => ++this.receivedMessages)
    this.sentMessages++
  }

  send(...args) {
    return process.send.apply(process, args)
  }
}

export default async function(task) {
  const adapter = new MochaAdapter(task)
  const result = await adapter.run()
  return result
}

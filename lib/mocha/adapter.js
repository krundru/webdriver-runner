const Mocha = require('mocha')
const shortid = require('shortid')
const log = require('debug')('webdriver-runner:mocha')

const NOOP = function() {}

const EVENTS = {
  hook: 'hook:start',
  'hook end': 'hook:end',
  suite: 'suite:start',
  'suite end': 'suite:end',
  test: 'test:start',
  pending: 'test:start',
  fail: 'fail',
  pass: 'test:pass',
  'test end': 'test:end'
}

/**
 * Tree nodes for tracking nested suites & their tests
 */
class Node {
  constructor(parent) {
    this._parent = parent
    this._depth = (this._parent || {_depth: -2})._depth + 1
    this._subNodes = []
    this.id = shortid.generate()
    this._date = new Date().getTime()
    this.up = () => this._parent
    this.depth = () => this._depth
    this.date = () => this._date
    this.duration = ()  => new Date().getTime() - this._date
    this.parentId = () => this._parent.id
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
    let mochaOpts = Object.assign({}, this.task.mochaOptions, {
      ui: 'bdd'
    })

    this.requireModules(mochaOpts.requires)

    const mocha = new Mocha(mochaOpts)
    mocha.loadFiles()
    mocha.reporter(NOOP)
    mocha.fullTrace()
    mocha.addFile(this.specs[0])

    process.on('test:output', this.handleOutput.bind(this))

    return new Promise((resolve) => {
      this.runner = mocha.run((fails) => {
        resolve(fails)
      })

      Object.keys(EVENTS).forEach(event => {
        this.runner.on(event, this.event.bind(this, EVENTS[event]))
      })
    }).catch(error => {
      const msg = {
        type: 'error',
        error: {
          message: error.message,
          stack: error.stack
        }
      }
      log('Error occurred in mocha run function ', msg)
      this.send(msg)
    })
  }

  /**
   * Sends message out for all start & end events only.
   */
  event(type, payload, error) {
    log('event:', type, this.specs[0])
    // Even a initial suite will have parent whose root field is true.
    if (payload.root) {
      return
    }

    // On failures, error will be delayed until end event.
    if (type === 'fail') {
      // Hook:event will not be fire incase of errors, so change it.
      if (payload.type === 'hook') {
        type = 'hook:end'
      }
      this.testError = error
    }

    if (type === 'suite:start') {
      this.node = this.node.addNode()
    }

    if (type.match(/start|end/)) {
      const message = this.convertPayload(type, payload)
      this.send(message, null, {}, () => ++this.receivedMessages)
      this.sentMessages++
      this.testError = null
    }

    if (type === 'suite:end') {
      this.node = this.node.up()
    }
  }

  convertPayload(type, payload) {
    // Default message for all start & end events of - suite, test & hook
    let message = {
      type: type,
      title: payload.title,
      specId: this.task.specId,
      suiteId: this.node.id,
      state: payload.state,
      file: payload.file,
      pending: payload.pending,
      duration: payload.duration,
      error: this.jsonError(this.testError)
    }

    if (type.match(/test:/)) {
      message = Object.assign(message, {
        fullTitle: payload.fullTitle(),
        currentRetry: payload.currentRetry()
      })
    } else if (type.match(/suite:/)) {
      message = Object.assign(message, {
        depth: this.node.depth(),
        date: this.node.date(),
        duration: this.node.duration()
      })
    }

    return message
  }

  jsonError(error) {
    if (error) {
      return {
        message: error.message,
        stack: error.stack
      }
    }
  }

  handleOutput(data) {
    const msg = Object.assign({}, data, {
      suiteId: this.node.id,
      type: 'test:output',
      specId: this.task.specId
    })

    this.send(msg, null, {})
  }

  send(...args) {
    return process.send.apply(process, args)
  }

  requireModules(requires = []) {
    requires.forEach(mod => require(mod))
  }
}

module.exports = async function(task) {
  const adapter = new MochaAdapter(task)
  const result = await adapter.run()
  return result
}

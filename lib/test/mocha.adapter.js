const Mocha = require('mocha')
const shortid = require('shortid')

const NOOP = function() {}

const EVENTS = {
  hook: 'hook:start',
  'hook end': 'hook:end',
  suite: 'suite:start',
  'suite end': 'suite:end',
  test: 'test:start',
  pending: 'test:start',
  fail: 'test:fail',
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
    return new Date().getTime() - this._date
  }

  date() {
    return this._date
  }

  addNode() {
    const newNode = new Node(this)
    this._subNodes.push(newNode)
    return newNode
  }
}

function clean (test) {
  return {
    title: test.title,
    fullTitle: test.fullTitle(),
    duration: test.duration,
    state: test.state,
    pending: test.pending,
    file: test.file,
    currentRetry: test.currentRetry()
  }
}

function jsonError(error) {
  if (error) {
    return {
      message: error.message,
      stack: error.stack
    }
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
    this.specs.forEach((spec) => mocha.addFile(spec))

    process.on('test-output', this.handleOutput.bind(this))

    return new Promise((resolve) => {
      this.runner = mocha.run((fails) => {
        resolve(fails)
      })

      // Handle test errors.
      this.runner.on('suite', () => this.node = this.node.addNode())
      this.runner.on('test', () => this.testError = null)
      this.runner.on('fail', (test, err) => this.testError = err)

      Object.keys(EVENTS).forEach(event => {
        this.runner.on(event, this.event.bind(this, EVENTS[event]))
      })

      this.runner.on('suite end', () => this.node = this.node.up())
    }).catch(error => {
      const msg = {
        type: 'error',
        error: {
          message: error.message,
          stack: error.stack
        }
      }
      this.send(msg)
    })
  }

  event(type, payload) {
    let message = {
      type: type,
      specId: this.task.specId,
      suiteId: this.node.id,
    }
    if (type.match(/test:/)) {
      message = Object.assign( clean(payload), {
        err: jsonError(this.testError),
        error: jsonError(this.testError)
      }, message)
    } else if (type.match(/suite:/)) {
      try {
        message = Object.assign({
          file: payload.file,
          title: payload.title,
          depth: this.node.depth(),
          date: this.node.date(),
          duration: this.node.duration(),
          pending: payload.pending
        }, message)
      } catch (error) {
        console.error(error)
      }
    }

    if (message.title) {
      this.send(message, null, {}, () => ++this.receivedMessages)
      this.sentMessages++
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

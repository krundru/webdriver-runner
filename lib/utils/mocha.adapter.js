import path from 'path'
import Mocha from 'mocha'

const NOOP = function() {}

const EVENTS = {
  'suite': 'suite:start',
  'suite end': 'suite:end',
  'test': 'test:start',
  'test end': 'test:end',
  'pass': 'test:pass',
  'fail': 'test:fail',
  'pending': 'test:pending'
}

class MochaAdapter {
  constructor(specs) {
    this.specs = specs
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
    })
  }

  formatMessage(params) {
    let message = {
      type: params.type
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
      message.title = params.payload.title
      message.parent = params.payload.parent ? params.payload.parent.title : null

      /**
       * get title for hooks in root suite
       */
      if (message.parent === '' && params.payload.parent && params.payload.parent.suites) {
        message.parent = params.payload.parent.suites[0].title
      }

      message.fullTitle = params.payload.fullTitle ? params.payload.fullTitle() : message.parent + ' ' + message.title
      message.pending = params.payload.pending || false
      message.file = params.payload.file

      // Add the current test title to the payload for cases where it helps to
      // identify the test, e.g. when running inside a beforeEach hook
      if (params.payload.ctx && params.payload.ctx.currentTest) {
        message.currentTest = params.payload.ctx.currentTest.title
      }

      if (params.type.match(/Test/)) {
        message.passed = (params.payload.state === 'passed')
        message.duration = params.payload.duration
      }
    }

    return message
  }

  emit(event, payload, err) {
    // For some reason, Mocha fires a second 'suite:end' event for the root suite,
    // with no matching 'suite:start', so this can be ignored.
    if (payload.root) return

    let message = this.formatMessage({
      type: event,
      payload,
      err
    })

    this.send(message, null, {}, () => ++this.receivedMessages)
    this.sentMessages++
  }

  /**
   * reset globals to rewire it out in tests
   */
  send(...args) {
    return process.send.apply(process, args)
  }
}


export default async function(specs) {
  const adapter = new MochaAdapter(specs)
  const result = await adapter.run()
  return result
}

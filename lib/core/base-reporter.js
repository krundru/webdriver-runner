const events = require('events')

class BaseReporter extends events.EventEmitter {
  constructor(resultStore) {
    super()

    this.store = resultStore
    this.reporters = []

    this.on('start', () => {})

    this.on('spec:start', (task) => {
      this.store.specStart(task)
    })

    this.on('suite:start', (suite) => {
      this.store.suiteStart(suite)
    })

    this.on('test:end', (test) => {
      this.store.testEnd(test)
    })

    this.on('test:output', (output) => {
      this.store.testOutput(output)
    })

    this.on('suite:end', (task) => {
      this.store.suiteEnd(task)
    })
  }

  addReporter(reporter) {
    this.reporters.push(reporter)
  }

  handleEvent(...args) {
    if (this.listeners(args[0]).length) {
      this.emit.apply(this, args)
    }

    if (this.reporters.length === 0) {
      return
    }

    for (const reporter of this.reporters) {
      if (typeof reporter.emit !== 'function' || !reporter.listeners(args[0]).length) {
        continue
      }

      reporter.emit.apply(reporter, args)
    }
  }
}

module.exports = BaseReporter


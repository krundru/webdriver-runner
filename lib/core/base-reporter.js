import events from 'events'

class BaseReporter extends events.EventEmitter {
  constructor(resultStore) {
    super()

    this.store = resultStore
    this.reporters = []

    this.on('start', () => {})

    this.on('spec:start', (runner) => {
      this.store.specStart(runner)
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

    this.on('suite:end', (runner) => {
      this.store.suiteEnd(runner)
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

export default BaseReporter


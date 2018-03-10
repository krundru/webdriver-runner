const testRunner = require('./mocha/adapter')

class Executor {
  constructor(task) {
    this.task = task
  }

  async start() {
    this.emitStartEvent()
    global.browserConfig = Object.assign({}, this.task.browser)

    try {
      const failures = await testRunner(this.task)
      this.exitProcess(0, failures)
    } catch (e) {
      console.log('Error testRunner', e)
      this.exitProcess(1, 0)
    }
  }

  exitProcess(code, failures) {
    const message = Object.assign({}, this.task, {
      type: 'spec:end',
      failures: failures
    })
    process.send(message, null, {}, () => {})
    setTimeout(() => {
      process.exit(code)
    }, 1000)
  }

  emitStartEvent() {
    const message = Object.assign({}, this.task, {
      type: 'spec:start'
    })
    process.send(message, null, {}, () => {})
  }
}

process.on('message', (task) => {
  new Executor(task).start()
})

const testRunner = require('./mocha/adapter')

class Executor {
  constructor(task) {
    this.task = task
    this.startDate = new Date().getTime()
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
      failures: failures,
      duration: new Date().getTime() - this.startDate
    })
    process.send(message, null, {}, () => {})
    setTimeout(() => {
      process.exit(code)
    }, 1000)
  }

  emitStartEvent() {
    const message = Object.assign({}, this.task, {
      type: 'spec:start',
      date: this.startDate
    })
    process.send(message, null, {}, () => {})
  }
}

process.on('message', (task) => {
  new Executor(task).start()
})

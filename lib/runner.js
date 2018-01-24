import testRunner from './test/mocha.adapter'
import fs from 'fs'
import path from 'path'

class Runner {
  constructor(task) {
    this.task = task
  }

  async start() {
    this.emitRunnerEvent()
    global.browserConfig = Object.assign({}, this.task.browser)

    try {
      const failures = await testRunner(this.task)
      process.exit(0)
    } catch (e) {
      console.log('Error testRunner', e)
      process.exit(1)
    }
  }

  emitRunnerEvent() {
    const message = Object.assign({}, this.task, {
      type: 'spec:start'
    })
    process.send(message, null, {}, () => {})
    process.on('exit', () => {
      message.type = 'spec:end'
      process.send(message, null, {}, () => {})
    })
  }
}

process.on('message', (task) => {
  new Runner(task).start()
})

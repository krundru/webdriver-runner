import path from 'path'
import childProcess from 'child_process'
import Configuration from './core/configuration'
import ResultStore from './core/result-store'
import BaseReporter from './core/base-reporter'

class Launcher {
  constructor(request) {
    this.config = new Configuration(request)
    this.baseReporter = new BaseReporter(new ResultStore())
    this.tasks = []
    this.processesStarted = 0
  }

  run() {
    this.tasks = this.config.getJobs()
    this.tasks.forEach(task => {
      this.startTestRunner(task)
    })
  }

  messageHandler(msg) {
    this.hasStartedAnyProcess = true
    this.baseReporter.handleEvent(msg.type, msg)
    console.log(msg.type)
  }

  startTestRunner(task) {
    let runner = childProcess.fork(path.join(__dirname, '/runner.js'),
      process.argv.slice(2), {
        cwd: process.cwd()
      })

    runner.on('message', this.messageHandler.bind(this))
    runner.send(task)
    this.processesStarted++
  }
}

export { Launcher }

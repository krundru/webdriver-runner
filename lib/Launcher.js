import path from 'path'
import childProcess from 'child_process'
import Configuration from './utils/configuration'

/**
 * run each spec,
 */
class Launcher {
  constructor(request) {
    this.config = new Configuration(request)
    this.tasks = []
    this.processesStarted = 0
  }

  run() {
    this.tasks = this.config.getJobs()
    this.tasks.forEach(job => {
      this.startTestRunner(job)
    })
  }

  messageHandler(msg) {
    this.hasStartedAnyProcess = true

    console.log(msg.type, msg)
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

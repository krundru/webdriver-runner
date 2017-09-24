import path from 'path'
import childProcess from 'child_process'

/**
 * run each spec,
 */

class Launcher {
  constructor(config) {
    this.config = {
      specs: [
        'specs/another.test.js',
        'specs/other.test.js',
        'specs/simple.chrome.test.js'
      ]
    }

    this.schedule = []
    this.processesStarted = 0
  }

  run() {
    this.config.specs.forEach(file => {
      const specs = [file]
      this.schedule.push({specs})
    })

    this.schedule.forEach(task => {
      this.startTestRunner(task)
    })
  }

  startTestRunner(task) {
    let runner = childProcess.fork(path.join(__dirname, '/runner.js'),
      process.argv.slice(2), {
        cwd: process.cwd()
      })

    runner.send({
        specs: task.specs
    })

    this.processesStarted++
  }
}

export { Launcher }

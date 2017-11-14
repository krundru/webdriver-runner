import path from 'path'
import childProcess from 'child_process'
import Configuration from './core/configuration'
import ResultStore from './core/result-store'
import BaseReporter from './core/base-reporter'

class Launcher {
  constructor(request) {
    this.config = Configuration.of(request)
    this.baseReporter = this.initReporters()
    this.tasks = []
    this.processesStarted = 0
  }

  initReporters() {
    const store = new ResultStore()
    const baseReporter = new BaseReporter(store)
    const reporters = this.config.getReporters()
    for (let Reporter of reporters) {
      if (typeof Reporter === 'function') {
        baseReporter.addReporter(new Reporter(store))
      } else {
        throw new Error(`Invalid custom reporter: ${Reporter}`)
      }
    }

    return baseReporter
  }

  run() {
    const allTasks = this.config.getJobs()
    const browsers = this.config.getBrowserGroups()

    let tasks = []
    for (const browser of browsers) {
      let groupByTasks = allTasks.filter(task => task.group === browser.group)
      groupByTasks = groupByTasks.slice(0, Math.min(browser.shard, groupByTasks.length))
      tasks = tasks.concat(groupByTasks)
    }

    tasks.forEach(task => {
      this.startTestRunner(task)
    })
  }

  messageHandler(msg) {
    if (msg.type === 'error') {
      console.log(msg.error.stack || msg.error.message)
      return process.exit(1)
    }

    this.baseReporter.handleEvent(msg.type, msg)
  }

  startTestRunner(task) {
    let runner = childProcess.fork(
      path.join(__dirname, '/runner.js'),
      process.argv.slice(2), {
        cwd: process.cwd()
      })
    task.submitted = true
    runner.on('message', this.messageHandler.bind(this))
    runner.on('exit', this.runnerExitHandle.bind(this, task))
    runner.send(task)
    this.processesStarted++
  }

  runnerExitHandle(argTask) {
    const pendingTasks = this.config.getJobs().filter(task => !task.submitted)
    if (pendingTasks.length === 0) {
      return this.messageHandler({
        type: 'end'
      })
    }

    const groupTask = pendingTasks.find(task => task.group === argTask.group)
    if (groupTask) {
      this.startTestRunner(groupTask)
    }
  }
}

export { Launcher }

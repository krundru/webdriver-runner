const path = require('path')
const childProcess = require('child_process')
const Configuration = require('./core/configuration')
const ResultStore = require('./core/result-store')
const BaseReporter = require('./core/base-reporter')

class Launcher {
  constructor(request) {
    this.config = Configuration.of(request)
    this.baseReporter = this.initReporters()
    this.tasks = []
    this.processesStarted = 0
    this.completedTasks = 0
    this.stdout = (data) => process.stdout.write(data)
    this.stderr = (data) => process.stderr.write(data)
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

    return new Promise((res) => {
      this.resolve = res
      if (tasks.length === 0) {
        this.resolve(0)
      }

      tasks.forEach(task => {
        this.startTestExecutor(task)
      })
    })
  }

  messageHandler(msg) {
    if (msg.type === 'error') {
      console.log(msg.error.stack || msg.error.message)
      return process.exit(1)
    }

    this.baseReporter.handleEvent(msg.type, msg)
  }

  startTestExecutor(task) {
    const argv = [
      ...process.argv.slice(2),
      ...this.config.getArgv(),
      ...(task.argv || [])
    ]

    let executor = childProcess.fork(
      path.join(__dirname, '/executor.js'),
      argv, {
        stdio: 'pipe',
        cwd: process.cwd()
      })
    executor.stdout.on('data', this.stdout)
    executor.stderr.on('data', this.stderr)
    executor.on('message', this.messageHandler.bind(this))
    executor.on('exit', this.executorExitHandle.bind(this, task))
    executor.send(task)
    task.submitted = true
    this.processesStarted++
  }

  executorExitHandle(argTask) {
    const pendingTasks = this.config.getJobs().filter(task => !task.submitted)
    this.completedTasks++

    if (this.completedTasks === this.config.getJobs().length) {
      this.messageHandler({
        type: 'end'
      })

      return this.resolve(0)
    }

    const groupTask = pendingTasks.find(task => task.group === argTask.group)
    if (groupTask) {
      this.startTestExecutor(groupTask)
    }
  }
}

exports.Launcher = Launcher

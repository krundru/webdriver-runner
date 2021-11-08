const path = require('path')
const childProcess = require('child_process')
const Configuration = require('./core/configuration')
const ResultStore = require('./core/result-store')
const BaseReporter = require('./core/base-reporter')
const log = require('debug')('webdriver-runner:base')
const osu = require('node-os-utils')
const MAX_RETRIES = 10

class Launcher {
  constructor(request) {
    this.config = Configuration.of(request)
    this.baseReporter = this.initReporters()
    this.tasks = []
    this.processesStarted = 0
    this.maxRetry = 0
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
        baseReporter.addReporter(new Reporter(store, this.config.getReporterOptions()))
        log(`Reporter: ${Reporter.name} is added`)
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

    // MaxShards will override browser-level-sharding.
    if (this.config.getMaxShards()) {
      tasks = tasks.slice(0, Math.min(this.config.getMaxShards(), tasks.length))
    }

    return new Promise((res) => {
      this.resolve = res
      if (tasks.length === 0) {
        this.resolve(0)
      }

      // Fire start event with specs details.
      this.messageHandler({
        type: 'start',
        specs: allTasks.map(t => Object.assign({}, t))
      })

      tasks.forEach(task => {
        this.startTestExecutor(task)
      })
    })
  }

  messageHandler(msg) {
    if (msg.type === 'error') {
      console.error('Error occurred', msg.error.stack)
      return process.exit(1)
    }

    this.baseReporter.handleEvent(msg.type, msg)
  }

  startTestExecutor(task) {
    log('Start task:', task.specId, task.specs[0])

    const argv = (task.argv || [])
      .concat(this.config.getArgv())
      .concat(process.argv.slice(2))

    let executor = childProcess.fork(
      path.join(__dirname, '/executor.js'),
      argv, {
        stdio: 'pipe',
        cwd: process.cwd()
      })
    executor.stdout.on('data', this.stdout)
    executor.stderr.on('data', this.stderr)
    executor.on('message', this.messageHandler.bind(this))
    executor.on('error', (code, signal) => {
      log(`child process error occured with code ${code} and signal ${signal}`);
    });
    executor.on('exit', (code, signal) => {
      log(`child process exited with code ${code} and signal ${signal}`);
      if ((code === null && signal === 'SIGABRT') && (this.maxRetry < MAX_RETRIES)) {
        osu.cpu.usage()
          .then(info => {
            log('CPU usage in % is : ', info)
          })
        osu.mem.info()
          .then(info => {
            log('RAM Memory info is: ', info)
          })
        task.submitted = false
        this.maxRetry++
        log('Retrying Task:', task.specId, task.specs[0], '[Retry count - ', this.maxRetry, ']')
      } else {
        this.completedTasks++
      }
      this.executorExitHandle(task)
    });

    executor.send(task)
    task.submitted = true
    this.processesStarted++
  }

  executorExitHandle(argTask) {
    log('End task:', argTask.specId, argTask.specs[0])
    if (this.completedTasks === this.config.getJobs().length) {
      log('All task are executed, so resolves with 0')
      this.messageHandler({
        type: 'end'
      })

      return this.resolve(0)
    }

    // Find task from same browser group or first from pending
    const pendingTasks = this.config.getJobs().filter(task => !task.submitted)
    let task = pendingTasks.find(task => task.group === argTask.group) || pendingTasks[0]
    if (task) {
      this.startTestExecutor(task)
    }
  }
}

exports.Launcher = Launcher

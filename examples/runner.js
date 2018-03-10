const Launcher = require('webdriver-runner/launcher').Launcher
const SpecSummary = require('webdriver-runner/reporters/spec-summary')
const events = require('events')

/**
 * Simple reporter to log test name, file, status together.
 */
class Reporter extends events.EventEmitter {
  constructor(store, reporterOptions) {
    super()
    this.store = store
    this.reporterOptions = reporterOptions
    this.on('test:start', this.testStart.bind(this))
    this.on('test:end', this.testEnd.bind(this))
  }

  testStart(payload) {
    console.log(`test ${this.getTitle(payload)} is started`)
  }

  testEnd(payload) {
    const title = this.getTitle(payload)
    if (payload.state === 'passed') {
      const msg = `${title} is passed`
      console.log(`test ${msg}`)
    } else if (payload.pending) {
      const msg = `${title} is skipped`
      console.log(`test ${msg}`)
    } else {
      console.error(payload.error.stack)
      const msg = `${title} is failed`
      console.log(`test ${msg}`)
    }
  }

  getTitle(payload) {
    const file = payload.file.split('/').pop()
    return `${file}:${payload.title}`
  }
}

const request = {
  mochaOptions: {
    retries: 1,
    requires: ['babel-core/register'],
    timeout: 900000
  },
  // These flags will be available throw process.argv on test scripts.
  execArgv: [
    '--upload',
    '--env=prod'
  ],
  reporters: [Reporter, SpecSummary],
  reporterOptions: {},
  specs: [{
    tests: ['*.test.js'],
    browsers: [{
      name: 'chrome',
      // No of parallel runs.
      shard: 3
    }]
  }]
}

new Launcher(request).run()

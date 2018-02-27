const Launcher = require('webdriver-runner/launcher').Launcher
const SpecSummary = require('webdriver-runner/reporters/spec-summary')

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
  reporters: [SpecSummary],
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

class ResultStore {
  constructor() {
    this.specs = {}
  }

  specStart(task) {
    if (!this.specs[task.specId]) {
      this.specs[task.specId] = task
    }
  }

  suiteStart(suite) {
    const spec = this.specs[suite.specId]
    spec.suites = spec.suites || {}
    spec.suites[suite.sid] = suite
  }

  testEnd(test) {
    const suite = this.specs[test.specId].suites[test.sid]
    suite.tests = suite.tests || []
    suite.tests.push(test)
  }

  testOutput(output) {
    const suite = this.specs[output.specId].suites[output.sid]
    const test = suite.tests[suite.tests.length - 1]
    if (test) {
      test.outputs = test.outputs || []
      test.outputs.push(output)
      console.log('Output added to ', test.title)
    }
  }

  suiteEnd(suite) {
    const suiteOld = this.specs[suite.specId].suites[suite.sid]
    suiteOld.duration = suite.duration
  }

  getSpec(task) {
    return this.specs[task.specId]
  }

  complete() {}
}

module.exports = ResultStore

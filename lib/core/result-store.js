class ResultStore {
  constructor() {
    this.specs = {}
  }

  specStart(payload) {
    this.specs[payload.specId] = Object.assign({
      suites: {}
    }, payload)
  }

  suiteStart(payload) {
    const spec = this.specs[payload.specId]
    spec.suites[payload.suiteId] = Object.assign({
      tests: []
    }, payload)
  }

  testEnd(payload) {
    const suite = this.specs[payload.specId].suites[payload.suiteId]
    suite.tests = suite.tests || []
    suite.tests.push(payload)
  }

  testOutput(payload) {
    const suite = this.specs[payload.specId].suites[payload.suiteId]
    const test = suite.tests[suite.tests.length - 1]
    if (test) {
      test.outputs = test.outputs || []
      test.outputs.push(payload)
    }
  }

  suiteEnd(payload) {
    const suiteOld = this.specs[payload.specId].suites[payload.suiteId]
    suiteOld.duration = payload.duration
  }

  specEnd(payload) {
    const spec = this.specs[payload.specId]
    spec.duration = payload.duration
    spec.failures = payload.failures
  }

  getSpec(payload) {
    return this.specs[payload.specId]
  }

  complete() {}
}

module.exports = ResultStore

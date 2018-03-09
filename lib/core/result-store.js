class ResultStore {
  constructor() {
    this.specs = {}
  }

  specStart(payload) {
    this.specs[payload.specId] = payload
  }

  suiteStart(payload) {
    const spec = this.specs[payload.specId]
    spec.suites = spec.suites || {}
    spec.suites[payload.suiteId] = payload
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

  getSpec(payload) {
    return this.specs[payload.specId]
  }

  complete() {}
}

module.exports = ResultStore

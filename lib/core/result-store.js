export default class ResultStore {
  constructor() {
    this.specs = {}
  }

  specStart(runner) {
    if (!this.specs[runner.rid]) {
      this.specs[runner.rid] = runner
    }
  }

  suiteStart(suite) {
    const spec = this.specs[suite.rid]
    spec.suites = spec.suites || {}
    spec.suites[suite.sid] = suite
  }

  testEnd(test) {
    const suite = this.specs[test.rid].suites[test.sid]
    suite.tests = suite.tests || []
    suite.tests.push(test)
  }

  testOutput(output) {
    const suite = this.specs[output.rid].suites[output.sid]
    const test = suite.tests[suite.tests.length - 1]
    if (test) {
      test.outputs = test.outputs || []
      test.outputs.push(output)
      console.log('Output added to ', test.title)
    }
  }

  suiteEnd(suite) {
    const suiteOld = this.specs[suite.rid].suites[suite.sid]
    suiteOld.duration = suite.duration
  }

  getSpec(runner) {
    return this.specs[runner.rid]
  }

  complete() {}
}

export default class ResultStore {
  constructor() {
    this.specs = {}
  }

  runnerStart(runner) {
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

  suiteEnd(suite) {
    const suiteOld = this.specs[suite.rid].suites[suite.sid]
    suiteOld.duration = suite.duration
  }

  runnerEnd(runner) {
    // const spaces = '                                                    '
    // const spec = this.specs[runner.rid]
    // const suites = Object.keys(spec.suites).map(key => spec.suites[key])
    // let msg = `-----------------------------------------------------------------\n`
    //   .concat(`Spec: ${spec.specs[0]} \n\n`)
    // suites.forEach(suite => {
    //   const indent = suite.depth * 4
    //   msg = msg.concat(spaces.substring(0, indent)).concat(`${suite.title}\n`)
    //   suite.tests.forEach(test => {
    //     msg = msg.concat(spaces.substring(0, 2 + indent))
    //       .concat(`${test.title}\n`)
    //   })
    // })

    // console.log(msg)
  }

  complete() {}
}

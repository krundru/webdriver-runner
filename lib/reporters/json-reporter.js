const events = require('events')
const fs = require('fs')

const SYMBOLS = {
  ok: '✓',
  err: '✖',
  dot: '․',
  error: 'F'
}

class JsonReporter extends events.EventEmitter {
  constructor(store, reportOptions) {
    super()
    this.store = store
    this.options = reportOptions
    this.on('spec:end', (task) => this.printJsonReporter(task))
    this.msg = ''
  }

  log(msg) {
    this.msg = this.msg.concat(msg)
  }

  printJsonReporter(task) {
    this.msg = ''
    const spec = this.store.getSpec(task)
    if (!this.isSummaryRequired(spec)) {
      return
    }

    const suites = Object.keys(spec.suites || {}).map(key => spec.suites[key])
    const tests = suites.reduce((arr, suite) => arr.concat(suite.tests), [])

    var jObj = {}
    var tObj = []

    suites.forEach(suite => {
      suite.tests.forEach(test => {
        var testData = {
          "title": test.title,
          "fullTitle": test.fullTitle,
          "duration": test.duration
        }
        tObj.push(testData)
      })
    })

    var stats = {
      "suites": suites.length,
      "tests": tests.length,
      "passes": tests.filter(t => t.state === 'passed').length,
      "failures": tests.filter(t => t.state === 'failed').length
    };
    jObj['stats'] = stats;
    jObj['tests'] = tObj;

    this.msg = JSON.stringify(jObj);

    console.log(this.msg)
  }

  isSummaryRequired(spec) {
    return  Object.keys(spec.suites).length !== 0 || !spec.mochaOptions.grep
  }

  stringifyDuration(suites) {
    let amount = suites.reduce((sum, suite) => sum + suite.duration, 0)
    if (amount <= 1000) {
      return '~1s'
    }

    amount = Math.round(amount / 100) / 10

    let msg = ''
    if (amount >= 3600) {
      msg = msg.concat(Math.round(amount / 3600)).concat('hr ')
      amount %= 3600
    }
    if (amount >= 60) {
      msg = msg.concat(Math.round(amount / 60)).concat('m ')
      amount %= 60
    }
    if (amount > 0) {
      msg = msg.concat(Math.round(amount)).concat('s')
    }
    return msg
  }
}

module.exports = JsonReporter

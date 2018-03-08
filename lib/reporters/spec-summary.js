const events = require('events')
const chalk = require('chalk')

const SYMBOLS = {
  ok: '✓',
  err: '✖',
  dot: '․',
  error: 'F'
}

class SpecSummary extends events.EventEmitter {
  constructor(store, reportOptions) {
    super()
    this.store = store
    this.options = reportOptions
    this.on('spec:end', (task) => this.printSpecSummary(task))
    this.msg = ''
  }

  log(msg) {
    this.msg = this.msg.concat(msg)
  }

  printSymbol(state) {
    let symbol = '?'
    switch (state) {
      case 'passed':
        symbol = chalk.green(SYMBOLS.ok)
        break
      case 'pending':
        symbol = chalk.yellow('-')
        break
      case 'failed':
        symbol = chalk.red(SYMBOLS.err)
        break
    }
    return symbol
  }

  printSpecSummary(task) {
    const spec = this.store.getSpec(task)
    const browser = spec.browser || {name: 'default'}
    const browserTag = `[${browser.name}] `
    const spaces = '                                                    '
    const suites = Object.keys(spec.suites).map(key => spec.suites[key])
    this.log('-----------------------------------------------------------------\n')
    this.log(`${browserTag}Spec: ${spec.specs[0]} \n`)
    this.log(`${browserTag}Capabilities: ${this.stringifyBrowser(browser)}\n`)
    this.log(`${browserTag}Runtime: ${this.stringifyDuration(suites)}\n`)
    suites.forEach(suite => {
      const indent = suite.depth * 2
      this.log(browserTag + '\n')
      this.log(browserTag)
      this.log(spaces.substring(0, indent))
      this.log(` ${suite.title}\n`)
      suite.tests.forEach(test => {
        this.log(browserTag)
        this.log(spaces.substring(0, 4 + indent))
        this.log(this.printSymbol(test.state))
        this.log(`  ${test.title}\n`)
      })
    })


    this.log(browserTag + '\n')
    this.log(browserTag + '\n')

    const tests = suites.reduce((arr, suite) => arr.concat(suite.tests), [])

    let results = tests.filter(t => t.state === 'passed')
    if (results.length) {
      this.log(browserTag)
      this.log(chalk.green(`${results.length} passing\n`))
    }

    const failedTests = tests.filter(t => t.state === 'failed')
    if (failedTests.length) {
      this.log(browserTag)
      this.log(chalk.red(`${failedTests.length} failed\n`))
    }

    results = tests.filter(t => t.state === 'pending')
    if (results.length) {
      this.log(browserTag)
      this.log(chalk.yellow(`${results.length} pending\n`))
    }

    const failedLogs = this.getFailureList(failedTests, browserTag)
    this.log(failedLogs)

    console.log(this.msg)
  }

  stringifyDuration(suites) {
    let amount = suites.reduce((sum, suite) => sum + suite.duration, 0)
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

  stringifyBrowser(browser) {
    const br = Object.assign({}, browser)
    let msg = (br.name || 'default').concat(' ')
    delete br.name
    return msg + Object.keys(br).map(key => `${key}: ${br[key]}`)
      .join(', ')
  }

  getFailureList (failures, preface) {
    let output = ''

    failures.forEach((test, i) => {
      const title = test.parent ? test.parent + ' ' + test.title : test.title
      output += `${preface.trim()}\n`
      output += preface + `${(i + 1)}) ${title}:` + '\n'
      output += preface + test.err.message + '\n'
      if (test.err.stack) {
        const stack = test.err.stack.split(/\n/g)
        const lines = stack.slice(0, Math.min(8, stack.length))
          .map((l) => `${preface} ${chalk.red(l)}`)
          .join('\n')
        output += `${lines}\n`
      }
    })

    return output
  }
}

module.exports = SpecSummary

import events from 'events'
import chalk from 'chalk'

const SYMBOLS = {
  ok: '✓',
  err: '✖',
  dot: '․',
  error: 'F'
}

class SpecSummary extends events.EventEmitter {
  constructor(store) {
    super()
    this.store = store
    this.on('spec:end', (runner) => this.printSpecSummary(runner))
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

  printSpecSummary(runner) {
    const spec = this.store.getSpec(runner)

    const spaces = '                                                    '
    const suites = Object.keys(spec.suites).map(key => spec.suites[key])
    let msg = '-----------------------------------------------------------------\n'
      .concat(`[default]  Spec: ${spec.specs[0]} \n`)
    suites.forEach(suite => {
      const indent = suite.depth * 2
      msg = msg.concat('[default]\n')
      msg = msg.concat('[default]  ')
        .concat(spaces.substring(0, indent))
        .concat(`${suite.title}\n`)
      suite.tests.forEach(test => {
        msg = msg
          .concat('[default]  ')
          .concat(spaces.substring(0, 4 + indent))
          .concat(this.printSymbol(test.state))
          .concat(` ${test.title}\n`)
      })
    })

    msg = msg.concat('[default]\n')
      .concat('[default]\n')

    const tests = suites.reduce((arr, suite) => arr.concat(suite.tests), [])

    let results = tests.filter(t => t.state === 'passed')
    if (results.length) {
      msg = msg.concat('[default]  ')
        .concat(chalk.green(`${results.length} passing\n`))
    }

    const failedTests = tests.filter(t => t.state === 'failed')
    if (failedTests.length) {
      msg = msg.concat('[default]  ')
        .concat(chalk.red(`${failedTests.length} failed\n`))
    }

    results = tests.filter(t => t.state === 'pending')
    if (results.length) {
      msg = msg.concat('[default]  ')
        .concat(chalk.yellow(`${results.length} pending\n`))
    }

    msg += this.getFailureList(failedTests, '[default]')

    console.log(msg)
  }

  getFailureList (failures, preface) {
    let output = ''

    failures.forEach((test, i) => {
      const title = test.parent ? test.parent + ' ' + test.title : test.title
      output += `${preface.trim()}\n`
      output += preface + ' ' + `${(i + 1)}) ${title}:` + '\n'
      output += preface + ' ' + test.err.message + '\n'
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

export default SpecSummary

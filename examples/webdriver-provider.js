const synchronize = require('webdriver-runner/lib/synchronize')
import {
  Builder, Capabilities
} from 'selenium-webdriver'

let driver = null

function webdriverProvider() {
  if (!driver) {
    const builder = new Builder()

    if (global.browserConfig.name === 'chrome') {
      builder.withCapabilities(Capabilities.chrome())
    } else {
      throw new Error('Unknow browser: ', global.browserConfig.name)
    }
    driver = synchronize.driver(builder.build())
  }

  return driver
}

module.exports = webdriverProvider

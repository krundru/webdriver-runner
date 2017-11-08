import testRunner from './utils/mocha.adapter'
import fs from 'fs'
import path from 'path'
import webdriver from 'selenium-webdriver'

/**
 * 1. Prepare a driver based on capabilities requested
 * 2. start running tests using testRunner.
 * 3. quit driver at end
 * 4.
 *
 */
class Runner {
  constructor(task) {
    this.task = task
  }

  async start() {
    try {
      global.driver = this.buildWebdriver()
      const failures = await testRunner(this.task.specs)
      process.exit(0)
    } catch(e) {
      console.log('Error testRunner', e)
      process.exit(1)
    }
  }

  buildWebdriver() {
    return new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build()
  }
}

process.on('message', (task) => {
  new Runner(task).start()
})

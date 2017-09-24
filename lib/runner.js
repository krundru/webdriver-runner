import testRunner from './mocha.adapter'
import fs from 'fs'
import path from 'path'

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
    // here goes driver creation.

    try {
      const failures = await testRunner(this.task.specs)
      process.exit(0)
    } catch(e) {
      console.log('Error testRunner', e)
      process.exit(1)
    }
  }
}

process.on('message', (task) => {
  new Runner(task).start()
})

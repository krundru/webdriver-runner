const fs = require('fs')
const path = require('path')

/**
 * Saves current screenshot from driver.
 * fileName is resolved from testTitle and saved under given directory.
 *
 * And the same is reported to test-result report with `image` type.
 *
 * Ex:
 *  if (this.currentTest.state !== 'failed') {
 *    wdUtil.saveScreenshot(driver, './', this.currentTest.title)
 *  }
 *
 * @param {Driver} driver sync'ed webdriver
 * @param {String} dir directory under which screenshot will be stored
 * @param {String} testTitle current test title for resolving fileName
 */
function saveScreenshot(driver, dir, testTitle) {
  const data = driver.takeScreenshot()
  const fileName = testTitle.replace(/[^a-zA-Z0-9]/g, '_')
    .concat('_')
    .concat(new Date().getTime())
    .concat('.png')

  const fullPath = path.resolve(dir, fileName)
  fs.writeFileSync(fullPath, data, 'base64')
  reportOutput({
    type: 'image',
    name: fileName,
    file: fullPath
  })
}

/**
 * Add given object to current test report; Input should be a map with type field.
 * obj.type can be any arbitrary name to identify in the report.
 *
 * Usecases are: save webdriver screenshot on test failure and report
 * file locatio to test report.
 *
 * @param {Object} obj
 */
function reportOutput(obj) {
  if (!obj || !obj.type) {
    throw new Error('Invalid output or missing type field')
  }
  process.emit('test:output', obj)
}

exports.saveScreenshot = saveScreenshot
exports.reportOutput = reportOutput

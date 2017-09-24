const assert = require('assert')
const test = require('selenium-webdriver/testing')
const webdriver = require('selenium-webdriver')

test.describe('Google Search', function() {
  this.timeout(20000)

  let driver

  test.before(() =>{
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build()
  })

  test.it('should work', function() {
    driver.get('http://www.google.com')
    var searchBox = driver.findElement(webdriver.By.name('q'))
    searchBox.sendKeys('simple programmer')
    searchBox.getAttribute('value').then(function(value) {
      assert.equal(value, 'simple programmer')
    })
  })

  test.after(() => {
    driver.quit()
  })
})

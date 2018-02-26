# webdriver-runner

``` javascript
  driver.get('https://github.com')
  const exploreLink = driver.findElements(By.css('.HeaderNavlink'))[3]
  exploreLink.click()
  driver.sleep(5000) 
```

Simple test runner for **Synchronized selenium webdriver** tests built on mochajs and selenium-webdriver. this project is heaviley inspired from WebdriverIO & Selenium-Webdriver

**List of features:**
* Synchronous webdriver calls
* Stick to selenium-webdriver API
* Parallelization of test suites
* Custom reports - spec summary
* Html reporter - *pending*
* Screenshots - *pending*

## Usage

Simple webdriver test code which shows how the blocking calls works. Synchronous module from `webdriver-runner` will decorate the actual webdriver instance and provides blocking capabilities

``` javascript
// test module will extend the global methods to run in Fibers/future context
import test from 'webdriver-runner/testing'
import * as synchronize from 'webdriver-runner/synchronize'
import {
  Builder, Capabilities, By
} from 'selenium-webdriver'

test.describe('Google search results', function f() {
  let driver

  test.before(() => {
    const builder = new Builder()
      .withCapabilities(Capabilities.chrome())
    // synchronize all driver methods
    driver = synchronize.driver(builder.build())
  })

  test.it('search-results-verify', () => {
    driver.get('https://www.facebook.com')
    const title = driver.findElement(By.css('h1')).getText()
    console.log(title)
    const links = driver.findElements(By.css('a'))
    links[0].click() // click first link
  })

  test.after(() => {
    driver.quit()
  })
})
```

Example code to configure test suites with browser-capabilities using `webdriver-runner.Launcher`

``` javascript
const Launcher = require('webdriver-runner').Launcher
const SpecSummary = require('webdriver-runner/reporters/spec-summary').default

const request = {
  mochaOptions: {
    retries: 1,
    requires: ['babel-core/register'],
    timeout: 900000
  },
  reporters: [SpecSummary],
  reporterOptions: {},
  specs: [{
    tests: ['tests/*.test.js'],
    // each of this browser instance will be available to test-suite at runtime in global scope (`global.browserConfig`)
    // so, suite can build a new brower instance
    browsers: [{
      name: 'chrome',
      shard: 3
    }]
  }]
}

new Launcher(request).run()
```

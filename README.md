# webdriver-runner

``` javascript
  driver.get('https://github.com')
  const exploreLink = driver.findElements(By.css('.HeaderNavlink'))[3]
  exploreLink.click()
  driver.sleep(5000) 
```

Simple test runner for **Synchronized selenium webdriver** tests built on mochajs and selenium-webdriver. this project is heaviley inspired from WebdriverIO & Selenium-Webdriver

## Install

`npm install webdriver-runner`

Note: `selenium-webdriver` will not be installed as it is not a direct dependency. Client is free to install any versio of selenium-webdriver. 

## Getting started

We are exited that you want to try webdriver-runner. 

webdriver-runner is a simple test runner for webdriver tests. The main features it provides are 
* Making webdriver synchronous.
* Running tests parellel.
* Reporting capabilities.

Webdriver-Runner provides `Launcher` API to trigger tests. it takes a request object of test-files, mocha-options, browser capabilities and others to run. As of now, this library only provides programmable launcher. 

Simple code snippet to start tests:

``` javascript
  const Launcher = require('webdriver-runner').Launcher
  const request = {
    specs: [
      tests: 'test/*.test.js', 
      browsers: [..]
    ]
  }
 new Launcher(request).run()
```
### Create webdriver instance

To keep this library simple & provide maxium flexibility, it dependes on test scripts to create webdriver instance but provides a thin wrap to make driver instance synchronous. So test script will below code snippet

``` javascript
  # file: home-page.test.js 
  import * as synchronize from 'webdriver-runner/synchronize'
  import test from 'webdriver-runner/testing'
    
  const driver 
  test.before(() => {
    const builder = new Builder()
      .withCapabilities(Capabilities.chrome())
        // synchronize all driver methods
    driver = synchronize.driver(builder.build())
  })
```
Few important things here are:
* `webdriver-runner/synchronize` provides `driver` method which wraps origin webdriver instance for adding synchronous capabilities
* `webdriver-test/testing` has all test hooks to provide synchronous context on which driver calls will execute. 
* Calling synchronous methods outside test-hooks will throw Errors. 

### Get browser config

webdriver-runner's Launcher will pass the browser-config to test scripts through global scope. it is test scripts responsibility to create an instance. 

For example: 
`global.browserConfig` will hold the browser object set to Launcher request. 

``` javascript
const browser = global.browserConfig
const builder = new Builder() 
if (browser.name === 'chrome') { 
  builder.withCapabilities(Capabilities.chrome())
} else {
  builder.withCapabilities(Capabilities.firefox())
}
const driverPromise = builder.build()
```

### Test request API

Lets look at other fields in the test request 

``` javascript
const request = {
  // mocha options; see below links for all options
  mochaOptions: {    
    retries: 1,
    requires: ['babel-core/register'], 
    timeout: 900000
  },
  // pass extra flags to test scripts.
  execArgv: [
    '--env=dev'
  ],
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
```
Reference links:
  * [Mocha options]( https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options)
  * [Mocha require(s)](https://mochajs.org/#-r---require-module-name)


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

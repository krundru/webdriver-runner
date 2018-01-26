# webdriver-runner: synchronous driver 

Test runner for webdriver tests built on mochajs and selenium-webdriver. this project is heaviley inspired from WebdriverIO & Selenium-Webdriver

List of features: 
* Synchronous webdriver, free from promises & callbacks. 
* Parallelization of test suites
* Custom reports - spec summary
* Html reporter - pending


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


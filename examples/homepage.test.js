import assert from 'assert'
import fs from 'fs'
import webdriverProvider from './webdriver-provider'
import test from 'webdriver-runner/lib/testing'
import wdUtil from 'webdriver-runner/lib/util'
import * as syncr from 'webdriver-runner/lib/synchronize'
import { By } from 'selenium-webdriver'

test.describe('Github home page', function() {
  let driver

  test.before(() => {
    driver =  webdriverProvider()
  })

  test.it('ignore xit test', function() {
    driver.get('https://github.com/')
    // Find pricing page link
    const link = driver.findElements(By.css('.HeaderNavlink'))[4]
    // Navigate to pricing page
    link.click()
    // Query available plans
    const plans = driver.findElements(By.css('.plans-card'))
    console.log('Number of plans available: ', plans.length)
  })

  test.after(() => {
    driver.quit()
  })
})

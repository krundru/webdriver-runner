import webdriverProvider from './webdriver-provider'
import test from 'webdriver-runner/testing'
import { By, until } from 'selenium-webdriver'

test.describe('W3schools html page', function() {
  let driver

  test.before(() => {
    driver =  webdriverProvider()
  })

  test.it('ignore xit test', function() {
    driver.get('https://www.w3schools.com/html/default.asp')

    // Find all topnav links
    const links = driver.findElements(By.css('.w3-bar-item.w3-button'))
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if(link.getText().toLowerCase().includes('python')) {
        // Navigate to python learning page
        link.click()
        break;
      }
    }

    // Use delegate() method to return actual WebElement, instead of wrapper
    // This method is useful incase of 'Until.*' methods
    const ele = driver.findElement(By.css('a[href*=python_intro'))
    driver.wait(until.elementIsVisible(ele.delegate()))
  })

  test.after(() => {
    driver.quit()
  })
})

import Future from 'fibers/future'

function _s(pr) {
  return Future.fromPromise(pr).wait()
}

function wrap(obj, name) {
  return function(...args) {
    return _s(obj[name](...args))
  }
}

const DRIVER_METHRODS = `actions,close,execute,executeAsyncScript,executeScript,
findElement,findElements,get,getAllWindowHandles,getCapabilities,getCurrentUrl,
getExecutor,getPageSource,getSession,getTitle,getWindowHandle,manage,
navigate,quit,setFileDetector,sleep,switchTo,takeScreenshot,wait`

const ELEMENT_METHODS = `clear,click,findElement,findElements,getAttribute,getCssValue,
getDriver,getId,getRect,getTagName,getText,isDisplayed,isEnabled,isSelected,sendKeys,
submit,takeScreenshot,buildId,equals,extractId,isId`

class SyncElement {
  constructor(_ele, _driver) {
    this.ele = _ele
    this.driver = _driver
    ELEMENT_METHODS.split(',').forEach(name => {
      name = name.trim()
      this[name] = wrap(_ele, name)
    })
  }
}

class SyncDriver {
  constructor(_driver) {
    this.driver = _driver
    DRIVER_METHRODS.split(',').forEach(name => {
      name = name.trim()
      this[name] = wrap(_driver, name)
    })
  }

  findElement(by) {
    return new SyncElement(_s(this.driver.findElement(by)), this.driver)
  }

  findElements(by) {
    return _s(this.driver.findElements(by)).map(el => new SyncElement(el))
  }
}

export function driver(driverPromise) {
  return new SyncDriver(_s(driverPromise))
}

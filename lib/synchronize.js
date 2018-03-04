const Future = require('fibers/future')

/**
 * Base wrapper to wrap webdriver methods
 */
class Wrapper {
  static syncify(promise) {
    return Future.fromPromise(promise).wait()
  }

  static wrap(obj, name, converter) {
    return function(...args) {
      if (!obj[name]) {
        throw new Error(`Current selenium-webdriver version doesn't support '${name}' method`)
      }
      const val = obj[name](...args)
      return converter ? converter(val, this) : val
    }
  }

  static wrapAsync(obj, name, converter) {
    return function(...args) {
      if (!obj[name]) {
        throw new Error(`Current selenium-webdriver version doesn't support '${name}' method`)
      }
      const val = Wrapper.syncify(obj[name](...args))
      return converter ? converter(val, this) : val
    }
  }

  constructor(obj, methods, wrapFn, converter) {
    wrapFn = wrapFn || Wrapper.wrapAsync
    methods.split(',').forEach(name => {
      name = name.trim()
      this[name] = wrapFn(obj, name, converter)
    })
  }
}

/** Wrap WebDriver class */
const DRIVER_METHRODS = `close,execute,get,getAllWindowHandles,getCapabilities,
getCurrentUrl,getExecutor,getPageSource,getSession,getTitle,getWindowHandle,
manage,quit,sleep,takeScreenshot`
class Driver extends Wrapper {
  static _args(args) {
    return args.map(a => a instanceof Element ? a.ele : a)
  }

  constructor(_driver) {
    super(_driver, DRIVER_METHRODS)
    this.driver = _driver
    this.actions = Wrapper.wrap(_driver, 'actions', val => new Actions(val))
    this.findElement = Wrapper.wrapAsync(_driver, 'findElement',
      (val, obj) => new Element(val, obj))
    this.manage = Wrapper.wrap(_driver, 'manage', val => new Options(val))
    this.navigate = Wrapper.wrap(_driver, 'navigate', val => new Navigation(val))
    this.switchTo = Wrapper.wrap(_driver, 'switchTo', val => new TargetLocator(val))
    this.setFileDetector = Wrapper.wrap(_driver, 'setFileDetector')
    this.wait = Wrapper.wrapAsync(_driver, 'wait', (val, obj) => new Element(val, obj))
    this._sync = true
  }

  executeScript(script, ...args) {
    return Wrapper.syncify(this.driver.executeScript(script, ...Driver._args(args)))
  }

  executeAsyncScript(script, ...args) {
    return Wrapper.syncify(this.driver.executeAsyncScript(script, ...Driver._args(args)))
  }

  findElements(by) {
    return Wrapper.syncify(this.driver.findElements(by)).map(el => new Element(el, this.driver))
  }
}

/** Wrap WebELement class */
const ELEMENT_METHODS = `catch,clear,click,findElement,findElements,getAttribute,getCssValue,
getId,getRect,getTagName,getText,isDisplayed,isEnabled,isSelected,sendKeys,
submit,takeScreenshot,buildId,equals,extractId,isId`
class Element extends Wrapper {
  constructor(_ele, _driver) {
    super(_ele, ELEMENT_METHODS)
    this.ele = _ele
    this.getDriver = () => _driver
  }
}

/** Wrap Actions class */
const ACTIONS_METHODS = `clear,click,contextClick,doubleClick,dragAndDrop,insert,keyDown,
keyUp,keyboard,mouse,mouseDown,mouseMove,mouseUp,move,pause,press,release,sendKeys,synchronize`
class Actions extends Wrapper {
  constructor(actions) {
    super(actions, ACTIONS_METHODS, Wrapper.wrap, (val, obj) => obj)
    this.perform = Wrapper.wrapAsync(actions, 'perform')
    this.keyboard = Wrapper.wrapAsync(actions, 'keyboard')
    this.pointer = Wrapper.wrapAsync(actions, 'pointer')
  }
}

/** Wrap Options class */
const OPTIONS_METHODS = `addCookie,deleteAllCookies,deleteCookie,getCookie,getCookies,
getTimeouts,setTimeouts`
class Options extends Wrapper {
  constructor(options) {
    super(options, OPTIONS_METHODS)
    this.window = Wrapper.wrapAsync(options, 'window', val => new Window(val))
    this.logs = Wrapper.wrapAsync(options, 'logs', val => new Logs(val))
  }
}

/** Wrap Window class */
const WINDOW_METHODS = 'fullscreen,getRect,maximize,minimize,setRect'
class Window extends Wrapper {
  constructor(window) {
    super(window, WINDOW_METHODS)
  }
}

/** Wrap Logs class */
const LOGS_METHODS = 'get,getAvailableLogTypes'
class Logs extends Wrapper {
  constructor(logs) {
    super(logs, LOGS_METHODS)
  }
}

/** Wrap Navigation class */
const NAV_METHODS = 'back,forward,refresh,to'
class Navigation extends Wrapper {
  constructor(navigation) {
    super(navigation, NAV_METHODS)
  }
}

/** Wrap TargetLocator class */
const TAR_LOC_GET_METHODS = 'activeElement,alert,defaultContent,frame,parentFrame,window'
class TargetLocator extends Wrapper {
  constructor(target) {
    super(target, TAR_LOC_GET_METHODS)
  }
}

/**
 * Wrap webdriver to make synchronous
 *
 * @param {DriverPromise} driverPromise
 */
exports.driver = function (driverPromise) {
  return new Driver(Wrapper.syncify(driverPromise))
}

/**
 * Util method for converting given promise-function to synchronize method.
 *
 * @param fn a function which returns promise.
 */
exports.wrap = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Input must be a function type')
  }
  return function(...args) {
    try {
      const pr = fn(...args)
      if (!pr.then) {
        throw new Error('Return value must be a promise')
      }
      return Wrapper.syncify(pr)
    } catch (error) {
      throw error
    }
  }
}

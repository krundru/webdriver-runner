const Future = require('fibers/future')

/**
 * Wraps a function on Mocha's BDD interface so it runs inside a
 * webdriver.promise.ControlFlow and waits for the flow to complete before
 * continuing.
 * @param {!Function} globalFn The function to wrap.
 * @return {!Function} The new function.
 */
function wrapped(globalFn) {
  return function() {
    try {
      if (arguments.length === 1) {
        return globalFn(wrapFiberContext(arguments[0]))
      }
      if (arguments.length === 2) {
        return globalFn(arguments[0], wrapFiberContext(arguments[1]))
      }
      throw Error('Invalid # arguments: ' + arguments.length)
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

/**
 * Wrap life-cycle function arguments with Fiber context
 * @param {!Function} fn life-cycle method
 */
function wrapFiberContext(fn) {
  return function() {
    const that = this
    if (typeof fn === 'function') {
      return new Promise((res, rej) => {
        Future.task(() => {
          try {
            fn.apply(that)
            res()
          } catch (e) {
            console.log(e)
            rej(e)
          }
        })
      })
    }
    return fn
  }
}

/**
 * Ignores the test chained to this function if the provided predicate returns
 * true.
 * @param {function(): boolean} predicateFn A predicate to call to determine
 *     if the test should be suppressed. This function MUST be synchronous.
 * @return {!Object} An object with wrapped versions of {@link #it()} and
 *     {@link #describe()} that ignore tests as indicated by the predicate.
 */
function ignore(predicateFn) {
  var describe = wrap(exports.xdescribe, exports.describe)
  describe.only = wrap(exports.xdescribe, exports.describe.only)

  var it = wrap(exports.xit, exports.it)
  it.only = wrap(exports.xit, exports.it.only)

  return {
    describe: describe,
    it: it
  }

  function wrap(onSkip, onRun) {
    return function(title, fn) {
      if (predicateFn()) {
        onSkip(title, fn)
      } else {
        onRun(title, fn)
      }
    }
  }
}

exports.after = wrapped(global.after)
exports.afterEach = wrapped(global.afterEach)
exports.before = wrapped(global.before)
exports.beforeEach = wrapped(global.beforeEach)
exports.describe = global.describe
exports.it = wrapped(global.it)
exports.ignore = ignore

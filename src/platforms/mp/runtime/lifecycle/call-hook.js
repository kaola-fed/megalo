import { handleError } from 'core/util/index'

function walkInTree (vm, fn, options = {}) {
  let result
  const { bottomToTop = false } = options

  if (!bottomToTop) {
    result = fn(vm)
  }

  /* istanbul ignore else */
  if (vm.$children) {
    for (let i = vm.$children.length - 1; i >= 0; i--) {
      const child = vm.$children[i]
      result = walkInTree(child, fn, options) || result
    }
  }

  if (bottomToTop) {
    result = fn(vm)
  }

  return result
}

function doCallHook (vm, hook, options) {
  let handlers = vm.$options[hook] || []
  if (!Array.isArray(handlers)) {
    handlers = [handlers]
  }
  return handlers.reduce((res, handler) => {
    try {
      return handler.call(vm, options)
    } catch (err) {
      handleError(err, vm, `lifecycle hook error "${hook}"`)
    }
  }, undefined)
}

export function callHook (vm, hook, options) {
  /* istanbul ignore if */
  if (!vm) {
    return
  }

  let result

  if (hook === 'onReady') {
    result = walkInTree(vm, function (curVM) {
      doCallHook(curVM, hook, options)
    }, { bottomToTop: true })
  } else {
    result = walkInTree(vm, function (curVM) {
      return doCallHook(curVM, hook, options)
    })
  }

  if (hook === 'onUnload') {
    const rootVM = vm.$root
    rootVM.$destroy()
  }

  return result
}

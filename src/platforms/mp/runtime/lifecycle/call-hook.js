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

export function callHook (vm, hook, options) {
  /* istanbul ignore if */
  if (!vm) {
    return
  }

  let result

  if (hook === 'onReady') {
    result = walkInTree(vm, function (_vm) {
      const handler = _vm.$options[hook]
      handler && handler.call(_vm, options)
    }, { bottomToTop: true })
  } else {
    result = walkInTree(vm, function (_vm) {
      const handler = _vm.$options[hook]
      return handler && handler.call(_vm, options)
    })
  }

  if (hook === 'onUnload') {
    const rootVM = vm.$root
    rootVM.$destroy()
  }

  return result
}

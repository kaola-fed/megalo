export function aop (fn, options = {}) {
  const { before, after } = options
  return function (...args) {
    const self = this

    if (before) {
      before.call(self, args, ...args)
    }

    const ret = fn.call(self, ...args)

    if (after) {
      after.call(self, ret, ...args, ret)
    }

    return ret
  }
}

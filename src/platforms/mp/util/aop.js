export function aop (fn, options = {}) {
  const { before, after, argsCount } = options
  return function (...args) {
    const self = this
    let ag = new Array(argsCount || 0)
    Object.assign(ag, args)

    if (argsCount !== undefined) {
      ag = ag.slice(0, argsCount)
    }
    if (before) {
      before.call(self, ...ag)
    }

    const ret = fn.call(self, ...ag)

    if (after) {
      after.call(self, ...ag, ret)
    }

    return ret
  }
}

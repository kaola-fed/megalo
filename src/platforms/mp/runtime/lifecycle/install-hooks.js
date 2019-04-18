import { callHook } from './call-hook'

export function installHooks(pageOptions, vueOptions, hooks) {
  hooks.forEach(hook => {
    if (
      vueOptions[hook] ||
      // hooks definition is store in options in typescript
      (vueOptions.options && vueOptions.options[hook])
    ) {
      pageOptions[hook] = function hookFn(options) {
        return callHook(this.rootVM, hook, options)
      }
    }
  })
}
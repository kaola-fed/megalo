import { initRootVM } from 'mp/runtime/instance/index'
import { callHook } from './call-hook'
import { installHooks } from './install-hooks'

const app = {}

const hooks = [
  'onShow',
  'onHide',
  'onError',
  'onPageNotFound'
]

app.init = function (vueOptions) {
  let mpApp

  /* istanbul ignore else */ 
  if (typeof my === 'undefined') {
    mpApp = App
  } else {
    // 支付宝小程序中 App() 必须在 app.js 里调用，且不能调用多次。
    mpApp = my.__megalo.App // eslint-disable-line
  }
  const appOptions = {
    data: {},
    globalData: {},
    onLaunch (options = {}) {
      const rootVM = this.rootVM = initRootVM(this, vueOptions, options.query)
      const { globalData } = rootVM.$options
      this.globalData = (
        globalData && (
          typeof globalData === 'function'
            ? globalData.call(rootVM, options)
            : globalData
          )
        || {}
      )
      rootVM.globalData = this.globalData
      rootVM.$mount()
      callHook(rootVM, 'onLaunch', options)
    }
  } 
  installHooks(appOptions, vueOptions.options, hooks)
  mpApp(appOptions)
}

export default app

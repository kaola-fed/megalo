import { initRootVM, proxyEvent } from 'mp/runtime/instance/index'
import { callHook } from './call-hook'
import { installHooks } from './install-hooks'
import { ROOT_DATA_VAR } from 'mp/util/index'

const page = {}
const hooks = [
  'onPullDownRefresh',
  'onReachBottom',
  'onShareAppMessage',
  'onPageScroll',
  'onTabItemTap',
  'onTitleClick'
]

page.init = function init (vueOptions) {
  const pageOptions = {
    // 生命周期函数--监听页面加载
    data: {
      [ROOT_DATA_VAR]: {}
    },
    onLoad (options) {
      const rootVM = this.rootVM = initRootVM(this, vueOptions, options)

      callHook(rootVM, 'onLoad', options)

      rootVM.$mount()

      rootVM.$mp._instantUpdate()
    },
    onReady (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'ready'

      callHook(rootVM, 'onReady', options)
    },
    onShow (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'show'
      callHook(rootVM, 'onShow', options)
    },
    onHide (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'hide'
      callHook(rootVM, 'onHide', options)
    },
    onUnload (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'unload'
      callHook(rootVM, 'onUnload', options)
    },

    _pe (e) {
      this.proxyEvent(e)
    },
    proxyEvent (e) {
      const rootVM = this.rootVM
      proxyEvent(rootVM, e)
    }
  }

  installHooks(pageOptions, vueOptions.options, hooks)
  Page(pageOptions)
}

export default page

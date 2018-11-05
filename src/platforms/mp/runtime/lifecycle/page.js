import { initRootVM, proxyEvent } from 'mp/runtime/instance/index'
import { callHook } from './call-hook'
import { ROOT_DATA_VAR } from 'mp/util/index'

const page = {}

page.init = function init (opt) {
  Page({
    // 生命周期函数--监听页面加载
    data: {
      [ROOT_DATA_VAR]: {}
    },
    onLoad (options) {
      const rootVM = this.rootVM = initRootVM(this, opt)

      callHook(rootVM, 'onLoad', options)
    },
    // 生命周期函数--监听页面初次渲染完成
    onReady (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'ready'
      rootVM.$mount()

      callHook(rootVM, 'onReady', options)
    },
    // 生命周期函数--监听页面显示
    onShow (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'show'
      callHook(rootVM, 'onShow', options)
    },
    // 生命周期函数--监听页面隐藏
    onHide (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'hide'
      callHook(rootVM, 'onHide', options)
    },
    // 生命周期函数--监听页面卸载
    onUnload (options) {
      const rootVM = this.rootVM
      const mp = rootVM.$mp

      mp.status = 'unload'
      callHook(rootVM, 'onUnload', options)
    },
    // 页面相关事件处理函数--监听用户下拉动作
    onPullDownRefresh (options) {
      const rootVM = this.rootVM

      callHook(rootVM, 'onPullDownRefresh', options)
    },
    // 页面上拉触底事件的处理函数
    onReachBottom (options) {
      const rootVM = this.rootVM

      callHook(rootVM, 'onReachBottom', options)
    },
    // 用户点击右上角转发
    onShareAppMessage (options) {
      const rootVM = this.rootVM

      return callHook(rootVM, 'onShareAppMessage', options)
    },
    // 页面滚动触发事件的处理函数
    onPageScroll (options) {
      const rootVM = this.rootVM

      callHook(rootVM, 'onPageScroll', options)
    },
    // 当前是 tab 页时，点击 tab 时触发
    onTabItemTap (options) {
      const rootVM = this.rootVM

      callHook(rootVM, 'onTabItemTap', options)
    },
    // 支付宝小程序: 标题被点击
    onTitleClick () {
      const rootVM = this.rootVM

      callHook(rootVM, 'onTitleClick')
    },
    _pe (e) {
      this.proxyEvent(e)
    },
    proxyEvent (e) {
      const rootVM = this.rootVM
      proxyEvent(rootVM, e)
    }
  })
}

export default page

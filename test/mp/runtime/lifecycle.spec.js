import {
  initMPEnvironment,
  App,
  Page,
  Vue,
  spyFn
} from '../helpers'

initMPEnvironment()

describe('lifecycle', () => {
  it('App lifecycle', () => {
    const pageOptions = {
      mpType: 'app',
      template: `<div></div>`,
      beforeCreate: spyFn('beforeCreate'),
      created: spyFn('created'),
      beforeMount: spyFn('beforeMount'),
      mounted: spyFn('mounted'),
      destroyed: spyFn('destroyed'),
      onLaunch: spyFn('onLaunch'),
      onShow: spyFn('onShow'),
      onHide: spyFn('onHide'),
      onError: spyFn('onError'),
      onPageNotFound: spyFn('onPageNotFound')
    }

    new Vue(pageOptions).$mount()

    // before app instance created
    expect(pageOptions.beforeCreate).not.toHaveBeenCalled()
    expect(pageOptions.created).not.toHaveBeenCalled()
    expect(pageOptions.beforeMount).not.toHaveBeenCalled()
    expect(pageOptions.mounted).not.toHaveBeenCalled()
    expect(pageOptions.destroyed).not.toHaveBeenCalled()

    // page onLaunch
    const mpApp = App.createInstance()
    mpApp._callHook('onLaunch')
    expect(pageOptions.beforeCreate).toHaveBeenCalledTimes(1)
    expect(pageOptions.onLaunch).toHaveBeenCalledTimes(1)
    expect(pageOptions.created).toHaveBeenCalledTimes(1)
    expect(pageOptions.beforeMount).toHaveBeenCalledTimes(1)
    expect(pageOptions.mounted).toHaveBeenCalledTimes(1)
    expect(pageOptions.destroyed).not.toHaveBeenCalled()

    mpApp._callHook('onShow')
    expect(pageOptions.onShow).toHaveBeenCalledTimes(1)

    mpApp._callHook('onHide')
    expect(pageOptions.onHide).toHaveBeenCalledTimes(1)

    mpApp._callHook('onError')
    expect(pageOptions.onError).toHaveBeenCalledTimes(1)

    mpApp._callHook('onPageNotFound')
    expect(pageOptions.onPageNotFound).toHaveBeenCalledTimes(1)
  })

  it('Page lifecycle', () => {
    const pageOptions = {
      mpType: 'page',
      template: `<div></div>`,
      beforeCreate: spyFn('beforeCreate'),
      created: spyFn('created'),
      beforeMount: spyFn('beforeMount'),
      mounted: spyFn('mounted'),
      destroyed: spyFn('destroyed'),
      onLoad: spyFn('onLoad'),
      onUnload: spyFn('onUnload'),
      onReady: spyFn('onReady'),
      onShow: spyFn('onShow'),
      onHide: spyFn('onHide'),
      onPullDownRefresh: spyFn('onPullDownRefresh'),
      onReachBottom: spyFn('onReachBottom'),
      onPageScroll: spyFn('onPageScroll'),
      onTabItemTap: spyFn('onTabItemTap'),
      onShareAppMessage: spyFn('onShareAppMessage').and.returnValue({ from: 'megalo' })
    }

    new Vue(pageOptions).$mount()

    // before page instance created
    expect(pageOptions.beforeCreate).not.toHaveBeenCalled()
    expect(pageOptions.created).not.toHaveBeenCalled()
    expect(pageOptions.beforeMount).not.toHaveBeenCalled()
    expect(pageOptions.mounted).not.toHaveBeenCalled()
    expect(pageOptions.destroyed).not.toHaveBeenCalled()

    // page onLoad
    const page = Page.createInstance()
    page._callHook('onLoad', { query: { id: 100 }})
    const rootVM = page.rootVM
    // access $mp
    expect(rootVM.$mp.page).toBe(page)
    expect(rootVM.$mp.options).toBe(page.options)
    // hook called
    expect(pageOptions.beforeCreate).toHaveBeenCalledTimes(1)
    expect(pageOptions.created).toHaveBeenCalledTimes(1)
    expect(pageOptions.onLoad).toHaveBeenCalledTimes(1)
    expect(pageOptions.beforeMount).not.toHaveBeenCalled()
    expect(pageOptions.mounted).not.toHaveBeenCalled()
    expect(pageOptions.destroyed).not.toHaveBeenCalled()

    // page onReady
    page._callHook('onReady')
    expect(pageOptions.beforeCreate).toHaveBeenCalledTimes(1)
    expect(pageOptions.created).toHaveBeenCalledTimes(1)
    expect(pageOptions.onReady).toHaveBeenCalledTimes(1)
    expect(pageOptions.beforeMount).toHaveBeenCalledTimes(1)
    expect(pageOptions.mounted).toHaveBeenCalledTimes(1)
    expect(pageOptions.destroyed).not.toHaveBeenCalled()

    // page onShow
    page._callHook('onShow')
    expect(pageOptions.onShow).toHaveBeenCalledTimes(1)

    // page onHide
    page._callHook('onHide')
    expect(pageOptions.onHide).toHaveBeenCalledTimes(1)

    // page onPullDownRefresh
    page._callHook('onPullDownRefresh')
    expect(pageOptions.onPullDownRefresh).toHaveBeenCalledTimes(1)

    // page onReachBottom
    page._callHook('onReachBottom')
    expect(pageOptions.onReachBottom).toHaveBeenCalledTimes(1)

    // page onPageScroll
    page._callHook('onPageScroll', { scrollTop: 100 })
    expect(pageOptions.onPageScroll).toHaveBeenCalledWith({ scrollTop: 100 })
    expect(pageOptions.onPageScroll).toHaveBeenCalledTimes(1)

    // page onTabItemTap
    page._callHook('onTabItemTap', { index: 100 })
    expect(pageOptions.onTabItemTap).toHaveBeenCalledWith({ index: 100 })
    expect(pageOptions.onTabItemTap).toHaveBeenCalledTimes(1)

    // page onShareAppMessage
    const shareConfig = page._callHook('onShareAppMessage')
    expect(pageOptions.onShareAppMessage).toHaveBeenCalledTimes(1)
    expect(shareConfig).toEqual({ from: 'megalo' })

    // page onUnload
    page._callHook('onUnload')
    expect(pageOptions.onUnload).toHaveBeenCalledTimes(1)
    expect(pageOptions.destroyed).toHaveBeenCalledTimes(1)
  })

  it('Component lifecycle', () => {
    const compOptions = {
      template: '<div>test</div>',
      beforeCreate: spyFn('beforeCreate'),
      created: spyFn('created'),
      beforeMount: spyFn('beforeMount'),
      mounted: spyFn('mounted'),
      destroyed: spyFn('destroyed'),
      onLoad: spyFn('onReady'),
      onUnload: spyFn('onReady'),
      onReady: spyFn('onReady'),
      onShow: spyFn('onShow'),
      onHide: spyFn('onHide'),
      onPullDownRefresh: spyFn('onPullDownRefresh'),
      onReachBottom: spyFn('onReachBottom'),
      onPageScroll: spyFn('onPageScroll'),
      onTabItemTap: spyFn('onTabItemTap'),
      onShareAppMessage: spyFn('onShareAppMessage').and.returnValue({ from: 'megalo' })
    }
    const pageOptions = {
      mpType: 'page',
      template: `<div><test/></div>`,
      components: {
        test: compOptions
      }
    }

    new Vue(pageOptions).$mount()

    // before page instance created
    expect(compOptions.beforeCreate).not.toHaveBeenCalled()
    expect(compOptions.created).not.toHaveBeenCalled()
    expect(compOptions.beforeMount).not.toHaveBeenCalled()
    expect(compOptions.mounted).not.toHaveBeenCalled()
    expect(compOptions.destroyed).not.toHaveBeenCalled()

    // page onLoad
    const page = Page.createInstance()
    page._callHook('onLoad', { query: { id: 100 }})

    // hook called
    expect(compOptions.beforeCreate).not.toHaveBeenCalled()
    expect(compOptions.created).not.toHaveBeenCalled()
    expect(compOptions.beforeMount).not.toHaveBeenCalled()
    expect(compOptions.mounted).not.toHaveBeenCalled()
    expect(compOptions.destroyed).not.toHaveBeenCalled()

    // page onReady
    page._callHook('onReady')
    expect(compOptions.onLoad).toHaveBeenCalledTimes(0)
    expect(compOptions.onReady).toHaveBeenCalledTimes(1)
    expect(compOptions.beforeCreate).toHaveBeenCalledTimes(1)
    expect(compOptions.created).toHaveBeenCalledTimes(1)
    expect(compOptions.beforeMount).toHaveBeenCalledTimes(1)
    expect(compOptions.mounted).toHaveBeenCalledTimes(1)
    expect(compOptions.destroyed).not.toHaveBeenCalled()

    // page onShow
    page._callHook('onShow')
    expect(compOptions.onShow).toHaveBeenCalledTimes(1)

    // page onHide
    page._callHook('onHide')
    expect(compOptions.onHide).toHaveBeenCalledTimes(1)

    // page onPullDownRefresh
    page._callHook('onPullDownRefresh')
    expect(compOptions.onPullDownRefresh).toHaveBeenCalledTimes(1)

    // page onReachBottom
    page._callHook('onReachBottom')
    expect(compOptions.onReachBottom).toHaveBeenCalledTimes(1)

    // page onPageScroll
    page._callHook('onPageScroll', { scrollTop: 100 })
    expect(compOptions.onPageScroll).toHaveBeenCalledWith({ scrollTop: 100 })
    expect(compOptions.onPageScroll).toHaveBeenCalledTimes(1)

    // page onTabItemTap
    page._callHook('onTabItemTap', { index: 100 })
    expect(compOptions.onTabItemTap).toHaveBeenCalledWith({ index: 100 })
    expect(compOptions.onTabItemTap).toHaveBeenCalledTimes(1)

    // page onShareAppMessage
    const shareConfig = page._callHook('onShareAppMessage')
    expect(compOptions.onShareAppMessage).toHaveBeenCalledTimes(1)
    expect(shareConfig).toEqual({ from: 'megalo' })

    // page onUnload
    page._callHook('onUnload')
    expect(compOptions.onUnload).toHaveBeenCalledTimes(1)
    expect(compOptions.destroyed).toHaveBeenCalledTimes(1)
  })
})

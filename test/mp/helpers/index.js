import { App, Page } from './mp-runtime'
import Vue from './entry-runtime-with-compiler'

export function initMPEnvironment () {
  global.Page = Page
  global.App = App
}

initMPEnvironment()

export function tick (delay) {
  jasmine.clock().install()
  jasmine.clock().tick(delay)
  jasmine.clock().uninstall()
}

export function spyFn (...args) {
  return jasmine.createSpy(...args)
}

export function createPage (options, delay = 1000) {
  delay && jasmine.clock().install()

  options = Object.assign({}, options, { mpType: 'page' })

  new Vue(options).$mount()
  const page = Page.createInstance()
  page._init()

  // setData with throttle with leading delay
  delay && jasmine.clock().tick(delay)

  delay && jasmine.clock().uninstall()
  return page
}

export {
  App,
  Page,
  Vue
}

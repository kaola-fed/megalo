import Vue from '../../helpers/entry-runtime-with-compiler'
import { createPage, getPageData } from '../../helpers'

describe('Directive v-for', () => {
  function installVHtmlParser (Vue) {
    Vue.prototype.$htmlParse = function (html) {
      return {
        nodes: html
      }
    }
  }

  function uninstallVHtmlParser (Vue) {
    Vue.prototype.$htmlParse = undefined
  }

  beforeEach(() => {
    jasmine.clock().install()
    installVHtmlParser(Vue)
  })

  afterEach(() => {
    jasmine.clock().uninstall()
    uninstallVHtmlParser(Vue)
  })

  it('should render raw html without plugin', () => {
    uninstallVHtmlParser(Vue)
    const { page } = createPage({
      template: '<div v-html="a"></div>',
      data: { a: 'hello' }
    })
    const pageData = getPageData(page, '0')
    expect(pageData._h[0].html).toEqual('hello')
  })

  // output depends on the htmlParse plugin
  it('should render html', () => {
    const { page } = createPage({
      template: '<div v-html="a"></div>',
      data: { a: 'hello' }
    })
    const pageData = getPageData(page, '0')
    expect(pageData._h[0].html).toEqual({
      nodes: 'hello'
    })
  })
})

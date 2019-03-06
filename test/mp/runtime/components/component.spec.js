import Vue from '../../helpers/entry-runtime-with-compiler'
import { createPage, getPageData } from '../../helpers'

describe('Component', () => {
  let warn
  beforeEach(() => {
    warn = console.warn
    console.warn = jasmine.createSpy()
    jasmine.clock().install()
  })

  afterEach(() => {
    console.warn = warn
    jasmine.clock().uninstall()
  })

  it('static', () => {
    const { page } = createPage({
      template: '<test></test>',
      components: {
        test: {
          data () {
            return { a: 123 }
          },
          template: '<span>{{a}}</span>'
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.h['1'].t).toBe('123')
  })

  it('using component in restricted elements', () => {
    const { page } = createPage({
      template: '<div><table><tbody><test></test></tbody></table></div>',
      components: {
        test: {
          data () {
            return { a: 123 }
          },
          template: '<tr><td>{{a}}</td></tr>'
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.h['2'].t).toBe('123')
  })

  // "is" is not supported
  it('"is" attribute', () => {
    pending()
    const { page } = createPage({
      template: '<div><table><tbody><tr is="test"></tr></tbody></table></div>',
      components: {
        test: {
          data () {
            return { a: 123 }
          },
          template: '<tr><td>{{a}}</td></tr>'
        }
      }
    })
    const comp1 = getPageData(page, '0,0')
    expect(comp1.h['2'].t).toBe('123')
  })

  // inline-template not supported

  it('fragment instance warning', () => {
    createPage({
      template: '<test></test>',
      components: {
        test: {
          data () {
            return { a: 123, b: 234 }
          },
          template: '<p>{{a}}</p><p>{{b}}</p>'
        }
      }
    })

    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `Component template should contain exactly one root element`
    )
  })

  // dynamic component is not supported

  // TODO: hidden is not working on template, try to make this work
  it('should compile parent template directives & content in parent scope', done => {
    pending()
    const { page, vm } = createPage({
      data: {
        ok: false,
        message: 'hello'
      },
      template: '<test v-show="ok">{{message}}</test>',
      components: {
        test: {
          template: '<div><slot></slot> {{message}}</div>',
          data () {
            return {
              message: 'world'
            }
          }
        }
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h['0'].vs).toBe(!false)
    expect(comp1.s['s2'].t).toBe('hello')
    expect(comp1.h['3'].t).toBe(' world')
    vm.ok = true
    vm.message = 'bye'
    waitForUpdate(() => {
      expect(pageData.h['0'].vs).toBe(!true)
      expect(comp1.s['s2'].t).toBe('bye')
      expect(comp1.h['3'].t).toBe(' world')
    }).then(done)
  })

  it('parent content + v-if', done => {
    const { page, vm } = createPage({
      data: {
        ok: false,
        message: 'hello'
      },
      template: '<test v-if="ok">{{message}}</test>',
      components: {
        test: {
          template: '<div><slot></slot> {{message}}</div>',
          data () {
            return {
              message: 'world'
            }
          }
        }
      }
    })

    const pageData = getPageData(page, '0')
    let comp1 = getPageData(page, '0,0')
    expect(pageData.h['0']._if).toBeFalsy()
    expect(comp1).toBeUndefined()
    vm.ok = true
    waitForUpdate(() => {
      expect(pageData.h['0']._if).toBeTruthy()
      comp1 = getPageData(page, '0,0')
      expect(comp1.s['s2'].t).toBe('hello')
      expect(comp1.h['2'].t).toBe(' world')
    }).then(done)
  })

  it('props', () => {
    const { page } = createPage({
      data: {
        list: [{ a: 1 }, { a: 2 }]
      },
      template: '<test :collection="list"></test>',
      components: {
        test: {
          template: '<ul><li v-for="item in collection">{{item.a}}</li></ul>',
          props: ['collection']
        }
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h).toBeUndefined()
    expect(comp1.h['1'].li).toEqual([0, 1])
    expect(comp1.h['2-0'].t).toEqual('1')
    expect(comp1.h['2-1'].t).toEqual('2')
  })

  it('should warn when using camelCased props in in-DOM template', () => {
    createPage({
      data: {
        list: [{ a: 1 }, { a: 2 }]
      },
      template: '<test :somecollection="list"></test>', // <-- simulate lowercased template
      components: {
        test: {
          template: '<ul><li v-for="item in someCollection">{{item.a}}</li></ul>',
          props: ['someCollection']
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `You should probably use "some-collection" instead of "someCollection".`
    )
  })

  it('should warn when using camelCased events in in-DOM template', () => {
    createPage({
      template: '<test @foobar="a++"></test>', // <-- simulate lowercased template
      components: {
        test: {
          template: '<div></div>',
          created () {
            this.$emit('fooBar')
          }
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'You should probably use "foo-bar" instead of "fooBar".'
    )
  })

  it('not found component should not throw', () => {
    expect(function () {
      createPage({
        template: '<div is="non-existent"></div>'
      })
    }).not.toThrow()
  })

  it('catch component render error and preserve previous vnode', done => {
    const spy = jasmine.createSpy()
    Vue.config.errorHandler = spy
    const { page, vm } = createPage({
      data: {
        a: {
          b: 123
        }
      },
      template: `<div>{{a.b}}</div>`
    })
    const pageData = getPageData(page, '0')
    expect(pageData.h['1'].t).toBe('123')
    expect(spy).not.toHaveBeenCalled()
    vm.a = null
    waitForUpdate(() => {
      expect(spy).toHaveBeenCalled()
      expect(pageData.h['1'].t).toBe('123')
      // expect(vm.$el.textContent).toBe('123') // should preserve rendered DOM
      vm.a = { b: 234 }
    }).then(() => {
      expect(pageData.h['1'].t).toBe('234')
      // expect(vm.$el.textContent).toBe('234') // should be able to recover
      Vue.config.errorHandler = null
    }).then(done)
  })
})

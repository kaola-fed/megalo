import { createPage, getPageData } from '../../helpers'

describe('Directive v-bind', () => {
  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  it('normal attr', done => {
    const options = {
      template: '<div><span :test="foo">hello</span></div>',
      data: { foo: 'ok' }
    }

    const { page, vm } = createPage(options)

    function expectAttr (expected) {
      expect(getPageData(page, '0').h['1'].test).toEqual(expected)
    }

    expectAttr('ok')
    vm.foo = 'again'
    waitForUpdate(() => {
      expectAttr('again')
      vm.foo = null
    }).then(() => {
      expectAttr(null)
      vm.foo = false
    }).then(() => {
      expectAttr(false)
      vm.foo = true
    }).then(() => {
      expectAttr(true)
      vm.foo = 0
    }).then(() => {
      expectAttr(0)
    }).then(() => {
      expectAttr(0)
    }).then(done)
  })

  it('should set property for input value', done => {
    const options = {
      template: `
        <div>
          <input type="text" :value="foo">
          <input type="checkbox" :checked="bar">
        </div>
      `,
      data: {
        foo: 'ok',
        bar: false
      }
    }
    const { page, vm } = createPage(options)

    expect(getPageData(page, '0').h['1'].value).toEqual('ok')
    expect(getPageData(page, '0').h['3'].checked).toEqual(false)
    vm.bar = true
    waitForUpdate(() => {
      expect(getPageData(page, '0').h['3'].checked).toEqual(true)
    }).then(done)
  })

  // not support
  it('xlink', done => {
    pending()
    const { vm } = createPage({
      template: '<svg><a :xlink:special="foo"></a></svg>',
      data: {
        foo: 'ok'
      }
    })
    const xlinkNS = 'http://www.w3.org/1999/xlink'
    expect(vm.$el.firstChild.getAttributeNS(xlinkNS, 'special')).toBe('ok')
    vm.foo = 'again'
    waitForUpdate(() => {
      expect(vm.$el.firstChild.getAttributeNS(xlinkNS, 'special')).toBe('again')
      vm.foo = null
    }).then(() => {
      expect(vm.$el.firstChild.hasAttributeNS(xlinkNS, 'special')).toBe(false)
      vm.foo = true
    }).then(() => {
      expect(vm.$el.firstChild.getAttributeNS(xlinkNS, 'special')).toBe('true')
    }).then(done)
  })

  // cannot access enumerated attr in mp
  it('enumerated attr', done => {
    pending()
    const { page, vm } = createPage({
      template: '<div><span :draggable="foo">hello</span></div>',
      data: { foo: true }
    })

    function expectDraggable (expected) {
      expect(getPageData(page, '0').h['1']).toEqual(expected)
    }

    // expect(vm.$el.firstChild.getAttribute('draggable')).toBe('true')
    expectDraggable('true')
    vm.foo = 'again'
    waitForUpdate(() => {
      // expect(vm.$el.firstChild.getAttribute('draggable')).toBe('true')
      vm.foo = null
    }).then(() => {
      // expect(vm.$el.firstChild.getAttribute('draggable')).toBe('false')
      vm.foo = ''
    }).then(() => {
      // expect(vm.$el.firstChild.getAttribute('draggable')).toBe('true')
      vm.foo = false
    }).then(() => {
      // expect(vm.$el.firstChild.getAttribute('draggable')).toBe('false')
      vm.foo = 'false'
    }).then(() => {
      // expect(vm.$el.firstChild.getAttribute('draggable')).toBe('false')
    }).then(done)
  })

  // cannot access boolean attr in mp
  it('boolean attr', done => {
    pending()
    const { vm } = createPage({
      template: '<div><span :disabled="foo">hello</span></div>',
      data: { foo: true }
    })
    expect(vm.$el.firstChild.getAttribute('disabled')).toBe('disabled')
    vm.foo = 'again'
    waitForUpdate(() => {
      expect(vm.$el.firstChild.getAttribute('disabled')).toBe('disabled')
      vm.foo = null
    }).then(() => {
      expect(vm.$el.firstChild.hasAttribute('disabled')).toBe(false)
      vm.foo = ''
    }).then(() => {
      expect(vm.$el.firstChild.hasAttribute('disabled')).toBe(true)
    }).then(done)
  })

  // TODO: try support modifer

  // TODO: need supprt of template
  it('bind object with overwrite', done => {
    pending()
    const { page, vm } = createPage({
      template: '<input v-bind="test" id="foo" :class="test.value">',
      data: {
        test: {
          id: 'test',
          class: 'ok',
          value: 'hello'
        }
      }
    })

    function expectInputAttr (attr, expected) {
      expect(getPageData(page, '0').h['0'][attr]).toEqual(expected)
    }

    // TODO: remove static value
    expectInputAttr('id', 'foo')
    expectInputAttr('cl', 'hello')
    expectInputAttr('value', 'hello')
    vm.test.id = 'hi'
    vm.test.value = 'bye'
    waitForUpdate(() => {
      expectInputAttr('id', 'foo')
      expectInputAttr('cl', 'bye')
      expectInputAttr('value', 'bye')
    }).then(done)
  })

  // TODO: need supprt of template compiler
  it('bind object with class/style', done => {
    pending()
    const { page, vm } = createPage({
      template: '<input class="a" style="color:red" v-bind="test">',
      data: {
        test: {
          id: 'test',
          class: ['b', 'c'],
          style: { fontSize: '12px' }
        }
      }
    })

    function expectInputAttr (attr, expected) {
      expect(getPageData(page, '0').h['0'][attr]).toEqual(expected)
    }

    expectInputAttr('id', 'test')
    expectInputAttr('cl', 'b c')
    expectInputAttr('st', 'font-size: 12px')
    vm.test.id = 'hi'
    vm.test.class = ['d']
    vm.test.style = { fontSize: '14px' }
    waitForUpdate(() => {
      expectInputAttr('id', 'hi')
      expectInputAttr('cl', 'd')
      expectInputAttr('st', 'font-size: 14px')
    }).then(done)
  })

  // TODO: try support
  it('bind object as prop', done => {
    pending()
    const { page, vm } = createPage({
      template: '<input v-bind.prop="test">',
      data: {
        test: {
          id: 'test',
          className: 'ok',
          value: 'hello'
        }
      }
    })

    function expectInputAttr (attr, expected) {
      expect(getPageData(page, '0').h['0'][attr]).toEqual(expected)
    }

    expectInputAttr('id', 'test')
    expectInputAttr('cl', 'ok')
    expectInputAttr('value', 'hello')
    vm.test.id = 'hi'
    vm.test.className = 'okay'
    vm.test.value = 'bye'
    waitForUpdate(() => {
      expectInputAttr('id', 'hi')
      expectInputAttr('cl', 'okay')
      expectInputAttr('value', 'bye')
      // expect(vm.$el.id).toBe('hi')
      // expect(vm.$el.className).toBe('okay')
      // expect(vm.$el.value).toBe('bye')
    }).then(done)
  })

  // TODO: try
  it('warn expect object', () => {
    pending()
    createPage({
      template: '<input v-bind="test">',
      data: {
        test: 1
      }
    })
    expect('v-bind without argument expects an Object or Array value').toHaveBeenWarned()
  })

  it('set value for option element', () => {
    const { page } = createPage({
      template: '<select><option :value="val">val</option></select>',
      data: {
        val: 'val'
      }
    })
    // check value attribute
    expect(getPageData(page, '0').h['1'].value).toBe('val')
  })

  // a vdom patch edge case where the user has several un-keyed elements of the
  // same tag next to each other, and toggling them.
  it('properly update for toggling un-keyed children', done => {
    const { vm, page } = createPage({
      template: `
        <div>
          <div v-if="ok" id="a" data-test="1"></div>
          <div v-if="!ok" id="b"></div>
        </div>
      `,
      data: {
        ok: true
      }
    })

    expect(getPageData(page, '0').h['1']._if).toBeTruthy()
    // static attributes is not supposed to be updated throw setData
    // expect(getPageData(page, '0').h['1'].id).toBe('a')
    // expect(getPageData(page, '0').h['1']['data-test']).toBe('1')
    expect(getPageData(page, '0').h['3']._if).toBeFalsy()
    vm.ok = false
    waitForUpdate(() => {
      expect(getPageData(page, '0').h['3']._if).toBeTruthy()
      expect(getPageData(page, '0').h['1']._if).toBeFalsy()
      // expect(getPageData(page, '0').h['1'].id).toBe('a')
      // expect(getPageData(page, '0').h['1']['data-test']).toBe('1')
    }).then(done)
  })

  it('update in Promise', done => {
    jasmine.clock().uninstall()

    const options = {
      template: '<div>{{test}}</div>',
      data: { test: false },
      methods: {
        update () {
          this.test = false
          this.next()
            .then(() => {
              this.test = true
            })
        },
        next () {
          return new Promise(resolve => {
            resolve()
          })
        }
      }
    }

    const { page, vm } = createPage(options)

    function expectValue (expected) {
      expect(getPageData(page, '0').h['1'].t).toEqual(expected)
    }

    expectValue('false')
    vm.update()

    setTimeout(() => {
      expectValue('true')
      vm.update()
      setTimeout(() => {
        expectValue('true')
        done()
      }, 100)
    }, 100)
  })

  // TODO: verify
  describe('bind object with special attribute', () => {
    pending()
    function makeInstance (options) {
      return createPage({
        template: `<div>${options.parentTemp}</div>`,
        data: {
          attrs: {
            [options.attr]: options.value
          }
        },
        components: {
          comp: {
            template: options.childTemp
          }
        }
      })
    }

    it('key', () => {
      const { page } = makeInstance({
        attr: 'key',
        value: 'test',
        parentTemp: '<div v-bind="attrs"></div>'
      })
      expect(getPageData(page, '0').h['0'].key).toBe('test')
    })

    it('ref', () => {
      const vm = makeInstance({
        attr: 'ref',
        value: 'test',
        parentTemp: '<div v-bind="attrs"></div>'
      })
      expect(vm.$refs).toBe(vm.$el.firstChild)
    })

    it('slot', () => {
      const vm = makeInstance({
        attr: 'slot',
        value: 'test',
        parentTemp: '<comp><span v-bind="attrs">123</span></comp>',
        childTemp: '<div>slot:<slot name="test"></slot></div>'
      })
      expect(vm.$el.innerHTML).toBe('<div>slot:<span>123</span></div>')
    })

    it('is', () => {
      const vm = makeInstance({
        attr: 'is',
        value: 'comp',
        parentTemp: '<component v-bind="attrs"></component>',
        childTemp: '<div>comp</div>'
      })
      expect(vm.$el.innerHTML).toBe('<div>comp</div>')
    })
  })
})

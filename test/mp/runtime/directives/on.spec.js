import { createPage } from '../../helpers'

describe('Directive v-on', () => {
  let spy

  beforeEach(() => {
    jasmine.clock().install()
    spy = jasmine.createSpy()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  it('should bind event to a method', () => {
    const { page } = createPage({
      template: '<div v-on:click="foo"></div>',
      methods: { foo: spy }
    })

    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)

    const args = spy.calls.allArgs()
    const event = args[0] && args[0][0] || {}
    expect(event.type).toBe('tap')
  })

  it('should bind event to a inline statement', () => {
    const { page } = createPage({
      template: '<div v-on:click="foo(1,2,3,$event)"></div>',
      methods: { foo: spy }
    })

    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)

    const args = spy.calls.allArgs()
    const firstArgs = args[0]
    expect(firstArgs.length).toBe(4)
    expect(firstArgs[0]).toBe(1)
    expect(firstArgs[1]).toBe(2)
    expect(firstArgs[2]).toBe(3)
    expect(firstArgs[3].type).toBe('tap')
  })

  it('should support inline function expression', () => {
    const spy = jasmine.createSpy()
    const { page } = createPage({
      template: `<div @click="function (e) { log(e.type) }"></div>`,
      methods: {
        log: spy
      }
    })

    page._triggerEvent(undefined, 'tap')
    expect(spy).toHaveBeenCalledWith('tap')
  })

  it('should support inline function expression with modifiers', () => {
    const spy = jasmine.createSpy()
    const { page } = createPage({
      template: `<div @click.once="function (e) { log(e.type) }"></div>`,
      methods: {
        log: spy
      }
    })

    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)
    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)
  })

  it('should support shorthand', () => {
    const { page } = createPage({
      template: '<a href="#test" @click.prevent="foo"></a>',
      methods: { foo: spy }
    })
    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)
  })

  // hard to simulate
  // stopPropagation not supported in codegen
  it('should support stop propagation', () => {
    const { page } = createPage({
      template: `
        <div @click.stop="foo"></div>
      `,
      methods: { foo: spy }
    })
    // const hash = window.location.hash
    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)
    // expect(window.location.hash).toBe(hash)
  })

  // TODO: try support it in template
  it('should support prevent default', () => {
    pending()
    const { page } = createPage({
      template: `
        <input type="checkbox" ref="input" @click.prevent="foo">
      `,
      methods: {
        foo ($event) {
          spy('preventDefault not supported')
        }
      }
    })

    page._triggerEvent(undefined, 'tap')
    expect(spy).toHaveBeenCalledWith('preventDefault not supported')
  })

  // support it in template
  // it's hard simulate
  it('should support capture', () => {
    const callOrder = []
    const { page } = createPage({
      template: `
        <div @click.capture="foo">
          <div @click="bar"></div>
        </div>
      `,
      methods: {
        foo () { callOrder.push(1) },
        bar () { callOrder.push(2) }
      }
    })
    page._triggerEvent(undefined, 'tap')
    page._triggerEvent({ dataset: { hid: '1', cid: '0' }}, 'tap')
    expect(callOrder.toString()).toBe('1,2')
  })

  // TODO: try supported
  it('should support once', () => {
    // pending()
    const { page, vm } = createPage({
      template: `
        <div @click.once="foo">
        </div>
      `,
      methods: { foo: spy }
    })

    page._triggerEvent(vm.$el, 'tap')
    expect(spy.calls.count()).toBe(1)
    page._triggerEvent(vm.$el, 'tap')
    expect(spy.calls.count()).toBe(1) // should no longer trigger
  })

  it('should handle .once on multiple elements properly', () => {
    const { page } = createPage({
      template: `
        <div>
          <button ref="one" @click.once="foo">one</button>
          <button ref="two" @click.once="foo">two</button>
        </div>
      `,
      methods: { foo: spy }
    })

    const button1 = { dataset: { cid: '0', hid: '1' }}
    const button2 = { dataset: { cid: '0', hid: '4' }}
    page._triggerEvent(button1, 'tap')
    expect(spy.calls.count()).toBe(1)
    page._triggerEvent(button1, 'tap')
    expect(spy.calls.count()).toBe(1)

    page._triggerEvent(button2, 'tap')
    expect(spy.calls.count()).toBe(2)
    page._triggerEvent(button1, 'tap')
    page._triggerEvent(button2, 'tap')
    expect(spy.calls.count()).toBe(2)
  })

  // TODO: hard to simulate
  it('should support capture and once', () => {
    pending()
    const callOrder = []
    const { page } = createPage({
      template: `
        <div @click.capture.once="foo">
          <div @click="bar"></div>
        </div>
      `,
      methods: {
        foo () { callOrder.push(1) },
        bar () { callOrder.push(2) }
      }
    })
    page._triggerEvent(undefined, 'tap')
    expect(callOrder.toString()).toBe('1,2')
    page._triggerEvent(undefined, 'tap')
    expect(callOrder.toString()).toBe('1,2,2')
  })

  it('should support once and other modifiers', () => {
    const { page } = createPage({
      template: `<div @click.once.self="foo"><span/></div>`,
      methods: { foo: spy }
    })
    const span = { dataset: { cid: '0', hid: '1' }}
    page._triggerEvent({
      target: span
    }, 'tap')
    expect(spy).not.toHaveBeenCalled()
    page._triggerEvent(undefined, 'tap')
    expect(spy).toHaveBeenCalled()
    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)
  })

  // keycode not supported, ignored

  it('should bind to a child component', () => {
    const { vm } = createPage({
      template: '<bar @custom="foo"></bar>',
      methods: { foo: spy },
      components: {
        bar: {
          template: '<span>Hello</span>'
        }
      }
    })
    vm.$children[0].$emit('custom', 'foo', 'bar')
    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })

  // TODO: try support this
  it('should be able to bind native events for a child component', () => {
    pending()
    const { vm } = createPage({
      template: '<bar @click.native="foo"></bar>',
      methods: { foo: spy },
      components: {
        bar: {
          template: '<span>Hello</span>'
        }
      }
    })
    vm.$children[0].$emit('click')
    expect(spy).not.toHaveBeenCalled()
    // triggerEvent(vm.$children[0].$el, 'click')
    // expect(spy).toHaveBeenCalled()
  })

  it('.once modifier should work with child components', () => {
    const { vm } = createPage({
      template: '<bar @custom.once="foo"></bar>',
      methods: { foo: spy },
      components: {
        bar: {
          template: '<span>Hello</span>'
        }
      }
    })
    vm.$children[0].$emit('custom')
    expect(spy.calls.count()).toBe(1)
    vm.$children[0].$emit('custom')
    expect(spy.calls.count()).toBe(1) // should not be called again
  })

  it('remove listener', done => {
    const spy2 = jasmine.createSpy('remove listener')
    const { page, vm } = createPage({
      methods: { foo: spy, bar: spy2 },
      data: {
        ok: true
      },
      template: `
        <input v-if="ok" @click.once="foo">
        <input v-else @input="bar">
      `
    })

    const input1 = { dataset: { hid: '0', cid: '0' }}
    const input2 = { dataset: { hid: '1', cid: '0' }}
    page._triggerEvent(input1, 'tap')
    expect(spy.calls.count()).toBe(1)
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      page._triggerEvent(input2, 'click')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      page._triggerEvent(input2, 'input')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('remove once listener', done => {
    const spy2 = jasmine.createSpy('remove listener')
    const { page, vm } = createPage({
      methods: { foo: spy, bar: spy2 },
      data: {
        ok: true
      },
      template: `
        <input v-if="ok" @click.once="foo">
        <input v-else @input="bar">
      `
    })
    const input1 = { dataset: { hid: '0', cid: '0' }}
    const input2 = { dataset: { hid: '1', cid: '0' }}
    page._triggerEvent(input1, 'click')
    expect(spy.calls.count()).toBe(1)
    page._triggerEvent(input1, 'click')
    expect(spy.calls.count()).toBe(1) // should no longer trigger
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      page._triggerEvent(input2, 'click')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      page._triggerEvent(input2, 'input')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('remove listener on child component', done => {
    const spy2 = jasmine.createSpy('remove listener')
    const { vm } = createPage({
      methods: { foo: spy, bar: spy2 },
      data: {
        ok: true
      },
      components: {
        test: {
          template: '<div></div>'
        }
      },
      template: `
        <test v-if="ok" @foo="foo"/>
        <test v-else @bar="bar"/>
      `
    })
    vm.$children[0].$emit('foo')
    expect(spy.calls.count()).toBe(1)
    expect(spy2.calls.count()).toBe(0)
    vm.ok = false
    waitForUpdate(() => {
      vm.$children[0].$emit('foo')
      expect(spy.calls.count()).toBe(1) // should no longer trigger
      vm.$children[0].$emit('bar')
      expect(spy2.calls.count()).toBe(1)
    }).then(done)
  })

  it('warn missing handlers', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    const { page } = createPage({
      data: { none: null },
      template: `<div @click="none"></div>`
    })
    expect(console.warn.calls.argsFor(0)).toContain(
      `Invalid handler for event "click": got null`
    )
    expect(() => {
      page._triggerEvent(undefined, 'click')
    }).not.toThrow()
    console.warn = warn
  })

  it('empty hanlder with modifiers', () => {
    const { page } = createPage({
      template: `<button @click.once=""></button>`
    })

    expect(() => {
      page._triggerEvent(undefined, 'tap')
    }).not.toThrow()
  })

  // passive not supported

  it('object syntax (no argument)', () => {
    const click = jasmine.createSpy('click')
    const mouseup = jasmine.createSpy('mouseup')
    const { page } = createPage({
      template: `<button v-on="listeners">foo</button>`,
      created () {
        this.listeners = {
          click,
          mouseup
        }
      }
    })

    page._triggerEvent(undefined, 'click')
    expect(click.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(0)

    page._triggerEvent(undefined, 'mouseup')
    expect(click.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(1)
  })

  it('object syntax (no argument, mixed with normal listeners)', () => {
    const click1 = jasmine.createSpy('click1')
    const click2 = jasmine.createSpy('click2')
    const mouseup = jasmine.createSpy('mouseup')
    const { page } = createPage({
      template: `<button v-on="listeners" @click="click2">foo</button>`,
      created () {
        this.listeners = {
          click: click1,
          mouseup
        }
      },
      methods: {
        click2
      }
    })

    page._triggerEvent(undefined, 'click')
    expect(click1.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(0)

    page._triggerEvent(undefined, 'mouseup')
    expect(click1.calls.count()).toBe(1)
    expect(click2.calls.count()).toBe(1)
    expect(mouseup.calls.count()).toBe(1)
  })

  // TODO: native not supprted yet
  it('object syntax (usage in HOC, mixed with native listeners)', () => {
    pending()
    const click = jasmine.createSpy('click')
    const mouseup = jasmine.createSpy('mouseup')
    const mousedown = jasmine.createSpy('mousedown')

    const { page } = createPage({
      template: `
        <foo-button
          @click="click"
          @mousedown="mousedown"
          @mouseup.native="mouseup">
        </foo-button>
      `,
      methods: {
        click,
        mouseup,
        mousedown
      },
      components: {
        fooButton: {
          template: `
            <button v-on="$listeners"></button>
          `
        }
      }
    })

    page._triggerEvent(undefined, 'click')
    // expect(click.calls.count()).toBe(1)
    // expect(mouseup.calls.count()).toBe(0)
    // expect(mousedown.calls.count()).toBe(0)

    // triggerEvent(vm.$el, 'mouseup')
    // expect(click.calls.count()).toBe(1)
    // expect(mouseup.calls.count()).toBe(1)
    // expect(mousedown.calls.count()).toBe(0)

    // triggerEvent(vm.$el, 'mousedown')
    // expect(click.calls.count()).toBe(1)
    // expect(mouseup.calls.count()).toBe(1)
    // expect(mousedown.calls.count()).toBe(1)
  })

  // #6805 (v-on="object" bind order problem)
  // not supported
  it('object syntax (no argument): should fire after high-priority listeners', done => {
    pending()
    const MyCheckbox = {
      template: '<input type="checkbox" v-model="model" v-on="$listeners">',
      props: {
        value: false
      },
      computed: {
        model: {
          get () {
            return this.value
          },
          set (val) {
            this.$emit('input', val)
          }
        }
      }
    }

    const { page } = createPage({
      template: `
        <div>
          <my-checkbox v-model="check" @change="change"></my-checkbox>
        </div>
      `,
      components: { MyCheckbox },
      data: {
        check: false
      },
      methods: {
        change () {
          expect(this.check).toBe(false)
          done()
        }
      }
    })

    const input = { dataset: { hid: '0', cid: '0,0' }}
    page._triggerEvent(input, 'tap')
    // vm.$el.querySelector('input').click()
  })

  it('warn object syntax with modifier', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      template: `<button v-on.self="{}"></button>`
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `v-on without argument does not support modifiers`
    )
    console.warn = warn
  })

  it('warn object syntax with non-object value', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      template: `<button v-on="123"></button>`
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `v-on without argument expects an Object value`
    )
    console.warn = warn
  })

  it('listen on the same events multiple times', () => {
    const spy2 = jasmine.createSpy()
    const { page } = createPage({
      template: `<button @click="foo" @click.once="bar"></button>`,
      methods: {
        foo: spy,
        bar: spy2
      }
    })
    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)
    expect(spy2.calls.count()).toBe(1)
    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(2)
    expect(spy2.calls.count()).toBe(1)
  })

  it('slot snippet with v-on', () => {
    const spy2 = jasmine.createSpy()
    const { page } = createPage({
      template: `
        <div>
          <button @click="foo"/>
          <test>
            <button @click="bar"/>
          </test>
        </div>
      `,
      components: {
        test: {
          template: '<div><slot></slot></div>'
        }
      },
      methods: { foo: spy, bar: spy2 }
    })

    // button1 vnode is stored in the root instance's _vnode tree
    const button1 = { dataset: { cid: '0', hid: '1' }}
    // button2 vnode is stored in the <test> instance's _vnode tree
    const button2 = { dataset: { cid: '0,0', hid: '5' }}

    page._triggerEvent(button1, 'tap')
    expect(spy.calls.count()).toBe(1)

    page._triggerEvent(button2, 'tap')
    expect(spy2.calls.count()).toBe(1)
  })
})

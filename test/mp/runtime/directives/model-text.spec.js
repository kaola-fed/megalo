import { createPage, getPageData } from '../../helpers'

describe('Directive v-model text', () => {
  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  function assertValue (pageData, expected, hid = '0') {
    expect(pageData.h[hid].value).toBe(expected)
  }

  function triggerInput (page, value = '', options = {}) {
    const { hid = '0', type = 'input' } = options
    const input = {
      dataset: { cid: '0', hid },
      detail: { value }
    }
    page._triggerEvent(input, type)
  }

  it('should update value both ways', done => {
    const { page, vm } = createPage({
      data: {
        test: 'b'
      },
      template: '<input v-model="test">'
    })

    const pageData = getPageData(page, '0')
    assertValue(pageData, 'b')
    vm.test = 'a'
    waitForUpdate(() => {
      assertValue(pageData, 'a')
      triggerInput(page, 'c')
      expect(vm.test).toBe('c')
    }).then(done)
  })

  it('should work with space ended expression in v-model', () => {
    const { page, vm } = createPage({
      data: {
        obj: {
          test: 'b'
        }
      },
      template: '<input v-model="obj.test ">'
    })

    triggerInput(page, 'b')
    expect(vm.obj['test ']).toBe(undefined)
    expect(vm.obj.test).toBe('b')
  })

  it('.lazy modifier', () => {
    const { page, vm } = createPage({
      data: {
        test: 'b'
      },
      template: '<input v-model.lazy="test">'
    })

    expect(vm.$el.value).toBe('b')
    expect(vm.test).toBe('b')
    triggerInput(page, 'c')
    expect(vm.test).toBe('b')
    triggerInput(page, 'c', { type: 'blur' })
    expect(vm.test).toBe('c')
  })

  it('.number modifier', () => {
    const { page, vm } = createPage({
      data: {
        test: 1
      },
      template: '<input v-model.number="test">'
    })

    expect(vm.test).toBe(1)
    vm.$el.value = '2'
    triggerInput(page, '2')
    expect(vm.test).toBe(2)
    triggerInput(page, '123asdjasl')
    expect(vm.test).toBe(123)
    // should let strings pass through
    triggerInput(page, 'f')
    expect(vm.test).toBe('f')
  })

  it('.trim modifier', () => {
    const { page, vm } = createPage({
      data: {
        test: 'hi'
      },
      template: '<input v-model.trim="test">'
    })

    expect(vm.test).toBe('hi')
    triggerInput(page, ' what ')
    expect(vm.test).toBe('what')
  })

  it('.number focus and typing', (done) => {
    const { page, vm } = createPage({
      data: {
        test: 0,
        update: 0
      },
      template:
        '<div>' +
          '<input ref="input" v-model.number="test">{{ update }}' +
          '<input ref="blur">' +
        '</div>'
    })

    const inputHid = '1'
    const pageData = getPageData(page, '0')
    // vm.$refs.input.focus()
    triggerInput(page, '', { type: 'focus', hid: inputHid })
    expect(vm.test).toBe(0)
    // vm.$refs.input.value = '1.0'
    // triggerEvent(vm.$refs.input, 'input')
    triggerInput(page, '1.0', { type: 'input', hid: inputHid })
    expect(vm.test).toBe(1)
    vm.update++
    waitForUpdate(() => {
      assertValue(pageData, 1, inputHid)
      // expect(vm.$refs.input.value).toBe('1.0')
      triggerInput(page, '', { type: 'focus', hid: '2' })
      triggerInput(page, '', { type: 'blur', hid: inputHid })
      // vm.$refs.blur.focus()
      vm.update++
    }).then(() => {
      assertValue(pageData, 1, inputHid)
      // expect(vm.$refs.input.value).toBe('1')
    }).then(done)
  })

  it('.trim focus and typing', (done) => {
    const { page, vm } = createPage({
      data: {
        test: 'abc',
        update: 0
      },
      template:
        '<div>' +
          '<input ref="input" v-model.trim="test" type="text">{{ update }}' +
          '<input ref="blur"/>' +
        '</div>'
    })

    const inputHid = '1'
    const pageData = getPageData(page, '0')
    // document.body.appendChild(vm.$el)
    triggerInput(page, '', { type: 'focus', hid: inputHid })
    // vm.$refs.input.focus()
    triggerInput(page, ' abc ', { type: 'input', hid: inputHid })
    // vm.$refs.input.value = ' abc '
    // triggerEvent(vm.$refs.input, 'input')
    expect(vm.test).toBe('abc')
    vm.update++
    waitForUpdate(() => {
      assertValue(pageData, 'abc', inputHid)
      // expect(vm.$refs.input.value).toBe(' abc ')
      triggerInput(page, '', { type: 'focus', hid: '2' })
      triggerInput(page, '', { type: 'blur', hid: inputHid })
      // vm.$refs.blur.focus()
      vm.update++
    }).then(() => {
      assertValue(pageData, 'abc', inputHid)
    }).then(done)
  })

  it('multiple inputs', (done) => {
    const spy = jasmine.createSpy()
    const { page, vm } = createPage({
      data: {
        selections: [[1, 2, 3], [4, 5]],
        inputList: [
          {
            name: 'questionA',
            data: ['a', 'b', 'c']
          },
          {
            name: 'questionB',
            data: ['1', '2']
          }
        ]
      },
      watch: {
        selections: spy
      },
      template:
        '<div>' +
          '<div v-for="(inputGroup, idx) in inputList">' +
            '<div>' +
              '<span v-for="(item, index) in inputGroup.data">' +
                '<input v-bind:name="item" type="text" v-model.number="selections[idx][index]" v-bind:id="idx+\'-\'+index"/>' +
                '<label>{{item}}</label>' +
              '</span>' +
            '</div>' +
          '</div>' +
          '<span ref="rs">{{selections}}</span>' +
        '</div>'
    })

    triggerInput(page, 'test', { hid: '4-0-1' })
    // var inputs = vm.$el.getElementsByTagName('input')
    // inputs[1].value = 'test'
    // triggerEvent(inputs[1], 'input')
    waitForUpdate(() => {
      expect(spy).toHaveBeenCalled()
      expect(vm.selections).toEqual([[1, 'test', 3], [4, 5]])
    }).then(done)
  })

  it('warn invalid tag', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      data: {
        test: 'foo'
      },
      template: '<div v-model="test"></div>'
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `<div v-model="test">: v-model is not supported on this element type`
    )
    console.warn = warn
  })

  it('should have higher priority than user v-on events', () => {
    const spy = jasmine.createSpy()
    const { page } = createPage({
      data: {
        a: 'a'
      },
      template: '<input v-model="a" @input="onInput">',
      methods: {
        onInput (e) {
          spy(e.target.value)
        }
      }
    })

    triggerInput(page, 'b')
    // vm.$el.value = 'b'
    // triggerEvent(vm.$el, 'input')
    expect(spy).toHaveBeenCalledWith('b')
  })

  it('warn binding to v-for alias', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      data: {
        strings: ['hi']
      },
      template: `
        <div>
          <div v-for="str in strings">
            <input v-model="str">
          </div>
        </div>
      `
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `You are binding v-model directly to a v-for iteration alias`
    )
    console.warn = warn
  })

  it('warn if v-model and v-bind:value conflict', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      data: {
        test: 'foo'
      },
      template: '<input type="text" v-model="test" v-bind:value="test">'
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `v-bind:value="test" conflicts with v-model`
    )
    console.warn = warn
  })

  it('warn if v-model and :value conflict', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      data: {
        test: 'foo'
      },
      template: '<input type="text" v-model="test" :value="test">'
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `:value="test" conflicts with v-model`
    )
    console.warn = warn
  })

  // TODO: try fix
  it('should not warn on radio, checkbox, or custom component', () => {
    pending()
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      data: { test: '' },
      components: {
        foo: {
          props: ['model', 'value'],
          model: { prop: 'model', event: 'change' },
          template: `<div/>`
        }
      },
      template: `
        <div>
          <input type="checkbox" v-model="test" :value="test">
          <input type="radio" v-model="test" :value="test">
          <foo v-model="test" :value="test"/>
        </div>
      `
    })

    // expect('conflicts with v-model').not.toHaveBeenWarned()
    expect(console.warn.calls.argsFor(0)).toContain(
      `conflicts with v-model`
    )
    console.warn = warn
  })

  // TODO: input type has different meaning in mp
  // it('should not warn on input with dynamic type binding', () => {
  //   const warn = console.warn
  //   console.warn = jasmine.createSpy()
  //   createPage({
  //     data: {
  //       type: 'checkbox',
  //       test: 'foo'
  //     },
  //     template: '<input :type="type" v-model="test" :value="test">'
  //   })
  //   expect(console.warn).not.toHaveBeenCalled()
  //   console.warn = warn
  // })
})

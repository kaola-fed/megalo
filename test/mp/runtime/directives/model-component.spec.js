import { createPage, getPageData } from '../../helpers'

describe('Directive v-model component', () => {
  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  function triggerInput (page, value = '', options = {}) {
    const { cid = '0', hid = '0', type = 'input' } = options
    const input = {
      dataset: { cid, hid },
      detail: { value }
    }
    page._triggerEvent(input, type)
  }

  it('should work', done => {
    const { page, vm } = createPage({
      data: {
        msg: 'hello'
      },
      template: `
        <div>
          <p>{{ msg }}</p>
          <test v-model="msg"></test>
        </div>
      `,
      components: {
        test: {
          props: ['value'],
          template: `<input :value="value" @input="$emit('input', $event.target.value)">`
        }
      }
    })

    // document.body.appendChild(vm.$el)
    const pageData = getPageData(page, '0')
    waitForUpdate(() => {
      // const input = vm.$el.querySelector('input')
      triggerInput(page, 'world', { cid: '0,0', hid: '0' })
      // input.value = 'world'
      // triggerEvent(input, 'input')
    }).then(() => {
      expect(vm.msg).toEqual('world')
      expect(pageData._h['2'].t).toEqual('world')
      vm.msg = 'changed'
    }).then(() => {
      expect(vm.msg).toEqual('changed')
      expect(pageData._h['2'].t).toEqual('changed')
    }).then(() => {
      // document.body.removeChild(vm.$el)
    }).then(done)
  })

  it('should work with native tags with "is"', done => {
    const { page, vm } = createPage({
      data: {
        msg: 'hello'
      },
      template: `
        <div>
          <p>{{ msg }}</p>
          <input is="test" v-model="msg">
        </div>
      `,
      components: {
        test: {
          props: ['value'],
          template: `<input :value="value" @input="$emit('input', $event.target.value)">`
        }
      }
    })

    // document.body.appendChild(vm.$el)
    const pageData = getPageData(page, '0')
    waitForUpdate(() => {
      triggerInput(page, 'world', { cid: '0,0', hid: '0' })
    }).then(() => {
      expect(vm.msg).toEqual('world')
      expect(pageData._h['2'].t).toEqual('world')
      vm.msg = 'changed'
    }).then(() => {
      expect(vm.msg).toEqual('changed')
      expect(pageData._h['2'].t).toEqual('changed')
    }).then(() => {
      // document.body.removeChild(vm.$el)
    }).then(done)
  })

  it('should support customization via model option', done => {
    const spy = jasmine.createSpy('update')
    const { page, vm } = createPage({
      data: {
        msg: 'hello'
      },
      methods: {
        spy
      },
      template: `
        <div>
          <p>{{ msg }}</p>
          <test v-model="msg" @update="spy"></test>
        </div>
      `,
      components: {
        test: {
          model: {
            prop: 'currentValue',
            event: 'update'
          },
          props: ['currentValue'],
          template: `<input :value="currentValue" @input="$emit('update', $event.target.value)">`
        }
      }
    })

    // document.body.appendChild(vm.$el)
    const pageData = getPageData(page, '0')
    waitForUpdate(() => {
      triggerInput(page, 'world', { cid: '0,0', hid: '0' })
    }).then(() => {
      expect(vm.msg).toEqual('world')
      expect(pageData._h['2'].t).toEqual('world')
      expect(spy).toHaveBeenCalledWith('world')
      vm.msg = 'changed'
    }).then(() => {
      expect(vm.msg).toEqual('changed')
      expect(pageData._h['2'].t).toEqual('changed')
    }).then(() => {
      // document.body.removeChild(vm.$el)
    }).then(done)
  })

  it('modifier: .number', () => {
    const { vm } = createPage({
      template: `<div><my-input ref="input" v-model.number="text"></my-input></div>`,
      data: { text: 'foo' },
      components: {
        'my-input': {
          template: '<input>'
        }
      }
    })

    expect(vm.text).toBe('foo')
    vm.$refs.input.$emit('input', 'bar')
    expect(vm.text).toBe('bar')
    vm.$refs.input.$emit('input', '123')
    expect(vm.text).toBe(123)
  })

  it('modifier: .trim', () => {
    const { vm } = createPage({
      template: `<div><my-input ref="input" v-model.trim="text"></my-input></div>`,
      data: { text: 'foo' },
      components: {
        'my-input': {
          template: '<input>'
        }
      }
    })
    expect(vm.text).toBe('foo')
    vm.$refs.input.$emit('input', '  bar  ')
    expect(vm.text).toBe('bar')
    vm.$refs.input.$emit('input', '   foo o  ')
    expect(vm.text).toBe('foo o')
  })
})

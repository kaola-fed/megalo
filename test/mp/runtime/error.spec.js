import { createPage, Vue } from '../helpers'

describe('error handling', () => {
  let globalErrorHandler
  const testError = new Error('test')
  const owarn = console.warn

  beforeEach(() => {
    globalErrorHandler = jasmine.createSpy()
    Vue.config.errorHandler = globalErrorHandler
  })

  afterEach(() => {
    Vue.config.errorHandler = null
  })

  it('catch error when onLoad calls', () => {
    const pageOptions = {
      template: `<div></div>`,
      mpType: 'page',
      onLoad () {
        throw testError
      }
    }

    const { vm } = createPage(pageOptions)
    expect(globalErrorHandler.calls.count()).toBe(1)
    const args = globalErrorHandler.calls.allArgs()
    expect(args[0][0]).toBe(testError)
    expect(args[0][1]).toBe(vm)
    expect(args[0][2]).toBe(`lifecycle hook error "onLoad"`)
  })

  it('catch error when event handler calls', () => {
    const { page, vm } = createPage({
      template: '<div @click="foo"></div>',
      methods: {
        foo () {
          throw testError
        }
      }
    })

    page._triggerEvent(undefined, 'tap')
    expect(globalErrorHandler.calls.count()).toBe(1)
    const args = globalErrorHandler.calls.allArgs()
    expect(args[0][0]).toBe(testError)
    expect(args[0][1]).toBe(vm)
    expect(args[0][2]).toBe(`v-on handler`)
  })

  it('catch error when event handler is undefined', () => {
    console.warn = function() {}
    const pageOptions = {
      template: `<div><input @click="onNotFound"></input></div>`,
      mpType: 'page'
    }

    const { page, vm } = createPage(pageOptions)
    page._triggerEvent({ dataset: { hid: '1', cid: '0' }}, 'click')

    const args = globalErrorHandler.calls.allArgs()
    expect(globalErrorHandler.calls.count()).toBe(1)
    expect(args[0][0].message).toBe(`event: handler for "click" is undefined`)
    expect(args[0][1]).toBe(vm)
    expect(args[0][2]).toBe(`event: handler for "click" is undefined`)
    console.warn = owarn 
  })
})

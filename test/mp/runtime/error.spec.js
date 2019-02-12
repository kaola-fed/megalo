import { createPage, Vue } from '../helpers'

describe('error handling', () => {
  let globalErrorHanlder
  const testError = new Error('test')

  beforeEach(() => {
    globalErrorHanlder = jasmine.createSpy()
    Vue.config.errorHandler = globalErrorHanlder
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
    expect(globalErrorHanlder.calls.count()).toBe(1)
    const args = globalErrorHanlder.calls.allArgs()
    expect(args[0][0]).toBe(testError)
    expect(args[0][1]).toBe(vm)
    expect(args[0][2]).toBe(`lifecycle hook error "onLoad"`)
  })

  it('catch error when event handler calls', () => {
    const { page, vm } = createPage({
      template: '<div v-on:click="foo"></div>',
      methods: {
        foo () {
          throw testError
        }
      }
    })

    page._triggerEvent(undefined, 'tap')
    expect(globalErrorHanlder.calls.count()).toBe(1)
    const args = globalErrorHanlder.calls.allArgs()
    expect(args[0][0]).toBe(testError)
    expect(args[0][1]).toBe(vm)
    expect(args[0][2]).toBe(`event handler for "tap|click"`)
  })
})

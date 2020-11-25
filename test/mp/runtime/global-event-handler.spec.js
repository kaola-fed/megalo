import { createPage, Vue } from '../helpers'

describe('Directive v-on', () => {
  let globalEventHandler
  let spy

  beforeEach(() => {
    jasmine.clock().install()
    globalEventHandler = jasmine.createSpy()
    Vue.config.globalEventHandler = globalEventHandler
    spy = jasmine.createSpy()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  it('should bind event to a method', () => {
    const { vm, page } = createPage({
      template: '<div v-on:click="foo"></div>',
      methods: { foo: spy }
    })

    page._triggerEvent(undefined, 'tap')
    expect(spy.calls.count()).toBe(1)

    const args = spy.calls.allArgs()
    const event = args[0] && args[0][0] || {}
    expect(event.type).toBe('tap')

    expect(globalEventHandler.calls.count()).toBe(1)
    const gArgs = globalEventHandler.calls.allArgs()
    expect(gArgs[0][0]).toBe(vm)
    expect(gArgs[0][1].type).toBe('tap')
    expect(gArgs[0][2].tag).toBe(`div`)
  })
})

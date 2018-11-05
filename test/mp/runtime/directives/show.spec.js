import { createPage, getPageData } from '../../helpers'

describe('Directive v-show', () => {
  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  function asserVShow (pageData, expected, hid = '1') {
    expect(pageData.h[hid].vs).toEqual(expected)
  }

  it('should check show value is truthy', () => {
    const { page } = createPage({
      template: '<div><span v-show="foo">hello</span></div>',
      data: { foo: true }
    })

    const pageData = getPageData(page, '0')
    asserVShow(pageData, !true)
  })

  it('should check show value is falsy', () => {
    const { page } = createPage({
      template: '<div><span v-show="foo">hello</span></div>',
      data: { foo: false }
    })

    const pageData = getPageData(page, '0')
    asserVShow(pageData, !false)
  })

  it('should update show value changed', done => {
    const { page, vm } = createPage({
      template: '<div><span v-show="foo">hello</span></div>',
      data: { foo: true }
    })

    const pageData = getPageData(page, '0')
    asserVShow(pageData, !true)
    // expect(vm.$el.firstChild.style.display).toBe('')
    vm.foo = false
    waitForUpdate(() => {
      asserVShow(pageData, !false)
      // expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = {}
    }).then(() => {
      asserVShow(pageData, !true)
      // expect(vm.$el.firstChild.style.display).toBe('')
      vm.foo = 0
    }).then(() => {
      asserVShow(pageData, !false)
      // expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = []
    }).then(() => {
      asserVShow(pageData, !true)
      // expect(vm.$el.firstChild.style.display).toBe('')
      vm.foo = null
    }).then(() => {
      asserVShow(pageData, !false)
      // expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = '0'
    }).then(() => {
      asserVShow(pageData, !true)
      // expect(vm.$el.firstChild.style.display).toBe('')
      vm.foo = undefined
    }).then(() => {
      asserVShow(pageData, !false)
      // expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = 1
    }).then(() => {
      asserVShow(pageData, !true)
      // expect(vm.$el.firstChild.style.display).toBe('')
    }).then(done)
  })

  it('should respect display value in style attribute', done => {
    const { page, vm } = createPage({
      template: '<div><span v-show="foo" style="display:block">hello</span></div>',
      data: { foo: true }
    })

    const pageData = getPageData(page, '0')
    asserVShow(pageData, !true)
    // expect(vm.$el.firstChild.style.display).toBe('block')
    vm.foo = false
    waitForUpdate(() => {
      asserVShow(pageData, !false)
      // expect(vm.$el.firstChild.style.display).toBe('none')
      vm.foo = true
    }).then(() => {
      asserVShow(pageData, !true)
      // expect(vm.$el.firstChild.style.display).toBe('block')
    }).then(done)
  })

  // TODO: not supported, try later
  it('should support unbind when reused', done => {
    pending()
    const { page, vm } = createPage({
      template:
        '<div v-if="tester"><span v-show="false"></span></div>' +
        '<div v-else><span @click="tester=!tester">show</span></div>',
      data: { tester: true }
    })

    const pageData = getPageData(page, '0')
    // expect(pageData).toEqual(1)
    asserVShow(pageData, !false, '1')
    // expect(vm.$el.firstChild.style.display).toBe('none')
    vm.tester = false
    waitForUpdate(() => {
      asserVShow(pageData, !true, '1')
      // expect(vm.$el.firstChild.style.display).toBe('')
      vm.tester = true
    }).then(() => {
      asserVShow(pageData, !false, '1')
      // expect(vm.$el.firstChild.style.display).toBe('none')
    }).then(done)
  })
})

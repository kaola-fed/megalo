import { createPage, getPageData } from '../../helpers'

describe('Directive v-if', () => {
  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  function assertIf (pageData, expected, hid = '1') {
    expect(pageData.h[hid]._if).toEqual(expected)
  }

  function assertList (pageData, expectedList = [], hid = '2') {
    expectedList.forEach((expected, i) => {
      expect(pageData.h[`${hid}-${i}`].t).toEqual(expected)
    })
  }

  it('should check if value is truthy', () => {
    const { page } = createPage({
      template: '<div><span v-if="foo">hello</span></div>',
      data: { foo: true }
    })
    const pageData = getPageData(page, '0')
    expect(pageData, true)
  })

  it('should check if value is falsy', () => {
    const { page } = createPage({
      template: '<div><span v-if="foo">hello</span></div>',
      data: { foo: false }
    })
    const pageData = getPageData(page, '0')
    expect(pageData, false)
  })

  it('should update if value changed', done => {
    const { page, vm } = createPage({
      template: '<div><span v-if="foo">hello</span></div>',
      data: { foo: true }
    })

    const pageData = getPageData(page, '0')
    assertIf(pageData, true)
    vm.foo = false
    waitForUpdate(() => {
      assertIf(pageData, false)
      vm.foo = {}
    }).then(() => {
      assertIf(pageData, true)
      vm.foo = 0
    }).then(() => {
      assertIf(pageData, false)
      vm.foo = []
    }).then(() => {
      assertIf(pageData, true)
      vm.foo = null
    }).then(() => {
      assertIf(pageData, false)
      vm.foo = '0'
    }).then(() => {
      assertIf(pageData, true)
      vm.foo = undefined
    }).then(() => {
      assertIf(pageData, false)
      vm.foo = 1
    }).then(() => {
      assertIf(pageData, true)
    }).then(done)
  })

  it('should work well with v-else', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-if="foo">hello</span>
          <span v-else>bye</span>
        </div>
      `,
      data: { foo: true }
    })

    const pageData = getPageData(page, '0')
    assertIf(pageData, true)
    vm.foo = false
    waitForUpdate(() => {
      assertIf(pageData, false)
      vm.foo = {}
    }).then(() => {
      assertIf(pageData, true)
      vm.foo = 0
    }).then(() => {
      assertIf(pageData, false)
      vm.foo = []
    }).then(() => {
      assertIf(pageData, true)
      vm.foo = null
    }).then(() => {
      assertIf(pageData, false)
      vm.foo = '0'
    }).then(() => {
      assertIf(pageData, true)
      vm.foo = undefined
    }).then(() => {
      assertIf(pageData, false)
      vm.foo = 1
    }).then(() => {
      assertIf(pageData, true)
    }).then(done)
  })

  it('should work well with v-else-if', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-if="foo">hello</span>
          <span v-else-if="bar">elseif</span>
          <span v-else>bye</span>
        </div>
      `,
      data: { foo: true, bar: false }
    })

    const pageData = getPageData(page, '0')
    assertIf(pageData, true, '1')
    assertIf(pageData, false, '3')

    vm.foo = false
    waitForUpdate(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, false, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = true
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, true, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = false
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, false, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.foo = true
    }).then(() => {
      assertIf(pageData, true, '1')
      assertIf(pageData, false, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span>')
      vm.foo = false
      vm.bar = {}
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, true, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = 0
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, false, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = []
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, true, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = null
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, false, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = '0'
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, true, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
      vm.bar = undefined
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, false, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span>')
      vm.bar = 1
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, true, '3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>elseif</span>')
    }).then(done)
  })

  it('should work well with v-for', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="(item, i) in list" v-if="item.value">{{i}}</span>
        </div>
      `,
      data: {
        list: [
          { value: true },
          { value: false },
          { value: true }
        ]
      }
    })

    const pageData = getPageData(page, '0')
    assertIf(pageData, true, '1-0')
    assertIf(pageData, false, '1-1')
    assertIf(pageData, true, '1-2')

    // expect(vm.$el.innerHTML).toBe('<span>0</span><!----><span>2</span>')
    vm.list[0].value = false
    waitForUpdate(() => {
      assertIf(pageData, false, '1-0')
      assertIf(pageData, false, '1-1')
      assertIf(pageData, true, '1-2')
      // expect(vm.$el.innerHTML).toBe('<!----><!----><span>2</span>')
      vm.list.push({ value: true })
    }).then(() => {
      assertIf(pageData, false, '1-0')
      assertIf(pageData, false, '1-1')
      assertIf(pageData, true, '1-2')
      assertIf(pageData, true, '1-3')
      // expect(vm.$el.innerHTML).toBe('<!----><!----><span>2</span><span>3</span>')
      vm.list.splice(1, 2)
    }).then(() => {
      assertIf(pageData, false, '1-0')
      assertIf(pageData, true, '1-1')
      // expect(vm.$el.innerHTML).toBe('<!----><span>1</span>')
    }).then(done)
  })

  // TODO: try support
  // not supported in template
  // mixed v-for with v-if & v-else
  it('should work well with v-for and v-else', done => {
    pending()
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="(item, i) in list" v-if="item.value">hello</span>
          <span v-else>bye</span>
        </div>
      `,
      data: {
        list: [
          { value: true },
          { value: false },
          { value: true }
        ]
      }
    })

    const pageData = getPageData(page, '0')
    assertIf(pageData, true, '1-0')
    assertIf(pageData, false, '1-1')
    assertIf(pageData, true, '1-2')

    // expect(vm.$el.innerHTML.trim()).toBe('<span>hello</span><span>bye</span><span>hello</span>')
    vm.list[0].value = false
    waitForUpdate(() => {
      assertIf(pageData, false, '1-0')
      assertIf(pageData, false, '1-1')
      assertIf(pageData, true, '1-2')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span><span>bye</span><span>hello</span>')
      vm.list.push({ value: true })
    }).then(() => {
      assertIf(pageData, false, '1-0')
      assertIf(pageData, false, '1-1')
      assertIf(pageData, true, '1-2')
      assertIf(pageData, true, '1-3')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span><span>bye</span><span>hello</span><span>hello</span>')
      vm.list.splice(1, 2)
    }).then(() => {
      expect(pageData.h['1'].li).toEqual([0, 1])
      assertIf(pageData, false, '1-0')
      assertIf(pageData, true, '1-1')
      // expect(vm.$el.innerHTML.trim()).toBe('<span>bye</span><span>hello</span>')
    }).then(done)
  })

  // TODO: try support
  // not supported in template
  // mixed v-for with v-if & v-else
  it('should work with v-for on v-else branch', done => {
    pending()
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-if="false">hello</span>
          <span v-else v-for="item in list">{{ item }}</span>
        </div>
      `,
      data: {
        list: [1, 2, 3]
      }
    })

    const pageData = getPageData(page, '0')
    assertIf(pageData, false, '1')
    expect(pageData.h['3'].li).toEqual([0, 1, 2])
    assertList(pageData, ['1', '2', '3'], '4')
    vm.list.reverse()
    waitForUpdate(() => {
      assertIf(pageData, false, '1')
      expect(pageData.h['3'].li).toEqual([0, 1, 2])
      assertList(pageData, ['3', '2', '1'], '4')
      // expect(vm.$el.textContent.trim()).toBe('321')
    }).then(done)
  })

  it('should work properly on component root', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <test class="test"></test>
        </div>
      `,
      components: {
        test: {
          data () {
            return { ok: true }
          },
          template: '<div v-if="ok" id="ok" class="inner">test</div>'
        }
      }
    })

    const pageData = getPageData(page, '0')
    const compData = getPageData(page, '0,0')
    expect(pageData.c).toEqual('0')
    assertIf(compData, true, '0')
    // expect(vm.$el.children[0].id).toBe('ok')
    // expect(vm.$el.children[0].className).toBe('inner test')
    vm.$children[0].ok = false
    waitForUpdate(() => {
      assertIf(compData, false, '0')
      // attrs / class modules should not attempt to patch the comment node
      // expect(vm.$el.innerHTML).toBe('<!---->')
      vm.$children[0].ok = true
    }).then(() => {
      assertIf(compData, true, '0')
      // expect(vm.$el.children[0].id).toBe('ok')
      // expect(vm.$el.children[0].className).toBe('inner test')
    }).then(done)
  })

  it('should maintain stable list to avoid unnecessary patches', done => {
    const created = jasmine.createSpy()
    const destroyed = jasmine.createSpy()
    const { vm } = createPage({
      data: {
        ok: true
      },
      // when the first div is toggled, the second div should be reused
      // instead of re-created/destroyed
      template: `
        <div>
          <div v-if="ok"></div>
          <div><test></test></div>
        </div>
      `,
      components: {
        test: {
          template: '<div></div>',
          created,
          destroyed
        }
      }
    })

    expect(created.calls.count()).toBe(1)
    vm.ok = false
    waitForUpdate(() => {
      expect(created.calls.count()).toBe(1)
      expect(destroyed).not.toHaveBeenCalled()
    }).then(done)
  })

  it('should work well with v-else-if', done => {
    const condASpy = jasmine.createSpy('condASpy')
    const condBSpy = jasmine.createSpy('condBSpy')

    const { page, vm } = createPage({
      template: `
        <div>
          <span v-if="condA()">hello</span>
          <span v-else-if="condB()">elseif</span>
          <span v-else>bye</span>
        </div>
      `,
      data () {
        return {
          type: 'a'
        }
      },
      methods: {
        condA () {
          condASpy()
          return this.type === 'a'
        },
        condB () {
          condBSpy()
          return this.type === 'b'
        }
      }
    })

    const pageData = getPageData(page, '0')
    assertIf(pageData, true, '1')
    assertIf(pageData, false, '3')
    expect(condASpy).toHaveBeenCalledTimes(1)
    expect(condBSpy).not.toHaveBeenCalled()

    vm.type = 'b'
    waitForUpdate(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, true, '3')

      expect(condASpy).toHaveBeenCalledTimes(2)
      expect(condBSpy).toHaveBeenCalledTimes(1)

      vm.type = 'c'
    }).then(() => {
      assertIf(pageData, false, '1')
      assertIf(pageData, false, '3')

      expect(condASpy).toHaveBeenCalledTimes(3)
      expect(condBSpy).toHaveBeenCalledTimes(2)
    }).then(done)
  })
})

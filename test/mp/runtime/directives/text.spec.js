import { createPage, getPageData } from '../../helpers'

describe('Directive v-text', () => {
  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  function assertVText (pageData, hid = '1', expected) {
    expect(pageData.h[hid].vt).toBe(expected)
  }

  it('should render text', done => {
    const options = {
      template: '<div v-text="a"></div>',
      data: { a: 'hello' }
    }

    const { page } = createPage(options)
    const pageData = getPageData(page, '0')

    waitForUpdate(() => {
      assertVText(pageData, '0', 'hello')
    }).then(done)
  })

  // encode by mp sdk
  it('should encode html entities', done => {
    const options = {
      template: '<div v-text="a"></div>',
      data: { a: '<foo>' }
    }

    const { page } = createPage(options)
    const pageData = getPageData(page, '0')

    waitForUpdate(() => {
      assertVText(pageData, '0', '<foo>')
    }).then(done)
  })

  it('should support all value types', done => {
    const options = {
      template: '<div v-text="a"></div>',
      data: { a: false }
    }

    const { page, vm } = createPage(options)
    const pageData = getPageData(page, '0')

    waitForUpdate(() => {
      assertVText(pageData, '0', 'false')
      vm.a = []
    }).then(() => {
      assertVText(pageData, '0', '[]')
      vm.a = {}
    }).then(() => {
      assertVText(pageData, '0', '{}')
      vm.a = 123
    }).then(() => {
      assertVText(pageData, '0', '123')
      vm.a = 0
    }).then(() => {
      assertVText(pageData, '0', '0')
      vm.a = ' '
    }).then(() => {
      assertVText(pageData, '0', ' ')
      vm.a = '    '
    }).then(() => {
      assertVText(pageData, '0', '    ')
      vm.a = null
    }).then(() => {
      assertVText(pageData, '0', '')
      vm.a = undefined
    }).then(() => {
      assertVText(pageData, '0', '')
    }).then(done)
  })
})

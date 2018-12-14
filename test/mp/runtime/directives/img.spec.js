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
      template: '<img :src="img">',
      data: { img: 'static/src/1.jpg' }
    }

    const { page, vm } = createPage(options)

    function expectAttr (expected) {
      expect(getPageData(page, '0').h['0'].src).toEqual(expected)
    }

    expectAttr('/static/src/1.jpg')
    vm.img = '/static/src/2.jpg'
    waitForUpdate(() => {
      expectAttr('/static/src/2.jpg')
      vm.img = 'https://i.com/3.jpg'
    }).then(() => {
      expectAttr('https://i.com/3.jpg')
      vm.img = 'data:image//123'
    }).then(() => {
      expectAttr('data:image//123')
    }).then(done)
  })

  it('normal attr', done => {
    const options = {
      template: '<img :src="img">',
      data: { img: '' }
    }

    const { page, vm } = createPage(options)

    function expectAttr (expected) {
      expect(getPageData(page, '0').h['0'].src).toEqual(expected)
    }

    expectAttr('')
    vm.img = '/static/src/2.jpg'
    waitForUpdate(() => {
      expectAttr('/static/src/2.jpg')
    }).then(done)
  })
})

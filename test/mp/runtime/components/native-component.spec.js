import { createPage, getPageData } from '../../helpers'

describe('native component', () => {
  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  it('binding slot in native component', done => {
    const options = {
      template: '<CompA><span :slot="slot">{{ title }}</span></CompA>',
      data: { slot: 'head', title: 'hello' }
    }

    const { page, vm } = createPage(options)

    expect(getPageData(page, '0').h['2'].slot).toEqual('head')
    expect(getPageData(page, '0').h['3'].t).toEqual('hello')

    vm.slot = 'body'
    vm.title = 'test'
    waitForUpdate(() => {
      expect(getPageData(page, '0').h['2'].slot).toEqual('body')
      expect(getPageData(page, '0').h['3'].t).toEqual('test')

      vm.slot = 'foot'
    }).then(() => {
      expect(getPageData(page, '0').h['2'].slot).toEqual('foot')
      expect(getPageData(page, '0').h['3'].t).toEqual('test')
    }).then(done)
  })
})

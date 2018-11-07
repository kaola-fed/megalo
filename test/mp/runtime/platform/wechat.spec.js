import {
  resetVue,
  createPage,
  setMPPlatform,
  resetMPPlatform
} from '../../helpers'

describe('wechat', () => {
  it('should get platform from $mp', () => {
    resetVue()
    setMPPlatform('wechat')

    const pageOptions = {
      template: `<div></div>`,
      mpType: 'page'
    }

    const { vm } = createPage(pageOptions)

    expect(vm.$mp.platform).toBe('wechat')

    resetMPPlatform()
  })
})

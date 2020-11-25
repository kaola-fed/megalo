import {
  resetVue,
  createPage,
  setMPPlatform,
  resetMPPlatform
} from '../../helpers'

describe('toutiao', () => {
  it('should get platform from $mp', () => {
    resetVue()
    setMPPlatform('toutiao')

    const pageOptions = {
      template: `<div></div>`,
      mpType: 'page'
    }

    const { vm } = createPage(pageOptions)

    expect(vm.$mp.platform).toBe('toutiao')

    resetMPPlatform()
  })

  it('should set obj convery flag in toutiao', () => {
    resetVue()
    setMPPlatform('toutiao')

    const pageOptions = {
      template: `<div>
        <div v-for="item in list">{{item}}</div>
      </div>`,
      mpType: 'page',
      data: {
        list: [1, 2, 3]
      }
    }

    const { vm } = createPage(pageOptions)

    expect(vm.$mp.platform).toBe('toutiao')
    expect(vm.$mp.page.data.$root[0].h._obj).toBeTruthy();

    resetMPPlatform()
  })
})

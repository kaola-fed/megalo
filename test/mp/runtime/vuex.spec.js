import { createPage, getPageData } from '../helpers'

describe('vuex test', () => {
  it('init data', () => {
    const pageOptions = {
      vuex: true,
      template: `<div><CompA/></div>`,
      mpType: 'page',
      components: {
        CompA: {
          template: '<div>comp A</div>'
        }
      },
      data () {
        return {
          counter: 100
        }
      },
      computed: {
        time: function () {
          return this.$store.state.time
        }
      }
    }

    const { page } = createPage(pageOptions)

    // rootVM id
    expect(getPageData(page, '0').c).toEqual('0')
    expect(getPageData(page, '0').cp).toEqual('0,')

    // component id
    expect(getPageData(page, '0,0').c).toEqual('0,0')
    expect(getPageData(page, '0,0').cp).toEqual('0,0,')

    // vuex data
    expect(page.rootVM.time).toBeGreaterThan(1540973747009)
  })
})


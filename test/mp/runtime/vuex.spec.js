import Vue from 'vue'
import { createPage, getPageData } from '../helpers'

describe('vuex test', () => {
  it('new Vue() should work', () => {
    const vm = new Vue()
    expect(vm._isVue).toBeTruthy()
  })
  it('new Vue({}) should work', () => {
    const vm = new Vue({})
    expect(vm._isVue).toBeTruthy()
  })
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
    expect(getPageData(page, '0').cp).toEqual('0v')

    // component id
    expect(getPageData(page, '0,0').c).toEqual('0v0')
    expect(getPageData(page, '0,0').cp).toEqual('0v0v')

    // vuex data
    expect(page.rootVM.time).toBeGreaterThan(1540973747009)
  })
})


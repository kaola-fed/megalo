import { createPage, getPageData } from '../helpers'

describe('data mapping', () => {
  it('init data', () => {
    const pageOptions = {
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
      }
    }

    const { page } = createPage(pageOptions)

    // rootVM id
    expect(getPageData(page, '0').c).toEqual('0')
    expect(getPageData(page, '0').cp).toEqual('0,')

    // component id
    expect(getPageData(page, '0,0').c).toEqual('0,0')
    expect(getPageData(page, '0,0').cp).toEqual('0,0,')
  })

  it('binding data', () => {
    const pageOptions = {
      mpType: 'page',
      template: `
        <div>
          <p>{{ text }}</p>
          <p>head {{ text }} tail</p>
          <test :class="[ 'comp-'+text ]" :prefix="text" ></test>
        </div>
      `,
      components: {
        test: {
          template: '<div>{{ prefix }} {{ text }}</div>',
          props: {
            prefix: {
              type: String,
              default: ''
            }
          },
          data () {
            return {
              text: 'box'
            }
          }
        }
      },
      data () {
        return {
          text: 'megalo'
        }
      }
    }

    const { page } = createPage(pageOptions)

    // binding text node
    expect(getPageData(page, '0')._h['2'].t).toEqual('megalo')
    expect(getPageData(page, '0')._h['5'].t).toEqual('head megalo tail')

    // component id
    expect(getPageData(page, '0,0')._h['1'].t).toEqual('megalo box')
  })
})

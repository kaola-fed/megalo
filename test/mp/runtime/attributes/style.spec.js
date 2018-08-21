import { createPage } from '../../helpers'

describe(':class', () => {
  let page
  let vm
  beforeEach(() => {
    jasmine.clock().install()
    const pageOptions = {
      mpType: 'page',
      template: '<div :style="styles"></div>',
      data () {
        return {
          styles: {},
          fontSize: 16
        }
      }
    }

    page = createPage(pageOptions, false)
    jasmine.clock().tick(1000)
    vm = page.rootVM
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  function expectStyle (expected) {
    return expect(page.data.$root['0']._h['0'].st).toEqual(expected)
  }

  it('string', done => {
    vm.styles = 'color:red;'
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('color: red')
    }).then(done)
  })

  it('falsy number', done => {
    vm.styles = { opacity: 0 }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('opacity: 0')
    }).then(done)
  })

  it('plain object', done => {
    vm.styles = { color: 'red' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('color: red')
    }).then(done)
  })

  it('camelCase', done => {
    vm.styles = { marginRight: '10px' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('margin-right: 10px')
    }).then(done)
  })

  it('remove if falsy value', done => {
    vm.styles = { color: 'red' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('color: red')
      vm.styles = { color: null }
    }).then(() => {
      jasmine.clock().tick(1000)
      expectStyle('')
    }).then(done)
  })

  // TODO: try support
  it('ignore unsupported property', done => {
    pending()
    vm.styles = { foo: 'bar' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('')
    }).then(done)
  })

  it('auto-prefixed style value as array', done => {
    vm.styles = { display: ['-webkit-box', '-ms-flexbox', 'flex'] }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('display: -webkit-box; display: -ms-flexbox; display: flex')
    }).then(done)
  })

  it('!important', done => {
    vm.styles = { display: 'block !important' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('display: block !important')
    }).then(done)
  })

  it('object with multiple entries', done => {
    vm.styles = {
      color: 'red',
      marginLeft: '10px',
      marginRight: '15px'
    }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('color: red; margin-left: 10px; margin-right: 15px')
      vm.styles = {
        color: 'blue',
        padding: null
      }
    }).then(() => {
      jasmine.clock().tick(1000)
      expectStyle('color: blue')
      vm.styles = null
    }).then(() => {
      jasmine.clock().tick(1000)
      expectStyle('')
    }).then(done)
  })

  it('array of objects', done => {
    vm.styles = [
      { padding: '10px' },
      { color: 'red' },
      { marginRight: '20px' }
    ]

    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('padding: 10px; color: red; margin-right: 20px')
      vm.styles = [{ color: 'blue' }, { padding: null }]
    }).then(() => {
      jasmine.clock().tick(1000)
      expectStyle('color: blue')
    }).then(done)
  })

  it('updates objects deeply', done => {
    vm.styles = { display: 'none' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('display: none')
      vm.styles.display = 'block'
    }).then(() => {
      jasmine.clock().tick(1000)
      expectStyle('display: block')
    }).then(done)
  })

  it('background size with only one value', done => {
    vm.styles = { backgroundSize: '100%' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('background-size: 100%')
    }).then(done)
  })

  it('should work with interpolation', done => {
    vm.styles = { fontSize: `${vm.fontSize}px` }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('font-size: 16px')
    }).then(done)
  })

  // css variable is not supported in mp for now
  it('CSS variables', done => {
    vm.styles = { '--color': 'red' }
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectStyle('--color: red')
    }).then(done)
  })
})

describe('style other', () => {
  let page
  function expectStyle (expected) {
    return expect(page.data.$root['0']._h['0'].st).toEqual(expected)
  }

  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  it('should merge static style with binding style', () => {
    const pageOptions = {
      template: '<div style="background: url(https://vuejs.org/images/logo.png);color: blue" :style="test"></div>',
      data: {
        test: { color: 'red', fontSize: '12px' }
      }
    }

    page = createPage(pageOptions, false)
    jasmine.clock().tick(1000)

    // static style is generated in template
    expectStyle('color: red; font-size: 12px')
  })

  // TODO: template genrating should support this
  it('should merge between parent and child', done => {
    pending()
    const pageOptions = {
      template: '<child style="text-align: left;margin-right:20px" :style="test"></child>',
      data: {
        test: { color: 'red', fontSize: '12px' }
      },
      components: {
        child: {
          template: '<div style="margin-right:10px;" :style="{marginLeft: marginLeft}"></div>',
          data: () => ({ marginLeft: '16px' })
        }
      }
    }

    page = createPage(pageOptions, false)
    jasmine.clock().tick(1000)

    // const { rootVM: vm } = page

    // const child = vm.$children[0]
    const style = page.data.$root['0,0']._h['0'].st
    const css = style.replace(/\s/g, '')
    expect(css).toContain('margin-right:20px;')
    expect(css).toContain('margin-left:16px;')
    expect(css).toContain('text-align:left;')
    expect(css).toContain('color:red;')
    expect(css).toContain('font-size:12px;')
    expect(style.color).toBe('red')
    expect(style.marginRight).toBe('20px')
    // vm.test.color = 'blue'
    // waitForUpdate(() => {
    //   expect(style.color).toBe('blue')
    //   child.marginLeft = '30px'
    // }).then(() => {
    //   expect(style.marginLeft).toBe('30px')
    //   child.fontSize = '30px'
    // }).then(() => {
    //   expect(style.fontSize).toBe('12px')
    // }).then(done)
  })

  // it('should not pass to child root element', () => {
  //   pending()
  //   const vm = new Vue({
  //     template: '<child :style="test"></child>',
  //     data: {
  //       test: { color: 'red', fontSize: '12px' }
  //     },
  //     components: {
  //       child: {
  //         template: '<div><nested ref="nested" style="color: blue;text-align:left"></nested></div>',
  //         components: {
  //           nested: {
  //             template: '<div></div>'
  //           }
  //         }
  //       }
  //     }
  //   }).$mount()
  //   const style = vm.$el.style
  //   expect(style.color).toBe('red')
  //   expect(style.textAlign).toBe('')
  //   expect(style.fontSize).toBe('12px')
  //   expect(vm.$children[0].$refs.nested.$el.style.color).toBe('blue')
  // })

  // it('should merge between nested components', (done) => {
  //   pending()
  //   const vm = new Vue({
  //     template: '<child :style="test"></child>',
  //     data: {
  //       test: { color: 'red', fontSize: '12px' }
  //     },
  //     components: {
  //       child: {
  //         template: '<nested style="color: blue;text-align:left"></nested>',
  //         components: {
  //           nested: {
  //             template: '<div style="margin-left: 12px;" :style="nestedStyle"></div>',
  //             data: () => ({ nestedStyle: { marginLeft: '30px' }})
  //           }
  //         }
  //       }
  //     }
  //   }).$mount()
  //   const style = vm.$el.style
  //   const child = vm.$children[0].$children[0]
  //   expect(style.color).toBe('red')
  //   expect(style.marginLeft).toBe('30px')
  //   expect(style.textAlign).toBe('left')
  //   expect(style.fontSize).toBe('12px')
  //   vm.test.color = 'yellow'
  //   waitForUpdate(() => {
  //     child.nestedStyle.marginLeft = '60px'
  //   }).then(() => {
  //     expect(style.marginLeft).toBe('60px')
  //     child.nestedStyle = {
  //       fontSize: '14px',
  //       marginLeft: '40px'
  //     }
  //   }).then(() => {
  //     expect(style.fontSize).toBe('12px')
  //     expect(style.marginLeft).toBe('40px')
  //   }).then(done)
  // })

  // it('should not merge for different adjacent elements', (done) => {
  //   pending()
  //   const vm = new Vue({
  //     template:
  //       '<div>' +
  //         '<section style="color: blue" :style="style" v-if="!bool"></section>' +
  //         '<div></div>' +
  //         '<section style="margin-top: 12px" v-if="bool"></section>' +
  //       '</div>',
  //     data: {
  //       bool: false,
  //       style: {
  //         fontSize: '12px'
  //       }
  //     }
  //   }).$mount()
  //   const style = vm.$el.children[0].style
  //   expect(style.fontSize).toBe('12px')
  //   expect(style.color).toBe('blue')
  //   waitForUpdate(() => {
  //     vm.bool = true
  //   }).then(() => {
  //     expect(style.color).toBe('')
  //     expect(style.fontSize).toBe('')
  //     expect(style.marginTop).toBe('12px')
  //   }).then(done)
  // })

  // it('should not merge for v-if, v-else-if and v-else elements', (done) => {
  //   pending()
  //   const vm = new Vue({
  //     template:
  //       '<div>' +
  //         '<section style="color: blue" :style="style" v-if="foo"></section>' +
  //         '<section style="margin-top: 12px" v-else-if="bar"></section>' +
  //         '<section style="margin-bottom: 24px" v-else></section>' +
  //         '<div></div>' +
  //       '</div>',
  //     data: {
  //       foo: true,
  //       bar: false,
  //       style: {
  //         fontSize: '12px'
  //       }
  //     }
  //   }).$mount()
  //   const style = vm.$el.children[0].style
  //   expect(style.fontSize).toBe('12px')
  //   expect(style.color).toBe('blue')
  //   waitForUpdate(() => {
  //     vm.foo = false
  //   }).then(() => {
  //     expect(style.color).toBe('')
  //     expect(style.fontSize).toBe('')
  //     expect(style.marginBottom).toBe('24px')
  //     vm.bar = true
  //   }).then(() => {
  //     expect(style.color).toBe('')
  //     expect(style.fontSize).toBe('')
  //     expect(style.marginBottom).toBe('')
  //     expect(style.marginTop).toBe('12px')
  //   }).then(done)
  // })

  // // #5318
  // it('should work for elements passed down as a slot', done => {
  //   pending()
  //   const vm = new Vue({
  //     template: `<test><div :style="style"/></test>`,
  //     data: {
  //       style: { color: 'red' }
  //     },
  //     components: {
  //       test: {
  //         template: `<div><slot/></div>`
  //       }
  //     }
  //   }).$mount()

  //   expect(vm.$el.children[0].style.color).toBe('red')
  //   vm.style.color = 'green'
  //   waitForUpdate(() => {
  //     expect(vm.$el.children[0].style.color).toBe('green')
  //   }).then(done)
  // })
})

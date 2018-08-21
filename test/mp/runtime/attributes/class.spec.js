import { createPage } from '../../helpers'

function assertClass (assertions) {
  const pageOptions = {
    mpType: 'page',
    template: `<div class="foo" :class="value"></div>`,
    data: {
      value: ''
    }
  }

  assertions.forEach(([value, expected], i) => {
    let _value
    if (typeof value === 'function') {
      _value = value(pageOptions.data.value)
    } else {
      _value = value
    }
    const options = Object.assign({}, pageOptions, {
      data: {
        value: _value
      }
    })
    const page = createPage(options, 1000)
    expect(page.data.$root['0']._h['0'].cl).toEqual(expected)
  })
}

describe(':class', () => {
  it('with plain string', () => {
    assertClass([
      ['foo megalo', 'foo megalo'],
      ['megalo', 'megalo']
    ])
  })

  it('with array', () => {
    assertClass([
      [['megalo', 'box'], 'megalo box'],
      [['', undefined], '']
    ])
  })

  it('with object', () => {
    assertClass([
      [{ megalo: true, box: true }, 'megalo box'],
      [null, '']
    ])
  })

  it('with array of mixed values', () => {
    assertClass([
      [['x', { y: true, z: true }], 'x y z'],
      [null, '']
    ])
  })

  // TODO: template support parent and child class merge
  it('class merge between parent and child', done => {
    jasmine.clock().install()
    const pageOptions = {
      mpType: 'page',
      template: '<child class="a" :class="value"></child>',
      data: { value: 'b' },
      components: {
        child: {
          template: '<div class="c" :class="value"></div>',
          data: () => ({ value: 'd' })
        }
      }
    }

    const page = createPage(pageOptions, false)
    jasmine.clock().tick(1000)

    const { rootVM } = page
    const child = rootVM.$children[0]

    expectClass(page).toEqual('d b')

    rootVM.value = 'e'
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectClass(page).toEqual('d e')
    }).then(() => {
      child.value = 'f'
    }).then(() => {
      jasmine.clock().tick(1000)
      expectClass(page).toEqual('f e')
    }).then(() => {
      rootVM.value = { foo: true }
      child.value = ['bar', 'baz']
    }).then(() => {
      jasmine.clock().tick(1000)
      expectClass(page).toEqual('bar baz foo')
      jasmine.clock().uninstall()
    }).then(done)

    function expectClass (page) {
      return expect(page.data.$root['0,0']._h['0'].cl)
    }
  })

  // TODO: support this
  it('class merge between multiple nested components sharing same element', done => {
    pending()
    jasmine.clock().install()
    const pageOptions = {
      mpType: 'page',
      template: `
        <component1 :class="componentClass1">
          <component2 :class="componentClass2">
            <component3 :class="componentClass3">
              some text
            </component3>
          </component2>
        </component1>
      `,
      data: {
        componentClass1: 'componentClass1',
        componentClass2: 'componentClass2',
        componentClass3: 'componentClass3'
      },
      components: {
        component1: {
          render () {
            return this.$slots.default[0]
          }
        },
        component2: {
          render () {
            return this.$slots.default[0]
          }
        },
        component3: {
          template: '<div class="staticClass"><slot></slot></div>'
        }
      }
    }

    const page = createPage(pageOptions, false)
    jasmine.clock().tick(1000)

    const { rootVM: vm } = page
    expectClass(page).toBe('componentClass3 componentClass2 componentClass1')

    vm.componentClass1 = 'c1'
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectClass(page).toBe('componentClass3 componentClass2 c1')
    }).then(() => {
      vm.componentClass2 = 'c2'
    }).then(() => {
      jasmine.clock().tick(1000)
      expect(page.data.$root['0']._h['0']).toEqual(1)
    }).then(() => {
      // expectClass(page).toBe('componentClass3 c2 c1')
      // vm.componentClass3 = 'c3'
    }).then(() => {
      // jasmine.clock().tick(1000);
      // expectClass(page).toBe('c3 c2 c1')
      jasmine.clock().uninstall()
    }).then(done)

    function expectClass (page) {
      return expect(page.data.$root['0']._h['0'].cl)
    }
  })

  it('deep update', done => {
    jasmine.clock().install()
    const pageOptions = {
      mpType: 'page',
      template: '<div :class="test"></div>',
      data: {
        test: { a: true, b: false }
      }
    }

    const page = createPage(pageOptions, false)
    jasmine.clock().tick(1000)
    const { rootVM: vm } = page

    expectClass(page).toBe('a')
    vm.test.b = true
    waitForUpdate(() => {
      jasmine.clock().tick(1000)
      expectClass(page).toBe('a b')
      jasmine.clock().uninstall()
    }).then(done)

    function expectClass (page) {
      return expect(page.data.$root['0']._h['0'].cl)
    }
  })
})

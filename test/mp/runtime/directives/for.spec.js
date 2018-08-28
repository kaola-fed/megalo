import { createPage, getPageData } from '../../helpers'

describe('Directive v-for', () => {
  function assertList (page, expectedList = [], hid = '2') {
    expectedList.forEach((expected, i) => {
      expect(getPageData(page, '0')._h[`${hid}-${i}`].t).toEqual(expected)
    })
  }

  beforeEach(() => {
    jasmine.clock().install()
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  it('should render array of primitive values', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="item in list">{{item}}</span>
        </div>
      `,
      data: {
        list: ['a', 'b', 'c']
      }
    })

    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['a', 'b', 'c'])
    vm.$set(vm.list, 0, 'd')
    waitForUpdate(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['d', 'b', 'c'])
      vm.list.push('d')
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2, 3])
      assertList(page, ['d', 'b', 'c', 'd'])
      vm.list.splice(1, 2)
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['d', 'd'])
      // TODO: try remove spliced items
      assertList(page, ['d', 'd', 'c', 'd'])
      vm.list = ['x', 'y']
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['x', 'y'])
      // TODO: try remove spliced items
      assertList(page, ['x', 'y', 'c', 'd'])
    }).then(done)
  })

  it('should render array of primitive values with index', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="(item, i) in list">{{i}}-{{item}}</span>
        </div>
      `,
      data: {
        list: ['a', 'b', 'c']
      }
    })

    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['0-a', '1-b', '2-c'])
    vm.$set(vm.list, 0, 'd')
    waitForUpdate(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['0-d', '1-b', '2-c'])
      vm.list.push('d')
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2, 3])
      assertList(page, ['0-d', '1-b', '2-c', '3-d'])
      vm.list.splice(1, 2)
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['0-d', '1-d'])
      // TODO: try remove spliced items
      assertList(page, ['0-d', '1-d', '2-c', '3-d'])
      vm.list = ['x', 'y']
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['0-x', '1-y'])
      // TODO: try remove spliced items
      assertList(page, ['0-x', '1-y', '2-c', '3-d'])
    }).then(done)
  })

  it('should render array of object values', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="item in list">{{item.value}}</span>
        </div>
      `,
      data: {
        list: [
          { value: 'a' },
          { value: 'b' },
          { value: 'c' }
        ]
      }
    })
    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['a', 'b', 'c'])

    vm.$set(vm.list, 0, { value: 'd' })
    waitForUpdate(() => {
      assertList(page, ['d', 'b', 'c'])
      vm.list[0].value = 'e'
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['e', 'b', 'c'])
      vm.list.push({})
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2, 3])
      assertList(page, ['e', 'b', 'c', ''])
      vm.list.splice(1, 2)
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['e', ''])
      // TODO: try remove spliced items
      assertList(page, ['e', '', 'c', ''])
      vm.list = [{ value: 'x' }, { value: 'y' }]
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['x', 'y'])
      // TODO: try remove spliced items
      assertList(page, ['x', 'y', 'c', ''])
    }).then(done)
  })

  it('should render array of object values with index', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="(item, i) in list">{{i}}-{{item.value}}</span>
        </div>
      `,
      data: {
        list: [
          { value: 'a' },
          { value: 'b' },
          { value: 'c' }
        ]
      }
    })

    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['0-a', '1-b', '2-c'])

    vm.$set(vm.list, 0, { value: 'd' })
    waitForUpdate(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['0-d', '1-b', '2-c'])
      vm.list[0].value = 'e'
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['0-e', '1-b', '2-c'])
      vm.list.push({})
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2, 3])
      assertList(page, ['0-e', '1-b', '2-c', '3-'])
      vm.list.splice(1, 2)
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['0-e', '1-', '2-c', '3-'])
      // TODO: try remove spliced items
      assertList(page, ['0-e', '1-', '2-c', '3-'])
      vm.list = [{ value: 'x' }, { value: 'y' }]
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1])
      assertList(page, ['0-x', '1-y'])
      // TODO: try remove spliced items
      assertList(page, ['0-x', '1-y', '2-c', '3-'])
    }).then(done)
  })

  it('should render an Object', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="val in obj">{{val}}</span>
        </div>
      `,
      data: {
        obj: { a: 0, b: 1, c: 2 }
      }
    })

    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['0', '1', '2'])
    vm.obj.a = 3
    waitForUpdate(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['3', '1', '2'])
      vm.$set(vm.obj, 'd', 4)
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2, 3])
      assertList(page, ['3', '1', '2', '4'])
      vm.$delete(vm.obj, 'a')
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['1', '2', '4'])
      // TODO: remove spliced items
      assertList(page, ['1', '2', '4', '4'])
    }).then(done)
  })

  it('should render an Object with key', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="(val, key) in obj">{{val}}-{{key}}</span>
        </div>
      `,
      data: {
        obj: { a: 0, b: 1, c: 2 }
      }
    })

    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['0-a', '1-b', '2-c'])
    vm.obj.a = 3
    waitForUpdate(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['3-a', '1-b', '2-c'])
      vm.$set(vm.obj, 'd', 4)
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2, 3])
      assertList(page, ['3-a', '1-b', '2-c', '4-d'])
      vm.$delete(vm.obj, 'a')
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['1-b', '2-c', '4-d'])
      // TODO: remove spliced items
      assertList(page, ['1-b', '2-c', '4-d', '4-d'])
    }).then(done)
  })

  it('should render an Object with key and index', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="(val, key, i) in obj">{{val}}-{{key}}-{{i}}</span>
        </div>
      `,
      data: {
        obj: { a: 0, b: 1, c: 2 }
      }
    })

    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['0-a-0', '1-b-1', '2-c-2'])
    vm.obj.a = 3
    waitForUpdate(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['3-a-0', '1-b-1', '2-c-2'])
      vm.$set(vm.obj, 'd', 4)
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2, 3])
      assertList(page, ['3-a-0', '1-b-1', '2-c-2', '4-d-3'])
      vm.$delete(vm.obj, 'a')
    }).then(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['1-b-0', '2-c-1', '4-d-2', '4-d-3'])
    }).then(done)
  })

  it('should render each key of data', done => {
    const { page, vm } = createPage({
      template: `
        <div>
          <span v-for="(val, key) in $data">{{val}}-{{key}}</span>
        </div>
      `,
      data: { a: 0, b: 1, c: 2 }
    })

    expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['0-a', '1-b', '2-c'])
    vm.a = 3
    waitForUpdate(() => {
      expect(getPageData(page, '0')._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['3-a', '1-b', '2-c'])
    }).then(done)
  })

  it('check priorities: v-if before v-for', function () {
    const { page } = createPage({
      data: {
        items: [1, 2, 3]
      },
      template: '<div><div v-if="item < 3" v-for="item in items">{{item}}</div></div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1, 2])

    expect(pageData._h['1-0']._if).toBeTruthy()
    expect(pageData._h['2-0'].t).toBe('1')

    expect(pageData._h['1-1']._if).toBeTruthy()
    expect(pageData._h['2-1'].t).toBe('2')

    expect(pageData._h['1-2']._if).toBe(false)
  })

  it('check priorities: v-if after v-for', function () {
    const { page } = createPage({
      data: {
        items: [1, 2, 3]
      },
      template: '<div><div v-for="item in items" v-if="item < 3">{{item}}</div></div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1, 2])

    expect(pageData._h['1-0']._if).toBeTruthy()
    expect(pageData._h['2-0'].t).toBe('1')

    expect(pageData._h['1-1']._if).toBeTruthy()
    expect(pageData._h['2-1'].t).toBe('2')

    expect(pageData._h['1-2']._if).toBe(false)
  })

  it('range v-for', () => {
    const { page } = createPage({
      template: '<div><div v-for="n in 3">{{n}}</div></div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['1', '2', '3'])
  })

  it('without key', done => {
    const { page, vm } = createPage({
      data: {
        items: [
          { id: 1, msg: 'a' },
          { id: 2, msg: 'b' },
          { id: 3, msg: 'c' }
        ]
      },
      template: '<div><div v-for="item in items">{{ item.msg }}</div></div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['a', 'b', 'c'])
    vm.items.reverse()
    waitForUpdate(() => {
      expect(pageData._h['1'].li).toEqual([0, 1, 2])
      assertList(page, ['c', 'b', 'a'])
    }).then(done)
  })

  it('with key', done => {
    const { page, vm } = createPage({
      data: {
        items: [
          { id: 1, msg: 'a' },
          { id: 2, msg: 'b' },
          { id: 3, msg: 'c' }
        ]
      },
      template: '<div><div v-for="item in items" :key="item.id">{{ item.msg }}</div></div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    assertList(page, ['a', 'b', 'c'])
    vm.items.reverse()
    waitForUpdate(() => {
      expect(pageData._h['1'].li).toEqual([{ id: 3 }, { id: 2 }, { id: 1 }])
      assertList(page, ['c', 'b', 'a'])
    }).then(done)
  })

  it('nested loops', () => {
    const { page } = createPage({
      data: {
        items: [
          { items: [{ a: 1 }, { a: 2 }], a: 1 },
          { items: [{ a: 3 }, { a: 4 }], a: 2 }
        ]
      },
      template:
        '<div>' +
          '<div v-for="(item, i) in items">' +
            '<p v-for="(subItem, j) in item.items">{{j}} {{subItem.a}} {{i}} {{item.a}}</p>' +
          '</div>' +
        '</div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1])
    expect(pageData._h['2-0'].li).toEqual([0, 1])
    expect(pageData._h['2-1'].li).toEqual([0, 1])
    assertList(page, ['0 1 0 1', '1 2 0 1'], '3-0')
    assertList(page, ['0 3 1 2', '1 4 1 2'], '3-1')
  })

  it('template v-for', done => {
    const { page, vm } = createPage({
      data: {
        list: [
          { a: 1 },
          { a: 2 },
          { a: 3 }
        ]
      },
      template:
        '<div>' +
          '<template v-for="item in list">' +
            '<p>{{item.a}}</p>' +
            '<p>{{item.a + 1}}</p>' +
          '</template>' +
        '</div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['1', '2', '3'], '3')
    assertList(page, ['2', '3', '4'], '5')
    vm.list.reverse()
    waitForUpdate(() => {
      assertList(page, ['3', '2', '1'], '3')
      assertList(page, ['4', '3', '2'], '5')
      vm.list.splice(1, 1)
    }).then(() => {
      assertList(page, ['3', '1'], '3')
      assertList(page, ['4', '2'], '5')
      vm.list.splice(1, 0, { a: 2 })
    }).then(() => {
      assertList(page, ['3', '2', '1'], '3')
      assertList(page, ['4', '3', '2'], '5')
    }).then(done)
  })

  it('template v-for with key', done => {
    const { page, vm } = createPage({
      data: {
        list: [
          { a: 1, id: 1, id2: 10 },
          { a: 2, id: 2, id2: 20 },
          { a: 3, id: 3, id2: 30 }
        ]
      },
      template:
        '<div>' +
          '<template v-for="item in list">' +
            '<p :key="item.id">{{item.a}}</p>' +
            '<p :key="item.id2">{{item.a + 1}}</p>' +
          '</template>' +
        '</div>'
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([{ id: 1, id2: 10 }, { id: 2, id2: 20 }, { id: 3, id2: 30 }])
    assertList(page, ['1', '2', '3'], '3')
    assertList(page, ['2', '3', '4'], '5')
    vm.list.reverse()
    waitForUpdate(() => {
      assertList(page, ['3', '2', '1'], '3')
      assertList(page, ['4', '3', '2'], '5')
      vm.list.splice(1, 1)
    }).then(() => {
      assertList(page, ['3', '1'], '3')
      assertList(page, ['4', '2'], '5')
      vm.list.splice(1, 0, { a: 2, id: 4, id2: 40 })
    }).then(() => {
      assertList(page, ['3', '2', '1'], '3')
      assertList(page, ['4', '3', '2'], '5')
    }).then(done)
  })

  it('component v-for', done => {
    const { page, vm } = createPage({
      data: {
        list: [
          { a: 1 },
          { a: 2 },
          { a: 3 }
        ]
      },
      template:
        '<div>' +
          '<test v-for="item in list" :msg="item.a" :key="item.a">' +
            '<span>{{item.a}}</span>' +
          '</test>' +
        '</div>',
      components: {
        test: {
          props: ['msg'],
          template: '<p>{{msg}}<slot></slot></p>'
        }
      }
    })

    const pageData = getPageData(page, '0')
    const compData1 = getPageData(page, '0,0-0')
    const compData2 = getPageData(page, '0,0-1')
    const compData3 = getPageData(page, '0,0-2')
    expect(pageData._h['1'].li).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }])
    expect(compData1.s).toEqual('0')
    expect(compData2.s).toEqual('0')
    expect(compData3.s).toEqual('0')
    // slot
    assertList(page, ['1', '2', '3'], '4')
    vm.list.reverse()
    waitForUpdate(() => {
      expect(pageData._h['1'].li).toEqual([{ a: 3 }, { a: 2 }, { a: 1 }])
      expect(compData1.s).toEqual('0')
      expect(compData2.s).toEqual('0')
      // slot
      assertList(page, ['3', '2', '1'], '4')
      vm.list.splice(1, 1)
    }).then(() => {
      expect(pageData._h['1'].li).toEqual([{ a: 3 }, { a: 1 }])
      expect(compData1.s).toEqual('0')
      expect(compData2.s).toEqual('0')
      // slot
      assertList(page, ['3', '1'], '4')
      vm.list.splice(1, 0, { a: 2 })
    }).then(done)
  })

  // not supported
  it('dynamic component v-for', done => {
    pending()
    const { vm } = createPage({
      data: {
        list: [
          { type: 'one' },
          { type: 'two' }
        ]
      },
      template:
        '<div>' +
          '<component v-for="item in list" :key="item.type" :is="item.type"></component>' +
        '</div>',
      components: {
        one: {
          template: '<p>One!</p>'
        },
        two: {
          template: '<div>Two!</div>'
        }
      }
    })

    // expect(vm.$el.innerHTML).toContain('<p>One!</p><div>Two!</div>')
    vm.list.reverse()
    waitForUpdate(() => {
      // expect(vm.$el.innerHTML).toContain('<div>Two!</div><p>One!</p>')
    }).then(done)
  })

  it('should warn component v-for without keys', () => {
    const warn = console.warn
    console.warn = jasmine.createSpy()
    createPage({
      template: `<div><test v-for="i in 3"></test></div>`,
      components: {
        test: {
          render () {}
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `<test v-for="i in 3">: component lists rendered with v-for should have explicit keys`
    )
    console.warn = warn
  })

  it('multi nested array reactivity', done => {
    const { page, vm } = createPage({
      data: {
        list: [[['foo']]]
      },
      template: `
        <div>
          <div v-for="i in list">
            <div v-for="j in i">
              <div v-for="k in j">{{ k }}</div>
            </div>
          </div>
        </div>
      `
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0])
    expect(pageData._h['2-0'].li).toEqual([0])
    expect(pageData._h['3-0-0'].li).toEqual([0])
    expect(pageData._h['4-0-0-0'].t).toEqual('foo')
    vm.list[0][0].push('bar')
    waitForUpdate(() => {
      expect(pageData._h['1'].li).toEqual([0])
      expect(pageData._h['2-0'].li).toEqual([0])
      expect(pageData._h['3-0-0'].li).toEqual([0, 1])
      expect(pageData._h['4-0-0-0'].t).toEqual('foo')
      expect(pageData._h['4-0-0-1'].t).toEqual('bar')
    }).then(done)
  })

  it('should work with strings', done => {
    const { page, vm } = createPage({
      data: {
        text: 'foo'
      },
      template: `
        <div>
          <span v-for="letter in text">{{ letter }}.</span>
        </div>
      `
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1, 2])
    assertList(page, ['f.', 'o.', 'o.'])
    vm.text += 'bar'
    waitForUpdate(() => {
      expect(pageData._h['1'].li).toEqual([0, 1, 2, 3, 4, 5])
      assertList(page, ['f.', 'o.', 'o.', 'b.', 'a.', 'r.'])
    }).then(done)
  })

  it('should work with multiline expressions', () => {
    const { page } = createPage({
      data: {
        a: [1],
        b: [2]
      },
      template: `
        <div>
          <span v-for="n in (
            a.concat(
              b
            )
          )">{{ n }}</span>
        </div>
      `
    })

    const pageData = getPageData(page, '0')
    expect(pageData._h['1'].li).toEqual([0, 1])
    assertList(page, ['1', '2'])
  })

  const supportsDestructuring = (() => {
    try {
      new Function('var { foo } = bar')
      return true
    } catch (e) {
      console.log('not supprt destructuring')
    }
  })()

  if (supportsDestructuring) {
    it('should support destructuring syntax in alias position (object)', (done) => {
      const { page } = createPage({
        data: { list: [{ foo: 'hi', bar: 'ho' }] },
        template: '<div><div v-for="({ foo, bar }, i) in list">{{ foo }} {{ bar }} {{ i }}</div></div>'
      })

      const pageData = getPageData(page, '0')
      expect(pageData._h['1'].li).toEqual([0])
      assertList(page, ['hi ho 0'])
    })

    it('should support destructuring syntax in alias position (array)', () => {
      const { page } = createPage({
        data: { list: [[1, 2], [3, 4]] },
        template: '<div><div v-for="([ foo, bar ], i) in list">{{ foo }} {{ bar }} {{ i }}</div></div>'
      })

      const pageData = getPageData(page, '0')
      expect(pageData._h['1'].li).toEqual([0, 1])
      assertList(page, ['1 2 0', '3 4 1'])
    })
  }
})

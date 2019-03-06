import { createPage, getPageData } from '../../helpers'

describe('Component scoped slot', () => {
  let warn
  beforeEach(() => {
    warn = console.warn
    console.warn = jasmine.createSpy()
    jasmine.clock().install()
  })

  afterEach(() => {
    console.warn = warn
    jasmine.clock().uninstall()
  })

  it('default slot', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <template slot-scope="props">
            <span>{{ props.msg }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return { msg: 'hello' }
          },
          template: `
            <div>
              <slot :msg="msg"></slot>
            </div>
          `
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.s['s4'].t).toBe('hello')
    vm.$refs.test.msg = 'world'
    waitForUpdate(() => {
      expect(comp1.s['s4'].t).toBe('world')
    }).then(done)
  })

  it('default slot (plain element)', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <span slot-scope="props">{{ props.msg }}</span>
        </test>
      `,
      components: {
        test: {
          data () {
            return { msg: 'hello' }
          },
          template: `
            <div>
              <slot :msg="msg"></slot>
            </div>
          `
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.s['s3'].t).toBe('hello')
    vm.$refs.test.msg = 'world'
    waitForUpdate(() => {
      expect(comp1.s['s3'].t).toBe('world')
    }).then(done)
  })

  it('with v-bind', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <template slot-scope="props">
            <span>{{ props.msg }} {{ props.msg2 }} {{ props.msg3 }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return {
              msg: 'hello',
              obj: { msg2: 'world', msg3: '.' }
            }
          },
          template: `
            <div>
              <slot :msg="msg" v-bind="obj" msg3="!"></slot>
            </div>
          `
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.s['s4'].t).toBe('hello world !')
    vm.$refs.test.msg = 'bye'
    vm.$refs.test.obj.msg2 = 'bye'
    waitForUpdate(() => {
      expect(comp1.s['s4'].t).toBe('bye bye !')
    }).then(done)
  })

  it('should warn when using v-bind with no object', () => {
    createPage({
      template: `
        <test ref="test">
          <template slot-scope="props">
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return {
              text: 'some text'
            }
          },
          template: `
            <div>
              <slot v-bind="text"></slot>
            </div>
          `
        }
      }
    })

    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'slot v-bind without argument expects an Object'
    )
  })

  it('should not warn when using v-bind with object', () => {
    createPage({
      template: `
        <test ref="test">
          <template scope="props">
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return {
              foo: {
                text: 'some text'
              }
            }
          },
          template: `
            <div>
              <slot v-bind="foo"></slot>
            </div>
          `
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).not.toContain(
      'slot v-bind without argument expects an Object'
    )
  })

  it('named scoped slot', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <template slot="item" slot-scope="props">
            <span>{{ props.foo }}</span><span>{{ props.bar }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return { foo: 'FOO', bar: 'BAR' }
          },
          template: `
            <div>
              <slot name="item" :foo="foo" :bar="bar"></slot>
            </div>
          `
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.s['s4'].t).toBe('FOO')
    expect(comp1.s['s6'].t).toBe('BAR')
    // expect(vm.$el.innerHTML).toBe('<span>FOO</span><span>BAR</span>')
    vm.$refs.test.foo = 'BAZ'
    waitForUpdate(() => {
      expect(comp1.s['s4'].t).toBe('BAZ')
      expect(comp1.s['s6'].t).toBe('BAR')
      // expect(vm.$el.innerHTML).toBe('<span>BAZ</span><span>BAR</span>')
    }).then(done)
  })

  it('named scoped slot (plain element)', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <span slot="item" slot-scope="props">{{ props.foo }} {{ props.bar }}</span>
        </test>
      `,
      components: {
        test: {
          data () {
            return { foo: 'FOO', bar: 'BAR' }
          },
          template: `
            <div>
              <slot name="item" :foo="foo" :bar="bar"></slot>
            </div>
          `
        }
      }
    })
    const comp1 = getPageData(page, '0,0')
    expect(comp1.s['s3'].t).toBe('FOO BAR')
    vm.$refs.test.foo = 'BAZ'
    waitForUpdate(() => {
      expect(comp1.s['s3'].t).toBe('BAZ BAR')
    }).then(done)
  })

  it('fallback content', () => {
    const { page } = createPage({
      template: `<test></test>`,
      components: {
        test: {
          data () {
            return { msg: 'hello' }
          },
          template: `
            <div>
              <slot name="item" :text="msg">
                <span>{{ msg }} fallback</span>
              </slot>
            </div>
          `
        }
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h).toBeUndefined()
    console.log(comp1)
    expect(comp1.s['3'].t).toBe('hello fallback')
  })

  it('slot with v-for', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <template slot="item" slot-scope="props">
            <span>{{ props.text }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return {
              items: ['foo', 'bar', 'baz']
            }
          },
          template: `
            <div>
              <slot v-for="item in items" name="item" :text="item"></slot>
            </div>
          `
        }
      }
    })

    const comp1 = getPageData(page, '0,0')

    function assertOutput () {
      vm.$refs.test.items.map((item, i) => {
        expect(comp1.s[`s4-${i}`].t).toBe(item)
      })
    }

    assertOutput()
    vm.$refs.test.items.reverse()
    waitForUpdate(() => {
      assertOutput()
    }).then(() => {
      vm.$refs.test.items.push('qux')
    }).then(() => {
      assertOutput()
    }).then(done)
  })

  it('slot inside v-for', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <template slot="item" slot-scope="props">
            <span>{{ props.text }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return {
              items: ['foo', 'bar', 'baz']
            }
          },
          template: `
            <ul>
              <li v-for="item in items">
                <slot name="item" :text="item"></slot>
              </li>
            </ul>
          `
        }
      }
    })

    const comp1 = getPageData(page, '0,0')

    function assertOutput () {
      vm.$refs.test.items.map((item, i) => {
        expect(comp1.s[`s4-${i}`].t).toBe(item)
      })
    }

    // assertOutput()
    vm.$refs.test.items.reverse()
    waitForUpdate(() => {
      assertOutput()
    }).then(() => {
      vm.$refs.test.items.push('qux')
    }).then(() => {
      assertOutput()
    }).then(done)
  })

  it('scoped slot without scope alias', () => {
    const { page } = createPage({
      template: `
        <test ref="test">
          <span slot="item">{{msg}}I am static</span>
        </test>
      `,
      components: {
        test: {
          data () {
            return { msg: 'hello' }
          },
          template: `
            <div>
              <slot name="item" :text="msg"></slot>
            </div>
          `
        }
      },
      data: {
        msg: 'hello'
      }
    })
    const comp1 = getPageData(page, '0,0')
    expect(comp1.s['s3'].t).toBe('helloI am static')
  })

  it('non-scoped slot with scope alias', () => {
    const { page } = createPage({
      template: `
        <test ref="test">
          <template slot="item" slot-scope="props">
            <span>{{ props.text || 'meh' }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return { msg: 'hello' }
          },
          template: `
            <div>
              <slot name="item"></slot>
            </div>
          `
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.s['s4'].t).toBe('meh')
  })

  it('warn key on slot', () => {
    createPage({
      template: `
        <test ref="test">
          <template slot="item" slot-scope="props">
            <span>{{ props.text }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return {
              items: ['foo', 'bar', 'baz']
            }
          },
          template: `
            <div>
              <slot v-for="item in items" name="item" :text="item" :key="item"></slot>
            </div>
          `
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      `\`key\` does not work on <slot>`
    )
  })

  // dynamic slot name
  // skip: render function usage (named, via data)
  // skip: render function usage (default, as children)
  // skip: render function usage (default, as root)
  // skip: non-scoped slots should also be available on $scopedSlots 
  // skip: should support dynamic slot target
  // skip: render function usage (JSX)
  // skip: scoped slot with v-for
  // skip: scoped slot with v-for (plain elements)

  // #6725
  // TODO: fix scoped template with if
  it('scoped slot with v-if', done => {
    pending()
    const { page, vm } = createPage({
      data: {
        ok: false
      },
      template: `
        <test>
          <template v-if="ok" slot-scope="foo">
            <p>{{ foo.text }}</p>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return { msg: 'hello' }
          },
          template: `
            <div>
              <slot :text="msg">
                <span>{{ msg }} fallback</span>
              </slot>
            </div>
          `
        }
      }
    })
    const pageData = getPageData(page, '0')
    expect(pageData.h).toBeUndefined()
    vm.ok = true
    waitForUpdate(() => {
      expect(pageData.h[4].t).toBe('hello')
    }).then(done)
  })

  // #9422
  // the behavior of the new syntax is slightly different.
  it('scoped slot v-if using slot-scope value', (done) => {
    const { page } = createPage({
      template: `
        <test>
          <template slot-scope="{value}" v-if="value">foo {{value}}</template>
        </test>
      `,
      components: {
        test: {
          template: `<div><slot value="foo"></slot></div>`
        }
      },
      data () {
        return {
          title: 'test'
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    waitForUpdate(() => {
      // TODO: make slot snippet with v-if work
      // expect(comp1.s[3].if).toBeTruthy()
      expect(comp1.s['s3'].t).toBe('foo foo')
    }).then(done)
  })

  it('scoped slot snippet inside v-for', done => {
    const { page, vm } = createPage({
      template: `
        <test ref="test">
          <template slot-scope="scope">
            <span v-for="item in items" >{{ scope.info.name }} + {{ item }}</span>
          </template>
        </test>
      `,
      components: {
        test: {
          data () {
            return {
              info: {
                name: 'foo'
              }
            }
          },
          template: `
            <div>
              <slot :info="info"></slot>
            </div>
          `
        }
      },
      data () {
        return {
          items: [1, 2, 3]
        }
      }
    })

    const comp1 = getPageData(page, '0,0')

    function assertOutput () {
      vm.items.map((item, i) => {
        const name = vm.$refs.test.info.name
        expect(comp1.s[`s4-${i}`].t).toBe(`${name} + ${item}`)
      })
    }

    assertOutput()
    vm.items.reverse()
    waitForUpdate(() => {
      assertOutput()
    }).then(() => {
      vm.$refs.test.info.name = 'qux'
    }).then(() => {
      assertOutput()
    }).then(done)
  })
})


describe('v-slot syntax', () => {
  let warn
  beforeEach(() => {
    warn = console.warn
    console.warn = jasmine.createSpy()
    jasmine.clock().install()
  })

  afterEach(() => {
    console.warn = warn
    jasmine.clock().uninstall()
  })

  const Foo = {
    template: `
      <div>
        <slot :x="x"></slot>
        <slot name="one" :y="y"></slot>
        <slot name="two" :z="z"></slot>
      </div>
    `,
    data() {
      return {
        x: 100,
        y: 200,
        z: 300
      }
    }
  }

  const toNamed = (syntax, name) => syntax[0] === '#'
    ? `#${name}` // shorthand
    : `${syntax}:${name}` // full syntax

  function runSuite(syntax) {
    it('should work with v-slot', () => {
      const { page } = createPage({
        template: `
          <foo>
            <template ${syntax}="scope">{{ scope.x }}</template>
          </foo>
        `,
        components: { Foo }
      })
      const comp1 = getPageData(page, '0,0')
      expect(comp1.s['s3'].t).toBe('100')
    })
  
    it(`should work with ${syntax} using destructing`, () => {
      const { page } = createPage({
        template: `
          <foo>
            <template ${syntax}="{ x }">{{ x }}</template>
          </foo>
        `,
        components: { Foo }
      })
      const comp1 = getPageData(page, '0,0')
      expect(comp1.s['s3'].t).toBe('100')
    })
  
    it(`should work with ${syntax} using destructing`, () => {
      const { page } = createPage({
        template: `
          <foo>
            <template ${toNamed(syntax, 'default')}="{ x }">{{ x }}</template>
            <template ${toNamed(syntax, 'one')}="{ y }">{{ y }}</template>
            <template ${toNamed(syntax, 'two')}="{ z }">{{ z }}</template>
          </foo>
        `,
        components: { Foo }
      })
      const comp1 = getPageData(page, '0,0')
      expect(comp1.s['s3'].t).toBe('100')
      expect(comp1.s['s5'].t).toBe('200')
      expect(comp1.s['s7'].t).toBe('300')
    })
  
    it(`should work with ${syntax} using destructing on component`, () => {
      const { page } = createPage({
        template: `
          <foo ${syntax}="{ x }">{{ x }}</foo>
        `,
        components: { Foo }
      })
      const comp1 = getPageData(page, '0,0')
      expect(comp1.s['s3'].t).toBe('100')
    })

    it(`should warn ${syntax} usage on non-component elements`, () => {
      createPage({
        template: `
          <div ${syntax}="{ x }">{{ x }}</div>
        `
      })
      expect(console.warn.calls.argsFor(0)[0]).toContain(
        'v-slot can only be used on components or <template>'
      )
    })

    it('should warn mixed usage', () => {
      createPage({
        template: `
          <foo slot="one" slot-scope="bar" ${syntax}="bar"></foo>
        `,
        components: { Foo }
      })
      expect(console.warn.calls.argsFor(0)[0]).toContain(
        'Unexpected mixed usage of different slot syntaxes'
      )
    })
  }

  runSuite(`v-slot`)
  runSuite(`#default`)

})

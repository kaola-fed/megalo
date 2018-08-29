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

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h[3].t).toBe('hello')
    expect(comp1.s).toBe('0')
    vm.$refs.test.msg = 'world'
    waitForUpdate(() => {
      expect(pageData._h[3].t).toBe('world')
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

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h[2].t).toBe('hello')
    expect(comp1.s).toBe('0')
    vm.$refs.test.msg = 'world'
    waitForUpdate(() => {
      expect(pageData._h[2].t).toBe('world')
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

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h[3].t).toBe('hello world !')
    expect(comp1.s).toBe('0')
    vm.$refs.test.msg = 'bye'
    vm.$refs.test.obj.msg2 = 'bye'
    waitForUpdate(() => {
      expect(pageData._h[3].t).toBe('bye bye !')
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

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h[3].t).toBe('FOO')
    expect(pageData._h[5].t).toBe('BAR')
    expect(comp1.s).toBe('0')
    // expect(vm.$el.innerHTML).toBe('<span>FOO</span><span>BAR</span>')
    vm.$refs.test.foo = 'BAZ'
    waitForUpdate(() => {
      expect(pageData._h[3].t).toBe('BAZ')
      expect(pageData._h[5].t).toBe('BAR')
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
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h[2].t).toBe('FOO BAR')
    expect(comp1.s).toBe('0')
    vm.$refs.test.foo = 'BAZ'
    waitForUpdate(() => {
      expect(pageData._h[2].t).toBe('BAZ BAR')
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
    expect(comp1.s).toBeUndefined()
    expect(comp1._h[4].t).toBe('hello fallback')
  })

  // TODO: not supported
  it('slot with v-for', done => {
    pending()
    const { vm } = createPage({
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

    // const pageData = getPageData(page, '0')
    // const comp1 = getPageData(page, '0,0')
    // expect(pageData._h).toBeUndefined()
    // expect(comp1.s).toBeUndefined()
    function assertOutput () {
      // expect(vm.$el.innerHTML).toBe(vm.$refs.test.items.map(item => {
      //   return `<span>${item}</span>`
      // }).join(''))
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

  // TODO: not supported
  it('slot inside v-for', done => {
    pending()
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

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h).toBeUndefined()
    expect(comp1.s).toBeUndefined()

    function assertOutput () {
      // expect(vm.$el.innerHTML).toBe(vm.$refs.test.items.map(item => {
      //   return `<li><span>${item}</span></li>`
      // }).join(''))
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
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h[3].t).toBe('helloI am static')
    expect(comp1.s).toBe('0')
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

    const pageData = getPageData(page, '0')
    expect(pageData._h[3].t).toBe('meh')
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

  // #6725
  it('scoped slot with v-if', done => {
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
    expect(pageData._h).toBeUndefined()
    vm.ok = true
    waitForUpdate(() => {
      expect(pageData._h[3].t).toBe('hello')
    }).then(done)
  })
})

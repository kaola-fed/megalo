import { createPage, getPageData } from '../../helpers'

describe('Component slot', () => {
  let warn
  let vm, page
  beforeEach(() => {
    warn = console.warn
    console.warn = jasmine.createSpy()
    jasmine.clock().install()
  })

  afterEach(() => {
    console.warn = warn
    jasmine.clock().uninstall()
  })

  function mount (options) {
    const { childTemplate = '', parentContent = '' } = options || {}
    const pageInfo = createPage({
      data: {
        msg: 'parent message'
      },
      template: `<div><test>${parentContent}</test></div>`,
      components: {
        test: {
          template: childTemplate,
          data () {
            return {
              msg: 'child message'
            }
          }
        }
      }
    })
    vm = pageInfo.vm
    page = pageInfo.page
  }

  it('no content', () => {
    mount({
      childTemplate: '<div><slot></slot></div>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h).toBeUndefined()
    expect(comp1._h).toBeUndefined()
  })

  it('default slot', done => {
    mount({
      childTemplate: '<div><slot></slot></div>',
      parentContent: '<p>{{ msg }}</p>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h['4'].t).toBe('parent message')
    expect(comp1.s).toBe('0')
    vm.msg = 'changed'
    waitForUpdate(() => {
      expect(pageData.h['4'].t).toBe('changed')
      expect(comp1.s).toBe('0')
      // expect(child.$el.children[0].textContent).toBe('changed')
    }).then(done)
  })

  it('named slot', done => {
    mount({
      childTemplate: '<div><slot name="test"></slot></div>',
      parentContent: '<p slot="test">{{ msg }}</p>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h['4'].t).toBe('parent message')
    expect(comp1.s).toBe('0')
    // expect(child.$el.tagName).toBe('DIV')
    // expect(child.$el.children[0].tagName).toBe('P')
    // expect(child.$el.children[0].textContent).toBe('parent message')
    vm.msg = 'changed'
    waitForUpdate(() => {
      expect(pageData.h['4'].t).toBe('changed')
      expect(comp1.s).toBe('0')
      // expect(child.$el.children[0].textContent).toBe('changed')
    }).then(done)
  })

  it('named slot with 0 as a number', done => {
    mount({
      childTemplate: '<div><slot :name="0"></slot></div>',
      parentContent: '<p :slot="0">{{ msg }}</p>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h['4'].t).toBe('parent message')
    expect(comp1.s).toBe('0')
    // expect(child.$el.tagName).toBe('DIV')
    // expect(child.$el.children[0].tagName).toBe('P')
    // expect(child.$el.children[0].textContent).toBe('parent message')
    vm.msg = 'changed'
    waitForUpdate(() => {
      expect(pageData.h['4'].t).toBe('changed')
      expect(comp1.s).toBe('0')
      // expect(child.$el.children[0].textContent).toBe('changed')
    }).then(done)
  })

  it('fallback content', () => {
    mount({
      childTemplate: '<div><slot><p>{{msg}}</p></slot></div>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData._h).toBeUndefined()
    expect(comp1.s).toBeUndefined()
    expect(comp1.h[4].t).toBe('child message')
    // expect(child.$el.children[0].tagName).toBe('P')
    // expect(child.$el.textContent).toBe('child message')
  })

  it('fallback content with multiple named slots', () => {
    mount({
      childTemplate: `
        <div>
          <slot name="a"><p>fallback a</p></slot>
          <slot name="b">fallback b</slot>
        </div>
      `,
      parentContent: '<p slot="b">slot b{{msg}}</p>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    // static text is compiled to template
    expect(pageData.h[4].t).toBe('slot bparent message')
    expect(comp1.s).toBe('0')
  })

  it('fallback content with mixed named/unnamed slots', () => {
    mount({
      childTemplate: `
        <div>
          <slot><p>fallback a</p></slot>
          <slot name="b">fallback b</slot>
        </div>
      `,
      parentContent: '<p slot="b">slot b{{msg}}</p>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    // static text is compiled to template
    expect(pageData.h[4].t).toBe('slot bparent message')
    expect(comp1.s).toBe('0')
  })

  it('selector matching multiple elements', () => {
    mount({
      childTemplate: '<div><slot name="t"></slot></div>',
      parentContent: '<p slot="t">{{msg}}1</p><div></div><p slot="t">{{msg}}2</p>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    // static text is compiled to template
    expect(pageData.h[4].t).toBe('parent message1')
    expect(pageData.h[7].t).toBe('parent message2')
    expect(comp1.s).toBe('0')
  })

  it('default content should only render parts not selected', () => {
    mount({
      childTemplate: `
        <div>
          <slot name="a"></slot>
          <slot></slot>
          <slot name="b"></slot>
        </div>
      `,
      parentContent: '<div>{{msg}}foo</div><p slot="a">{{msg}}1</p><p slot="b">{{msg}}2</p>'
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    // static text is compiled to template
    expect(pageData.h[4].t).toBe('parent messagefoo')
    expect(pageData.h[6].t).toBe('parent message1')
    expect(pageData.h[8].t).toBe('parent message2')
    expect(comp1.s).toBe('0')
  })

  it('name should only match children', function () {
    mount({
      childTemplate: `
        <div>
          <slot name="a"><p>fallback a</p></slot>
          <slot name="b"><p>fallback b</p></slot>
          <slot name="c"><p>fallback c</p></slot>
        </div>
      `,
      parentContent: `
        '<p slot="b">select b{{msg}}</p>
        '<span><p slot="b">nested b{{msg}}</p></span>
        '<span><p slot="c">nested c{{msg}}</p></span>
      `
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    // static text is compiled to template
    expect(pageData.h[5].t).toBe('select bparent message')
    expect(comp1.s).toBe('0')
  })

  it('should accept expressions in slot attribute and slot names', () => {
    mount({
      childTemplate: `<div><slot :name="'a'"></slot></div>`,
      parentContent: `<p>one</p><p :slot="'a'">two{{msg}}</p>`
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    // static text is compiled to template
    expect(pageData.h[6].t).toBe('twoparent message')
    expect(comp1.s).toBe('0')
  })

  it('slot inside v-if', done => {
    const { page, vm } = createPage({
      data: {
        a: 1,
        b: 2,
        show: true
      },
      template: '<test :show="show"><p slot="b">{{b}}</p><p>{{a}}</p></test>',
      components: {
        test: {
          props: ['show'],
          template: '<div v-if="show"><slot></slot><slot name="b"></slot></div>'
        }
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')

    expect(pageData.h[3].t).toBe('2')
    expect(pageData.h[5].t).toBe('1')
    expect(comp1.h[0]._if).toBeTruthy()
    vm.a = 2
    waitForUpdate(() => {
      expect(pageData.h[3].t).toBe('2')
      expect(pageData.h[5].t).toBe('2')
      expect(comp1.h[0]._if).toBeTruthy()
      vm.show = false
    }).then(() => {
      expect(pageData.h[3].t).toBe('2')
      expect(pageData.h[5].t).toBe('2')
      expect(comp1.h[0]._if).toBeFalsy()
      vm.show = true
      vm.a = 3
    }).then(() => {
      expect(pageData.h[3].t).toBe('2')
      expect(pageData.h[5].t).toBe('3')
      expect(comp1.h[0]._if).toBeTruthy()
    }).then(done)
  })

  // dynamic slot not support
  it('slot inside v-for', () => {
    pending()
    mount({
      childTemplate: '<div><slot v-for="i in 3" :name="i"></slot></div>',
      parentContent: '<p v-for="i in 3" :slot="i">{{ i - 1 }}</p>'
    })

    // const pageData = getPageData(page, '0')
    // const comp1 = getPageData(page, '0,0')
    // static text is compiled to template
    // expect(pageData.h[6].t).toBe('twoparent message')
    // expect(comp1.s).toBe('0')
    // expect(child.$el.innerHTML).toBe('<p>0</p><p>1</p><p>2</p>')
  })

  it('nested slots', done => {
    const { page, vm } = createPage({
      template: '<test><test2><p>{{ msg }}</p></test2></test>',
      data: {
        msg: 'foo'
      },
      components: {
        test: {
          template: '<div><slot></slot></div>'
        },
        test2: {
          template: '<div><slot></slot></div>'
        }
      }
    })

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    const comp2 = getPageData(page, '0,1')

    expect(pageData.h[5].t).toBe('foo')
    expect(comp1.s).toBe('0')
    expect(comp2.s).toBe('0')
    vm.msg = 'bar'
    waitForUpdate(() => {
      expect(pageData.h[5].t).toBe('bar')
    }).then(done)
  })

  // TODO: so far, v-if=false won't fallback
  it('v-if on inserted content', done => {
    pending()
    const { page, vm } = createPage({
      template: '<test><p v-if="ok">{{ msg }}</p></test>',
      data: {
        ok: true,
        msg: 'hi'
      },
      components: {
        test: {
          template: '<div><slot>fallback</slot></div>'
        }
      }
    })

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')

    expect(pageData.h[2]._if).toBeTruthy()
    expect(pageData.h[3].t).toBe('hi')
    expect(comp1.s).toBe('0')
    vm.ok = false
    waitForUpdate(() => {
      expect(pageData.h[2]._if).toBeFalsy()
      expect(pageData.h[3].t).toBe('hi')
      vm.ok = true
      vm.msg = 'bye'
    }).then(() => {
      expect(pageData.h[2]._if).toBeTruthy()
      expect(pageData.h[3].t).toBe('bye')
    }).then(done)
  })

  it('template slot', function () {
    const { page } = createPage({
      template: '<test><template slot="test">{{msg}}</template></test>',
      components: {
        test: {
          template: '<div><slot name="test"></slot> world</div>'
        }
      },
      data: {
        msg: 'hello'
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h[3].t).toBe('hello')
    expect(comp1.s).toBe('0')
  })

  it('combined with v-for', () => {
    const { page } = createPage({
      template: '<div><test v-for="i in 3" :key="i">{{ i }}</test></div>',
      components: {
        test: {
          template: '<div><slot></slot></div>'
        }
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0-0')
    const comp2 = getPageData(page, '0,0-0')
    const comp3 = getPageData(page, '0,0-0')
    // expect(pageData.h[1].li).toEqual([1, 2, 3])
    expect(pageData.h[1].li.length).toBe(3)
    expect(pageData.h['3-0'].t).toBe('1')
    expect(pageData.h['3-1'].t).toBe('2')
    expect(pageData.h['3-2'].t).toBe('3')
    expect(comp1.s).toBe('0')
    expect(comp2.s).toBe('0')
    expect(comp3.s).toBe('0')
  })

  it('inside template v-if', () => {
    mount({
      childTemplate: `
        <div>
          <template v-if="true"><slot></slot></template>
        </div>
      `,
      parentContent: '{{msg}}'
    })
    // expect(child.$el.innerHTML).toBe('foo')
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h[3].t).toBe('parent message')
    expect(comp1.h[1]._if).toBeTruthy()
  })

  it('default slot should use fallback content if has only whitespace', () => {
    mount({
      childTemplate: `
        <div>
          <slot name="first"><p>first slot</p></slot>
          <slot><p>this is the default slot</p></slot>
          <slot name="second"><p>second named slot</p></slot>
        </div>
      `,
      parentContent: `<div slot="first">{{msg}}1</div> <div slot="second">{{msg}}2</div> <div slot="second">{{msg}}2+</div>`
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h[4].t).toBe('parent message1')
    expect(pageData.h[7].t).toBe('parent message2')
    expect(pageData.h[10].t).toBe('parent message2+')
    expect(comp1.s).toBe('0')
  })

  it('programmatic access to $slots', () => {
    const { page } = createPage({
      template: '<test><p slot="a">A{{msg}}</p><div>C{{msg}}</div><p slot="b">B{{msg}}</p></test>',
      components: {
        test: {
          render () {
            expect(this.$slots.a.length).toBe(1)
            expect(this.$slots.a[0].tag).toBe('p')
            expect(this.$slots.a[0].children.length).toBe(1)
            expect(this.$slots.a[0].children[0].text).toBe('Ahello')

            expect(this.$slots.b.length).toBe(1)
            expect(this.$slots.b[0].tag).toBe('p')
            expect(this.$slots.b[0].children.length).toBe(1)
            expect(this.$slots.b[0].children[0].text).toBe('Bhello')

            expect(this.$slots.default.length).toBe(1)
            expect(this.$slots.default[0].tag).toBe('div')
            expect(this.$slots.default[0].children.length).toBe(1)
            expect(this.$slots.default[0].children[0].text).toBe('Chello')

            return this.$slots.default[0]
          }
        }
      },
      data: {
        msg: 'hello'
      }
    })
    const pageData = getPageData(page, '0')
    expect(pageData.h[5].t).toBe('Chello')
  })

  it('warn if user directly returns array', () => {
    createPage({
      template: '<test><div></div></test>',
      components: {
        test: {
          render () {
            return this.$slots.default
          }
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'Render function should return a single root node'
    )
  })

  // the slot template is generated this way, cannot pass to the granchildren components
  it('should not keep slot name when passed further down', () => {
    const { page } = createPage({
      template: '<test><span slot="foo">{{msg}}foo</span></test>',
      components: {
        test: {
          template: '<child><slot name="foo"></slot></child>',
          components: {
            child: {
              template: `
                <div>
                  <div class="default"><slot></slot></div>
                  <div class="named"><slot name="foo"></slot></div>
                </div>
              `
            }
          }
        }
      },
      data: {
        msg: 'hello'
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h[3].t).toBe('hellofoo')
    expect(comp1.s).toBe('0')
    // expect(vm.$el.querySelector('.default').textContent).toBe('foo')
    // expect(vm.$el.querySelector('.named').textContent).toBe('')
  })

  // skip: should not keep slot name when passed further down (nested)
  // skip: should not keep slot name when passed further down (functional)

  // #3400
  it('named slots should be consistent across re-renders', done => {
    const { page, vm } = createPage({
      template: `
        <comp>
          <div slot="foo">{{msg}}foo</div>
        </comp>
      `,
      components: {
        comp: {
          data () {
            return { a: 1 }
          },
          template: `<div><slot name="foo"></slot>{{ a }}</div>`
        }
      },
      data: {
        msg: 'hello'
      }
    })
    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(comp1.s).toBe('0')
    expect(pageData.h[3].t).toBe('hellofoo')
    expect(comp1.h[3].t).toBe('1')
    vm.$children[0].a = 2
    waitForUpdate(() => {
      expect(pageData.h[3].t).toBe('hellofoo')
      expect(comp1.h[3].t).toBe('2')
    }).then(done)
  })

  // #3437
  it('should correctly re-create components in slot', done => {
    const calls = []
    const { vm } = createPage({
      template: `
        <comp ref="child">
          <div slot="foo">
            <child></child>
          </div>
        </comp>
      `,
      components: {
        comp: {
          data () {
            return { ok: true }
          },
          template: `<div><slot name="foo" v-if="ok"></slot></div>`
        },
        child: {
          template: '<div>child</div>',
          created () {
            calls.push(1)
          },
          destroyed () {
            calls.push(2)
          }
        }
      }
    })

    expect(calls).toEqual([1])
    vm.$refs.child.ok = false
    waitForUpdate(() => {
      expect(calls).toEqual([1, 2])
      vm.$refs.child.ok = true
    }).then(() => {
      expect(calls).toEqual([1, 2, 1])
      vm.$refs.child.ok = false
    }).then(() => {
      expect(calls).toEqual([1, 2, 1, 2])
    }).then(done)
  })

  it('warn duplicate slots', () => {
    createPage({
      template: `<div>
        <test>
          <div>foo</div>
          <div slot="a">bar</div>
        </test>
      </div>`,
      components: {
        test: {
          template: `<div>
            <slot></slot><slot></slot>
            <div v-for="i in 3"><slot name="a"></slot></div>
          </div>`
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'Duplicate presence of slot "default"'
    )
    expect(console.warn.calls.argsFor(1)[0]).toContain(
      'Duplicate presence of slot "a"'
    )
  })

  it('should not warn valid conditional slots', () => {
    createPage({
      template: `<div>
        <test>
          <div>foo</div>
        </test>
      </div>`,
      components: {
        test: {
          template: `<div>
            <slot v-if="true"></slot>
            <slot v-else></slot>
          </div>`
        }
      }
    })
    expect(console.warn.calls.argsFor(0)[0]).not.toContain(
      'Duplicate presence of slot "default"'
    )
  })

  it('events should not break when slot is toggled by v-if', done => {
    const spy = jasmine.createSpy()
    const { page, vm } = createPage({
      template: `<test><div class="click" @click="test">hi</div></test>`,
      methods: {
        test: spy
      },
      components: {
        test: {
          data: () => ({
            toggle: true
          }),
          template: `<div v-if="toggle"><slot></slot></div>`
        }
      }
    })

    const comp1 = getPageData(page, '0,0')
    expect(comp1.h[0]._if).toBeTruthy()
    // expect(vm.$el.textContent).toBe('hi')
    vm.$children[0].toggle = false
    waitForUpdate(() => {
      vm.$children[0].toggle = true
    }).then(() => {
      page._triggerEvent({ dataset: { cid: '0', hid: '2' }}, 'tap')
      expect(spy).toHaveBeenCalled()
    }).then(done)
  })

  // skip: renders static tree with text
  // skip: functional component as slot

  // #4209
  // TODO: passing slot in component is skip yet
  it('slot of multiple text nodes should not be infinitely merged', done => {
    pending()
    const wrap = {
      template: `<inner ref="inner">{{b}}foo<slot></slot></inner>`,
      components: {
        inner: {
          data: () => ({ a: 1 }),
          template: `<div>{{a}}<slot></slot></div>`
        }
      },
      data: {
        b: 'world'
      }
    }

    const { page, vm } = createPage({
      template: `<wrap ref="wrap">{{msg}}bar</wrap>`,
      components: { wrap },
      data: {
        msg: 'hello'
      }
    })

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    const comp2 = getPageData(page, '0,0,0')
    expect(pageData.h[2].t).toBe('hellobar')
    expect(comp1.h[2].t).toBe('worldfoo')
    expect(comp2.h[1].t).toBe('1')
    // expect(comp1.h[0]._if).toBeTruthy()

    // expect(vm.$el.textContent).toBe('1foobar')
    vm.$refs.wrap.$refs.inner.a++
    waitForUpdate(() => {
      // expect(vm.$el.textContent).toBe('2foobar')
    }).then(done)
  })

  // skip: functional component passing slot content to stateful child component

  it('the elements of slot should be updated correctly', done => {
    const { page, vm } = createPage({
      data: { n: 1 },
      template: '<div><test><span v-for="i in n" :key="i">{{ i }}</span><input value="a"/></test></div>',
      components: {
        test: {
          template: '<div><slot></slot></div>'
        }
      }
    })

    const pageData = getPageData(page, '0')
    const comp1 = getPageData(page, '0,0')
    expect(pageData.h['4-0'].t).toBe('1')
    expect(comp1.s).toBe('0')
    // const input = vm.$el.querySelector('input')
    // input.value = 'b'
    vm.n++
    waitForUpdate(() => {
      expect(pageData.h['4-0'].t).toBe('1')
      expect(pageData.h['4-1'].t).toBe('2')
      // expect(vm.$el.innerHTML).toBe('<div><span>1</span><span>2</span><input value="a"></div>')
      // expect(vm.$el.querySelector('input')).toBe(input)
      // expect(vm.$el.querySelector('input').value).toBe('b')
    }).then(done)
  })

  // skip: should resolve correctly slot with keep-alive
  // skip: should handle nested components in slots properly
  // skip: should preserve slot attribute if not absorbed by a Vue component

  // TODO: passing slot to component is skip
  it('passing a slot down as named slot', () => {
    pending()
    const Bar = {
      template: `<div class="bar"><slot name="foo"/></div>`
    }

    const Foo = {
      components: { Bar },
      template: `<div class="foo"><bar><slot slot="foo"/></bar></div>`
    }

    createPage({
      components: { Foo },
      template: `<div><foo>hello</foo></div>`
    })

    // expect(vm.$el.innerHTML).toBe('<div class="foo"><div class="bar">hello</div></div>')
  })

  // skip: fallback content for named template slot
  // skip: should not lose functional slot across renders
  // skip: should allow passing named slots as raw children down multiple layers of functional component
  // skip: should not match wrong named slot in functional component on re-render
  // TODO: passing slot to component is skip

  it('fallback content for named template slot', () => {
    pending()
    const Bar = {
      template: `<div class="bar"><slot name="foo">fallback</slot></div>`
    }

    const Foo = {
      components: { Bar },
      template: `<div class="foo"><bar><template slot="foo"/><slot/></template></bar></div>`
    }

    createPage({
      components: { Foo },
      template: `<div><foo></foo></div>`
    })

    // expect(vm.$el.innerHTML).toBe('<div class="foo"><div class="bar">fallback</div></div>')
  })
})

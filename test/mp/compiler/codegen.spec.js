
import { compile } from 'mp/compiler'

// import { parse } from 'compiler/parser/index'
// import { optimize } from 'compiler/optimizer'
// import { generate } from 'mp/compiler/codegen'
// import { isObject, extend } from 'shared/util'
// import { isReservedTag } from 'mp/util/index'
// import { baseOptions } from 'mp/compiler/options'

function assertCodegen (template, generatedCode, options) {
  const compiled = compile(template, options)
  // console.log(compiled.render)
  // let staticRenderFnCodes = []
  // let generateOptions = baseOptions
  // let proc = null
  // let len = args.length
  // while (len--) {
  //   const arg = args[len]
  //   if (Array.isArray(arg)) {
  //     staticRenderFnCodes = arg
  //   } else if (isObject(arg)) {
  //     generateOptions = arg
  //   } else if (typeof arg === 'function') {
  //     proc = arg
  //   }
  // }
  // const ast = parse(template, baseOptions)
  // optimize(ast, baseOptions)
  // proc && proc(ast)
  // const res = generate(ast, generateOptions)
  expect(compiled.render).toBe(generatedCode)
  // expect(res.staticRenderFns).toEqual(staticRenderFnCodes)
}

/* eslint-disable quotes */
describe('codegen', () => {
  it('generate vnode with h_', () => {
    assertCodegen(
      `<div></div>`,
      `with(this){return _c('div',{attrs:{"h_":0}})}`
    )

    assertCodegen(
      (
        `<div>` +
          `<h1></h1>` +
          `<p>` +
            `<span></span>` +
          `</p>` +
        `</div>`
      ),
      `with(this){return _c('div',{attrs:{"h_":0}},[_c('h1',{attrs:{"h_":1}}),_c('p',{attrs:{"h_":2}},[_c('span',{attrs:{"h_":3}})])],1)}`
    )
  })

  it('generate text content', () => {
    assertCodegen(
      '<div>static</div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[])}`
    )

    assertCodegen(
      '<div>{{ title }}</div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_v(_s(title),1)])}`
    )

    assertCodegen(
      '<div>head {{ title }} tail</div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_v("head "+_s(title)+" tail",1)])}`
    )

    assertCodegen(
      '<div>{{ title }} {{ subTitle }}</div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_v(_s(title)+" "+_s(subTitle),1)])}`
    )
  })

  it('generate component with c_', () => {
    assertCodegen(
      (
        `<div>` +
          `<CompA>` +
            `<CompB></CompB>` +
          `</CompA>` +
        `</div>`
      ),
      `with(this){return _c('div',{attrs:{"h_":0}},[_c('CompA',{attrs:{"h_":1,"c_":0}},[_c('CompB',{attrs:{"h_":3,"c_":1}})],1)],1)}`,
      {
        imports: {
          CompA: { name: 'compa' },
          CompB: { name: 'compb' }
        }
      }
    )
  })

  it('generate filters', () => {
    assertCodegen(
      '<div :id="a | b | c">{{ d | e | f }}</div>',
      `with(this){return _c('div',{attrs:{"id":_f("c")(_f("b")(a)),"h_":0}},[_v(_s(_f("f")(_f("e")(d))),1)])}`
    )
  })

  it('generate filters with no arguments', () => {
    assertCodegen(
      '<div>{{ d | e() }}</div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_v(_s(_f("e")(d)),1)])}`
    )
  })

  it('generate v-for directive', () => {
    assertCodegen(
      '<div><li v-for="item in items" :key="item.uid"></li></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},_l((items),function(item,item_i1,item_i2){var f_ = (item_i2 !== undefined ? item_i2 : item_i1);return _c('li',{key:item.uid,attrs:{"h_":1,"f_":f_,"k_":"uid"}})},[1],_self))}`
    )
    // iterator syntax
    assertCodegen(
      '<div><li v-for="(item, i) in items"></li></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},_l((items),function(item,i,item_i2){var f_ = (item_i2 !== undefined ? item_i2 : i);return _c('li',{attrs:{"h_":1,"f_":f_}})},[1],_self))}`
    )
    // TODO: support for object
    // assertCodegen(
    //   '<div><li v-for="(item, key, index) in items"></li></div>',
    //   // `with(this){return _c('div',_l((items),function(item,key,index){return _c('li')}))}`,
    //   `with(this){return _c('div',{attrs:{"h_":0}},_l((items),function(item,key,index){return _c('li',{attrs:{"h_":1 + '-' + key}})},1,_self))}`
    // )
    // TODO: support for destructuring
    // destructuring
    // assertCodegen(
    //   '<div><li v-for="{ a, b } in items"></li></div>',
    //   `with(this){return _c('div',_l((items),function({ a, b }){return _c('li')}))}`
    // )
    // assertCodegen(
    //   '<div><li v-for="({ a, b }, key, index) in items"></li></div>',
    //   `with(this){return _c('div',_l((items),function({ a, b },key,index){return _c('li')}))}`
    // )
    // v-for with extra element
    assertCodegen(
      '<div><p></p><li v-for="item in items"></li></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_c('p',{attrs:{"h_":1}}),_l((items),function(item,item_i1,item_i2){var f_ = (item_i2 !== undefined ? item_i2 : item_i1);return _c('li',{attrs:{"h_":2,"f_":f_}})},[2],_self)],1)}`
    )
    // embeded v-for
    assertCodegen(
      '<div><li v-for="i in 3"><span v-for="i in 3"></span></li></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},_l((3),function(i,i_i1,i_i2){var f_ = (i_i2 !== undefined ? i_i2 : i_i1);return _c('li',{attrs:{"h_":1,"f_":f_}},_l((3),function(i,i_i1,i_i2){var f_ = (i_i2 !== undefined ? i_i2 : i_i1) + '-' + (i_i2 !== undefined ? i_i2 : i_i1);return _c('span',{attrs:{"h_":2,"f_":f_}})},[2, (i_i2 !== undefined ? i_i2 : i_i1)],_self))},[1],_self))}`
    )
    // component in v-for, slot element should not have fid
    assertCodegen(
      '<div><li v-for="i in 3"><compa><div></div></compa></li></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},_l((3),function(i,i_i1,i_i2){var f_ = (i_i2 !== undefined ? i_i2 : i_i1);return _c('li',{attrs:{"h_":1,"f_":f_}},[_c('compa',{attrs:{"h_":2,"f_":f_,"c_":0}},[_c('div',{attrs:{"h_":4}})])],1)},[1],_self))}`,
      { imports: { compa: { name: 'compa' }}}
    )
  })

  it('generate v-if directive', () => {
    assertCodegen(
      '<p v-if="show">hello</p>',
      `with(this){return (_ri(!!(show), 0))?_c('p',{attrs:{"h_":0}},[]):_e()}`
    )
  })

  it('generate v-else directive', () => {
    assertCodegen(
      '<div><p v-if="show">hello</p><p v-else>world</p></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[(_ri(!!(show), 1))?_c('p',{attrs:{"h_":1}},[]):_c('p',{attrs:{"h_":3}},[])],1)}`
    )
  })

  it('generate v-else-if directive', () => {
    assertCodegen(
      '<div><p v-if="show">hello</p><p v-else-if="hide">world</p></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[(_ri(!!(show), 1))?_c('p',{attrs:{"h_":1}},[]):(_ri(!!(hide), 3))?_c('p',{attrs:{"h_":3}},[]):_e()],1)}`
    )
  })

  it('generate v-else-if with v-else directive', () => {
    assertCodegen(
      '<div><p v-if="show">hello</p><p v-else-if="hide">world</p><p v-else>bye</p></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[(_ri(!!(show), 1))?_c('p',{attrs:{"h_":1}},[]):(_ri(!!(hide), 3))?_c('p',{attrs:{"h_":3}},[]):_c('p',{attrs:{"h_":5}},[])],1)}`
    )
  })

  it('generate multi v-else-if with v-else directive', () => {
    assertCodegen(
      '<div><p v-if="show">hello</p><p v-else-if="hide">world</p><p v-else-if="3">elseif</p><p v-else>bye</p></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[(_ri(!!(show), 1))?_c('p',{attrs:{"h_":1}},[]):(_ri(!!(hide), 3))?_c('p',{attrs:{"h_":3}},[]):(_ri(!!(3), 5))?_c('p',{attrs:{"h_":5}},[]):_c('p',{attrs:{"h_":7}},[])],1)}`
    )
  })

  it('generate multi v-if group', () => {
    assertCodegen(
      '<div><p v-if="show">hello</p><p v-else-if="hide">world</p><p v-if="show">hello</p><p v-else-if="hide">world</p></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[(_ri(!!(show), 1))?_c('p',{attrs:{"h_":1}},[]):(_ri(!!(hide), 3))?_c('p',{attrs:{"h_":3}},[]):_e(),(_ri(!!(show), 5))?_c('p',{attrs:{"h_":5}},[]):(_ri(!!(hide), 7))?_c('p',{attrs:{"h_":7}},[]):_e()],1)}`
    )
  })

  it('generate v-if directive inside components', () => {
    assertCodegen(
      '<test><p v-if="show">hello</p></test>',
      `with(this){return _c('test',{attrs:{"h_":0,"c_":0}},[(_ri(!!(show), 2))?_c('p',{attrs:{"h_":2,"i_":[ !!(show), 2, null ]}},[]):_c("a", {attrs: {i_:[!!(show), 2, null]}})],1)}`,
      { imports: { test: { name: 'test' }}}
    )
    assertCodegen(
      '<test><p v-if="show">hello</p><p v-else-if="show2"></p></test>',
      `with(this){return _c('test',{attrs:{"h_":0,"c_":0}},[(_ri(!!(show), 2))?_c('p',{attrs:{"h_":2,"i_":[ !!(show), 2, null,!!(show2), 4, null ]}},[]):(_ri(!!(show2), 4))?_c('p',{attrs:{"h_":4,"i_":[ !!(show), 2, null,!!(show2), 4, null ]}}):_c("a", {attrs: {i_:[!!(show), 2, null,!!(show2), 4, null]}})],1)}`,
      { imports: { test: { name: 'test' }}}
    )
    assertCodegen(
      '<test><p v-if="show">hello</p><p v-else></p></test>',
      `with(this){return _c('test',{attrs:{"h_":0,"c_":0}},[(_ri(!!(show), 2))?_c('p',{attrs:{"h_":2,"i_":[ !!(show), 2, null ]}},[]):_c('p',{attrs:{"h_":4,"i_":[ !!(show), 2, null ]}})],1)}`,
      { imports: { test: { name: 'test' }}}
    )
  })

  // it('generate ref', () => {
  //   assertCodegen(
  //     '<p ref="component1"></p>',
  //     `with(this){return _c('p',{ref:"component1"})}`
  //   )
  // })

  // it('generate ref on v-for', () => {
  //   assertCodegen(
  //     '<ul><li v-for="item in items" ref="component1"></li></ul>',
  //     `with(this){return _c('ul',_l((items),function(item){return _c('li',{ref:"component1",refInFor:true})}))}`
  //   )
  // })

  it('generate v-bind directive', () => {
    assertCodegen(
      '<p v-bind="test"></p>',
      `with(this){return _c('p',_b({attrs:{"h_":0}},'p',test,false))}`
    )
  })

  // it('generate v-bind with prop directive', () => {
  //   assertCodegen(
  //     '<p v-bind.prop="test"></p>',
  //     `with(this){return _c('p',_b({},'p',test,true))}`
  //   )
  // })

  // it('generate v-bind directive with sync modifier', () => {
  //   assertCodegen(
  //     '<p v-bind.sync="test"></p>',
  //     `with(this){return _c('p',_b({},'p',test,false,true))}`
  //   )
  // })

  it('generate template tag', () => {
    assertCodegen(
      '<div><template><p>{{hello}}</p></template></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[[_c('p',{attrs:{"h_":2}},[_v(_s(hello),3)])]],1)}`
    )
  })

  it('generate single slot', () => {
    assertCodegen(
      '<div><slot></slot></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_t("default",null,{h_:1})],1)}`
    )
  })

  it('generate named slot', () => {
    assertCodegen(
      '<div><slot name="one"></slot></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_t("one",null,{h_:1})],1)}`
    )
  })

  it('generate slot fallback content', () => {
    assertCodegen(
      '<div><slot><div>hi</div></slot></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_t("default",[_c('div',{attrs:{"h_":2}},[])],{h_:1})],1)}`
    )
  })

  it('generate slot target', () => {
    assertCodegen(
      '<p slot="one">hello world</p>',
      `with(this){return _c('p',{attrs:{"slot":"one","h_":0},slot:"one"},[])}`
    )
  })

  it('generate scoped slot', () => {
    assertCodegen(
      '<foo><template slot-scope="bar">{{ bar }}</template></foo>',
      `with(this){return _c('foo',{attrs:{"h_":0,"c_":0},scopedSlots:_u([{key:"default",fn:function(bar){return [_v(_s(bar),3)]}}])})}`,
      { imports: { foo: { name: 'foo' }}}
    )
    assertCodegen(
      '<foo><div slot-scope="bar">{{ bar }}</div></foo>',
      `with(this){return _c('foo',{attrs:{"h_":0,"c_":0},scopedSlots:_u([{key:"default",fn:function(bar){return _c('div',{attrs:{"h_":2}},[_v(_s(bar),3)])}}])})}`,
      { imports: { foo: { name: 'foo' }}}
    )
  })

  it('generate named scoped slot', () => {
    assertCodegen(
      '<foo><template slot="foo" slot-scope="bar">{{ bar }}</template></foo>',
      `with(this){return _c('foo',{attrs:{"h_":0,"c_":0},scopedSlots:_u([{key:"foo",fn:function(bar){return [_v(_s(bar),3)]}}])})}`,
      { imports: { foo: { name: 'foo' }, bar: { name: 'bar' }}}
    )
    assertCodegen(
      '<foo><div slot="foo" slot-scope="bar">{{ bar }}</div></foo>',
      `with(this){return _c('foo',{attrs:{"h_":0,"c_":0},scopedSlots:_u([{key:"foo",fn:function(bar){return _c('div',{attrs:{"h_":2}},[_v(_s(bar),3)])}}])})}`,
      { imports: { foo: { name: 'foo' }, bar: { name: 'bar' }}}
    )
  })

  it('generate class binding', () => {
    // static
    assertCodegen(
      '<p class="class1">hello world</p>',
      `with(this){return _c('p',{attrs:{"h_":0}},[])}`,
    )
    // dynamic
    assertCodegen(
      '<p :class="class1">hello world</p>',
      `with(this){return _c('p',{class:class1,attrs:{"h_":0}},[])}`
    )
  })

  it('generate style binding', () => {
    assertCodegen(
      '<p :style="error">hello world</p>',
      `with(this){return _c('p',{style:(error),attrs:{"h_":0}},[])}`
    )
  })

  it('generate v-show directive', () => {
    assertCodegen(
      '<p v-show="shown">hello world</p>',
      `with(this){return _c('p',{directives:[{name:"show",rawName:"v-show",value:(shown),expression:"shown"}],attrs:{"h_":0}},[])}`
    )
  })

  it('generate DOM props with v-bind directive', () => {
    // input + value
    assertCodegen(
      '<input :value="msg">',
      `with(this){return _c('input',{attrs:{"value":msg,"h_":0}})}`
    )
    // non input
    assertCodegen(
      '<p :value="msg"/>',
      `with(this){return _c('p',{attrs:{"value":msg,"h_":0}})}`
    )
  })

  it('generate attrs with v-bind directive', () => {
    assertCodegen(
      '<input :name="field1">',
      `with(this){return _c('input',{attrs:{"name":field1,"h_":0}})}`
    )
    assertCodegen(
      '<input :data-name="field1">',
      `with(this){return _c('input',{attrs:{"data-name":field1,"h_":0}})}`
    )
  })

  it('generate static attrs', () => {
    assertCodegen(
      '<input name="field1">',
      `with(this){return _c('input',{attrs:{"h_":0}})}`
    )
  })

  it('generate events with v-on directive', () => {
    assertCodegen(
      '<input @input="onInput">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":onInput}})}`
    )
  })

  it('generate events with method call', () => {
    assertCodegen(
      '<input @input="onInput($event);">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput($event);}}})}`
    )
    // empty arguments
    assertCodegen(
      '<input @input="onInput();">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput();}}})}`
    )
    // without semicolon
    assertCodegen(
      '<input @input="onInput($event)">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput($event)}}})}`
    )
    // multiple args
    assertCodegen(
      '<input @input="onInput($event, \'abc\', 5);">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput($event, 'abc', 5);}}})}`
    )
    // expression in args
    assertCodegen(
      '<input @input="onInput($event, 2+2);">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput($event, 2+2);}}})}`
    )
    // tricky symbols in args
    assertCodegen(
      '<input @input="onInput(\');[\'());\');">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput(');['());');}}})}`
    )
  })

  it('generate events with multiple statements', () => {
    // normal function
    assertCodegen(
      '<input @input="onInput1();onInput2()">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput1();onInput2()}}})}`
    )
    // function with multiple args
    assertCodegen(
      '<input @input="onInput1($event, \'text\');onInput2(\'text2\', $event)">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){onInput1($event, 'text');onInput2('text2', $event)}}})}`
    )
  })

  // TODO: notify not supported
  // it('generate events with keycode', () => {
  //   assertCodegen(
  //     '<input @input.enter="onInput">',
  //     `with(this){return _c('input',{on:{"input":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;return onInput($event)}}})}`
  //   )
  //   // multiple keycodes (delete)
  //   assertCodegen(
  //     '<input @input.delete="onInput">',
  //     `with(this){return _c('input',{on:{"input":function($event){if(!('button' in $event)&&_k($event.keyCode,"delete",[8,46],$event.key,["Backspace","Delete"]))return null;return onInput($event)}}})}`
  //   )
  //   // multiple keycodes (chained)
  //   assertCodegen(
  //     '<input @keydown.enter.delete="onInput">',
  //     `with(this){return _c('input',{on:{"keydown":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter")&&_k($event.keyCode,"delete",[8,46],$event.key,["Backspace","Delete"]))return null;return onInput($event)}}})}`
  //   )
  //   // number keycode
  //   assertCodegen(
  //     '<input @input.13="onInput">',
  //     `with(this){return _c('input',{on:{"input":function($event){if(!('button' in $event)&&$event.keyCode!==13)return null;return onInput($event)}}})}`
  //   )
  //   // custom keycode
  //   assertCodegen(
  //     '<input @input.custom="onInput">',
  //     `with(this){return _c('input',{on:{"input":function($event){if(!('button' in $event)&&_k($event.keyCode,"custom",undefined,$event.key,undefined))return null;return onInput($event)}}})}`
  //   )
  // })

  it('generate events with generic modifiers', () => {
    assertCodegen(
      '<input @input.stop="onInput">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){if(!('button' in $event)&&_k($event.keyCode,"stop",undefined,$event.key,undefined))return null;return onInput($event)}}})}`
    )
    // TODO: try support
    // assertCodegen(
    //   '<input @input.prevent="onInput">',
    //   `with(this){return _c('input',{on:{"input":function($event){$event.preventDefault();return onInput($event)}}})}`
    // )
    // TODO: verified
    // assertCodegen(
    //   '<input @input.self="onInput">',
    //   `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){if($event.target !== $event.currentTarget)return null;return onInput($event)}}})}`
    // )
  })

  // // GitHub Issues #5146
  // it('generate events with generic modifiers and keycode correct order', () => {
  //   assertCodegen(
  //     '<input @keydown.enter.prevent="onInput">',
  //     `with(this){return _c('input',{on:{"keydown":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;$event.preventDefault();return onInput($event)}}})}`
  //   )

  //   assertCodegen(
  //     '<input @keydown.enter.stop="onInput">',
  //     `with(this){return _c('input',{on:{"keydown":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;$event.stopPropagation();return onInput($event)}}})}`
  //   )
  // })

  // it('generate events with mouse event modifiers', () => {
  //   assertCodegen(
  //     '<input @click.ctrl="onClick">',
  //     `with(this){return _c('input',{on:{"click":function($event){if(!$event.ctrlKey)return null;return onClick($event)}}})}`
  //   )
  //   assertCodegen(
  //     '<input @click.shift="onClick">',
  //     `with(this){return _c('input',{on:{"click":function($event){if(!$event.shiftKey)return null;return onClick($event)}}})}`
  //   )
  //   assertCodegen(
  //     '<input @click.alt="onClick">',
  //     `with(this){return _c('input',{on:{"click":function($event){if(!$event.altKey)return null;return onClick($event)}}})}`
  //   )
  //   assertCodegen(
  //     '<input @click.meta="onClick">',
  //     `with(this){return _c('input',{on:{"click":function($event){if(!$event.metaKey)return null;return onClick($event)}}})}`
  //   )
  //   assertCodegen(
  //     '<input @click.exact="onClick">',
  //     `with(this){return _c('input',{on:{"click":function($event){if($event.ctrlKey||$event.shiftKey||$event.altKey||$event.metaKey)return null;return onClick($event)}}})}`
  //   )
  //   assertCodegen(
  //     '<input @click.ctrl.exact="onClick">',
  //     `with(this){return _c('input',{on:{"click":function($event){if(!$event.ctrlKey)return null;if($event.shiftKey||$event.altKey||$event.metaKey)return null;return onClick($event)}}})}`
  //   )
  // })

  // it('generate events with multiple modifiers', () => {
  //   assertCodegen(
  //     '<input @input.stop.prevent.self="onInput">',
  //     `with(this){return _c('input',{on:{"input":function($event){$event.stopPropagation();$event.preventDefault();if($event.target !== $event.currentTarget)return null;return onInput($event)}}})}`
  //   )
  // })

  // TODO: verify or support
  // it('generate events with capture modifier', () => {
  //   assertCodegen(
  //     '<input @input.capture="onInput">',
  //     `with(this){return _c('input',{on:{"!input":function($event){return onInput($event)}}})}`
  //   )
  // })

  // TODO: verify or support
  // it('generate events with once modifier', () => {
  //   assertCodegen(
  //     '<input @input.once="onInput">',
  //     `with(this){return _c('input',{on:{"~input":function($event){return onInput($event)}}})}`
  //   )
  // })

  // TODO: verify or support
  // it('generate events with capture and once modifier', () => {
  //   assertCodegen(
  //     '<input @input.capture.once="onInput">',
  //     `with(this){return _c('input',{on:{"~!input":function($event){return onInput($event)}}})}`
  //   )
  // })

  // TODO: verify or support
  // it('generate events with once and capture modifier', () => {
  //   assertCodegen(
  //     '<input @input.once.capture="onInput">',
  //     `with(this){return _c('input',{on:{"~!input":function($event){return onInput($event)}}})}`
  //   )
  // })

  // TODO: verify or support
  it('generate events with inline statement', () => {
    assertCodegen(
      '<input @input="current++">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function($event){current++}}})}`
    )
  })

  it('generate events with inline function expression', () => {
    // normal function
    assertCodegen(
      '<input @input="function () { current++ }">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":function () { current++ }}})}`
    )
    // arrow with no args
    assertCodegen(
      '<input @input="()=>current++">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":()=>current++}})}`
    )
    // arrow with parens, single arg
    assertCodegen(
      '<input @input="(e) => current++">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":(e) => current++}})}`
    )
    // arrow with parens, multi args
    assertCodegen(
      '<input @input="(a, b, c) => current++">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":(a, b, c) => current++}})}`
    )
    // arrow with destructuring
    assertCodegen(
      '<input @input="({ a, b }) => current++">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":({ a, b }) => current++}})}`
    )
    // arrow single arg no parens
    assertCodegen(
      '<input @input="e=>current++">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":e=>current++}})}`
    )
    // with modifiers
    // assertCodegen(
    //   `<input @keyup.enter="e=>current++">`,
    //   `with(this){return _c('input',{on:{"keyup":function($event){if(!('button' in $event)&&_k($event.keyCode,"enter",13,$event.key,"Enter"))return null;return (e=>current++)($event)}}})}`
    // )
  })

  // #3893
  it('should not treat handler with unexpected whitespace as inline statement', () => {
    assertCodegen(
      '<input @input=" onInput ">',
      `with(this){return _c('input',{attrs:{"h_":0},on:{"input":onInput}})}`
    )
  })

  // it('generate unhandled events', () => {
  //   assertCodegen(
  //     '<input @input="current++">',
  //     `with(this){return _c('input',{on:{"input":function(){}}})}`,
  //     ast => {
  //       ast.events.input = undefined
  //     }
  //   )
  // })

  // it('generate multiple event handlers', () => {
  //   assertCodegen(
  //     '<input @input="current++" @input.stop="onInput">',
  //     `with(this){return _c('input',{on:{"input":[function($event){current++},function($event){$event.stopPropagation();return onInput($event)}]}})}`
  //   )
  // })

  it('generate component', () => {
    assertCodegen(
      '<my-component name="mycomponent1" :msg="msg" @notify="onNotify"><div>hi</div></my-component>',
      `with(this){return _c('my-component',{attrs:{"name":"mycomponent1","msg":msg,"h_":0,"c_":0},on:{"notify":onNotify}},[_c('div',{attrs:{"h_":2}},[])])}`,
      {
        imports: {
          myComponent: { name: 'myComponent' }
        }
      }
    )
  })

  // it('generate svg component with children', () => {
  //   assertCodegen(
  //     '<svg><my-comp><circle :r="10"></circle></my-comp></svg>',
  //     `with(this){return _c('svg',[_c('my-comp',[_c('circle',{attrs:{"r":10}})])],1)}`
  //   )
  // })

  // TODO: not supported
  // it('generate is attribute', () => {
  //   assertCodegen(
  //     '<div is="component1"></div>',
  //     `with(this){return _c("component1",{tag:"div"})}`
  //   )
  //   assertCodegen(
  //     '<div :is="component1"></div>',
  //     `with(this){return _c(component1,{tag:"div"})}`
  //   )
  // })

  // TODO: not supported
  // it('generate component with inline-template', () => {
  //   // have "inline-template'"
  //   assertCodegen(
  //     '<my-component inline-template><p><span>hello world</span></p></my-component>',
  //     `with(this){return _c('my-component',{inlineTemplate:{render:function(){with(this){return _m(0)}},staticRenderFns:[function(){with(this){return _c('p',[_c('span',[_v("hello world")])])}}]}})}`
  //   )
  //   // "have inline-template attrs, but not having exactly one child element
  //   assertCodegen(
  //     '<my-component inline-template><hr><hr></my-component>',
  //     `with(this){return _c('my-component',{inlineTemplate:{render:function(){with(this){return _c('hr')}},staticRenderFns:[]}})}`
  //   )
  //   try {
  //     assertCodegen(
  //       '<my-component inline-template></my-component>',
  //       ''
  //     )
  //   } catch (e) {}
  //   expect('Inline-template components must have exactly one child element.').toHaveBeenWarned()
  //   expect(console.error.calls.count()).toBe(2)
  // })

  // it('generate static trees inside v-for', () => {
  //   assertCodegen(
  //     `<div><div v-for="i in 10"><p><span></span></p></div></div>`,
  //     `with(this){return _c('div',_l((10),function(i){return _c('div',[_m(0,true)])}))}`,
  //     [`with(this){return _c('p',[_c('span')])}`]
  //   )
  // })

  it('generate component with v-for', () => {
    // normalize type: 2
    assertCodegen(
      '<div><child></child><template v-for="item in list">{{ item }}</template></div>',
      `with(this){return _c('div',{attrs:{"h_":0}},[_c('child',{attrs:{"h_":1,"c_":0}}),_l((list),function(item,item_i1,item_i2){var f_ = (item_i2 !== undefined ? item_i2 : item_i1);return [_v(_s(item),4,f_)]},[3],_self)],1)}`,
      {
        imports: {
          child: { name: 'child' }
        }
      }
    )
  })

  // TODO: not supported
  // it('generate component with comment', () => {
  //   const options = extend({
  //     comments: true
  //   }, baseOptions)
  //   const template = '<div><!--comment--></div>'
  //   const generatedCode = `with(this){return _c('div',[_e("comment")])}`

  //   const ast = parse(template, options)
  //   optimize(ast, options)
  //   const res = generate(ast, options)
  //   expect(res.render).toBe(generatedCode)
  // })

  // TODO: not supported
  // // #6150
  // it('generate comments with special characters', () => {
  //   const options = extend({
  //     comments: true
  //   }, baseOptions)
  //   const template = '<div><!--\n\'comment\'\n--></div>'
  //   const generatedCode = `with(this){return _c('div',[_e("\\n'comment'\\n")])}`

  //   const ast = parse(template, options)
  //   optimize(ast, options)
  //   const res = generate(ast, options)
  //   expect(res.render).toBe(generatedCode)
  // })

  // it('not specified ast type', () => {
  //   const res = generate(null, baseOptions)
  //   expect(res.render).toBe(`with(this){return _c("div")}`)
  //   expect(res.staticRenderFns).toEqual([])
  // })

  // it('not specified directives option', () => {
  //   assertCodegen(
  //     '<p v-if="show">hello world</p>',
  //     `with(this){return (show)?_c('p',[_v("hello world")]):_e()}`,
  //     { isReservedTag }
  //   )
  // })

  it('generate default value', () => {
    // normalize type: 2
    assertCodegen(
      '<div a ></div>',
      `with(this){return _c('div',{attrs:{"h_":0}})}`
    )
    assertCodegen(
      '<div a="" ></div>',
      `with(this){return _c('div',{attrs:{"h_":0}})}`
    )
    assertCodegen(
      '<div a="false" ></div>',
      `with(this){return _c('div',{attrs:{"h_":0}})}`
    )
  })

  it('generate multi v-bind', () => {
    // normalize type: 2
    assertCodegen(
      '<div :a="A" v-bind:b="B" c></div>',
      `with(this){return _c('div',{attrs:{"a":A,"b":B,"h_":0}})}`
    )
  })

  it('deal with mp:key', () => {
    assertCodegen(
      '<div mp:key="1"></div>',
      `with(this){return _c('div',{attrs:{"h_":0}})}`
    )
    assertCodegen(
      '<div :mp:key="test"></div>',
      `with(this){return _c('div',{attrs:{"key":test,"h_":0}})}`
    )
  })
})
/* eslint-enable quotes */

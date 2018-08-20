import { compileToTemplate } from 'mp/compiler'
import tagMap from '../helpers/tag-map'

const CompA = {
  name: 'CompA$1234',
  src: './CompA$1234'
}

const CompB = {
  name: 'CompB$1234',
  src: './CompB$1234'
}

const options = {
  name: 'App$1234',
  imports: {
    CompA,
    CompB
  }
}

let slotCount = -1
function slotName (name) {
  slotCount += 1
  return `${name}$${slotCount}`
}

function wrapHtml (code) {
  return `<div>${code}</div>`
}

function wrapMP (code, options = {}) {
  const { imports = {}, name = 'defaultName' } = options
  const importStr = Object.keys(imports)
    .map(k => `<import src="${imports[k].src}"/>`)
    .join('')
  return (
    importStr +
    `<template name="${name}">` +
      `<view class="_div">${code}</view>` +
    `</template>`
  )
}

function assertCodegen (body, assertTemplate, options = {}, callback) {
  const template = wrapHtml(body)
  const output = compileToTemplate(template, options)

  expect(output.body).toEqual(wrapMP(assertTemplate, options))

  typeof callback === 'function' && callback(output)
  // expect(JSON.stringify(output.slots)).toEqual(JSON.stringify(slots))
  // expect(output.code.replace(/\n/g, '')).toMatch(strToRegExp(assertTemplate))
}

describe('compilteToTemplate: wechat', () => {
  const baseTagList = Object.keys(tagMap)
    .map(k => ({
      html: k,
      mp: tagMap[k]
    }))
    .filter(tag => tag.html !== 'template' && tag.html !== 'script' && tag.html !== 'br')

  it(`generate base tag`, () => {
    baseTagList.forEach((tag) => {
      const htmlTag = tag.html
      const mpTag = tag.mp
      assertCodegen(
        `<${htmlTag}></${htmlTag}>`,
        `<${mpTag} class="_${htmlTag}"></${mpTag}>`
      )
    })
  })

  it('static text', () => {
    assertCodegen(
      `<div>static text</div>`,
      `<view class="_div">static text</view>`,
    )

    assertCodegen(
      `<div>static text with &lt;</div>`,
      `<view class="_div">static text with {{"<"}}</view>`,
    )

    assertCodegen(
      `<div>static text with <</div>`,
      `<view class="_div">static text with {{"<"}}</view>`,
    )

    assertCodegen(
      `<div>static text with ~\`!@#$%^&*()_+={}[]>,./?</div>`,
      `<view class="_div">static text with ~\`!@#$%^&*()_+={}[]>,./?</view>`,
    )

    assertCodegen(
      `<div>{{ title }}<div>{{ info.name }}</div></div>`,
      `<view class="_div">{{ _h[ 2 ].t }}<view class="_div">{{ _h[ 4 ].t }}</view></view>`,
    )

    assertCodegen(
      `<div>head {{ title }} tail</div>`,
      `<view class="_div">{{ _h[ 2 ].t }}</view>`,
    )
  })

  // class
  it('generate class', () => {
    assertCodegen(
      `<div class=""></div>`,
      `<view class="_div"></view>`
    )
    assertCodegen(
      `<div class="app"></div>`,
      `<view class="_div app"></view>`
    )
    assertCodegen(
      `<div :class="{ show: true }"></div>`,
      `<view class="_div {{ _h[ 1 ].cl }}"></view>`
    )
    assertCodegen(
      `<div :class="[ showClass ]"></div>`,
      `<view class="_div {{ _h[ 1 ].cl }}"></view>`
    )
    assertCodegen(
      `<div class="app" :class="[ showClass ]"></div>`,
      `<view class="_div app {{ _h[ 1 ].cl }}"></view>`
    )
    assertCodegen(
      `<div class="app"></div>`,
      `<view class="_div app v-2333"></view>`,
      { scopeId: 'v-2333' }
    )
    assertCodegen(
      `<div :class="[ showClass ]"></div>`,
      `<view class="_div {{ _h[ 1 ].cl }} v-2333"></view>`,
      { scopeId: 'v-2333' }
    )
    assertCodegen(
      `<div class="app" :class="[ showClass ]"></div>`,
      `<view class="_div app {{ _h[ 1 ].cl }} v-2333"></view>`,
      { scopeId: 'v-2333' }
    )
  })

  it('generate style', () => {
    assertCodegen(
      `<div style="height: 10px"></div>`,
      `<view class="_div" style="height:10px"></view>`
    )
    assertCodegen(
      `<div :style="{ backgroundColor: 'red' }"></div>`,
      `<view class="_div" style="{{ _h[ 1 ].st }}"></view>`
    )
    assertCodegen(
      `<div style="height: 10px" :style="{ backgroundColor: 'red' }"></div>`,
      `<view class="_div" style="height:10px; {{ _h[ 1 ].st }}"></view>`
    )
  })

  it('generate attributes', () => {
    assertCodegen(
      `<div disable></div>`,
      `<view class="_div" disable=""></view>`
    )
    assertCodegen(
      `<div data-store="123"></div>`,
      `<view class="_div" data-store="123"></view>`
    )
    assertCodegen(
      `<div :data-store="store"></div>`,
      `<view class="_div" data-store="{{ _h[ 1 ][ 'data-store' ] }}"></view>`
    )
    assertCodegen(
      `<div :data-store="true"></div>`,
      `<view class="_div" data-store="{{ _h[ 1 ][ 'data-store' ] }}"></view>`
    )
  })

  it('generate events', () => {
    assertCodegen(
      `<div @click="onClick"></div>`,
      `<view class="_div" data-cid="{{ c }}" data-hid="{{ 1 }}" bindtap="_pe"></view>`
    )
    assertCodegen(
      `<scoll-view @scrolltoupper="onScollToUpper"></scoll-view>`,
      `<scoll-view class="_scoll-view" data-cid="{{ c }}" data-hid="{{ 1 }}" bindscrolltoupper="_pe"></scoll-view>`
    )
    assertCodegen(
      `<scoll-view @scroll="onScroll" @scrolltoupper="onScollToUpper"></scoll-view>`,
      `<scoll-view class="_scoll-view" data-cid="{{ c }}" data-hid="{{ 1 }}" bindscroll="_pe" bindscrolltoupper="_pe"></scoll-view>`
    )
    assertCodegen(
      `<div @click.stop="onClick"></div>`,
      `<view class="_div" data-cid="{{ c }}" data-hid="{{ 1 }}" catchbindtap="_pe"></view>`
    )
    assertCodegen(
      `<input @change="onInput">`,
      `<input class="_input" data-cid="{{ c }}" data-hid="{{ 1 }}" bindblur="_pe"></input>`
    )
    assertCodegen(
      `<textarea @change="onInput"></textarea>`,
      `<textarea class="_textarea" data-cid="{{ c }}" data-hid="{{ 1 }}" bindblur="_pe"></textarea>`
    )
  //   assertCodegen(
  //     `<div @click.capture="onClick"></div>`,
  //     `<view class="_div" data-cid="{{ c }}" data-hid="{{ 1 }}" capturebindtap="_pe"></view>`
  //   )
  })

  it('generate v-if', () => {
    assertCodegen(
      `<div v-if="code === 200"></div>`,
      `<view wx:if="{{ _h[ 1 ]._if }}" class="_div"></view>`
    )
    assertCodegen(
      (
        `<div v-if="code === 200"></div>` +
        `<div v-else></div>`
      ),
      (
        `<view wx:if="{{ _h[ 1 ]._if }}" class="_div"></view>` +
        `<view wx:else class="_div"></view>`
      )
    )
    assertCodegen(
      (
        `<div v-if="code < 200">{{ code }}</div>` +
        `<div v-else-if="code < 400">{{ code }}</div>`
      ),
      (
        `<view wx:if="{{ _h[ 1 ]._if }}" class="_div">{{ _h[ 2 ].t }}</view>` +
        `<view wx:elif="{{ _h[ 3 ]._if }}" class="_div">{{ _h[ 4 ].t }}</view>`
      )
    )
    assertCodegen(
      (
        `<div v-if="code < 200">{{ code }}</div>` +
        `<div v-else-if="code < 400">{{ code }}</div>` +
        `<div v-else>{{ code }}</div>`
      ),
      (
        `<view wx:if="{{ _h[ 1 ]._if }}" class="_div">{{ _h[ 2 ].t }}</view>` +
        `<view wx:elif="{{ _h[ 3 ]._if }}" class="_div">{{ _h[ 4 ].t }}</view>` +
        `<view wx:else class="_div">{{ _h[ 6 ].t }}</view>`
      )
    )
  })

  // v-for
  it('generate v-for', () => {
    assertCodegen(
      (
        `<div v-for="item in list">` +
          `<div>{{ item.name }}</div>` +
        `</div>`
      ),
      (
        `<view wx:for="{{ _h[ 1 ].li }}" wx:for-item="item" wx:for-index="item_index$0" class="_div">` +
          `<view class="_div">{{ _h[ 3 + '-' + item_index$0 ].t }}</view>` +
        `</view>`
      )
    )
    assertCodegen(
      (
        `<div v-for="(item, index) in list">` +
          `<div>{{ item.name }}</div>` +
        `</div>`
      ),
      (
        `<view wx:for="{{ _h[ 1 ].li }}" wx:for-item="item" wx:for-index="index" class="_div">` +
          `<view class="_div">{{ _h[ 3 + '-' + index ].t }}</view>` +
        `</view>`
      )
    )
    assertCodegen(
      (
        `<div v-for="(item, index) in list" :key="item.id">` +
          `<div>{{ item.name }}</div>` +
        `</div>`
      ),
      (
        `<view wx:for="{{ _h[ 1 ].li }}" wx:key="id" wx:for-item="item" wx:for-index="index" class="_div">` +
          `<view class="_div">{{ _h[ 3 + '-' + index ].t }}</view>` +
        `</view>`
      )
    )
    assertCodegen(
      (
        `<div v-for="(item, index) in list" :key="item.id">` +
          `<div v-for="(e, i) in item.list" :key="e.id">` +
            `{{ e.price }}` +
          `</div>` +
        `</div>`
      ),
      (
        `<view wx:for="{{ _h[ 1 ].li }}" wx:key="id" wx:for-item="item" wx:for-index="index" class="_div">` +
          `<view wx:for="{{ _h[ 2 + '-' + index ].li }}" wx:key="id" wx:for-item="e" wx:for-index="i" class="_div">` +
            `{{ _h[ 3 + '-' + index + '-' + i ].t }}` +
          `</view>` +
        `</view>`
      )
    )
    assertCodegen(
      (
        `<div v-for="item in list" :key="item.id">` +
          `<div v-for="e in item.list" :key="e.id">` +
            `{{ e.price }}` +
          `</div>` +
        `</div>`
      ),
      (
        `<view wx:for="{{ _h[ 1 ].li }}" wx:key="id" wx:for-item="item" wx:for-index="item_index$0" class="_div">` +
          `<view wx:for="{{ _h[ 2 + '-' + item_index$0 ].li }}" wx:key="id" wx:for-item="e" wx:for-index="e_index$0" class="_div">` +
            `{{ _h[ 3 + '-' + item_index$0 + '-' + e_index$0 ].t }}` +
          `</view>` +
        `</view>`
      )
    )
    assertCodegen(
      (
        `<template v-for="item in list">` +
          `<div :key="item.id">{{ item.name }}</div>` +
        `</template>`
      ),
      (
        `<block wx:for="{{ _h[ 1 ].li }}" wx:for-item="item" wx:for-index="item_index$0">` +
          `<view wx:key="id" class="_div">{{ _h[ 3 + '-' + item_index$0 ].t }}</view>` +
        `</block>`
      )
    )
  })

  // component
  it('generate component', () => {
    assertCodegen(
      (
        `<CompA :message="count"></CompA>` +
        `<CompB :message="count"></CompB>`
      ),
      (
        `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 ], $root }}" />` +
        `<template is="${CompB.name}" data="{{ ...$root[ cp + 1 ], $root }}" />`
      ),
      options
    )
    assertCodegen(
      (
        `<CompA v-if="show" :message="count"></CompA>` +
        `<CompB v-else :message="count"></CompB>`
      ),
      (
        `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 ], $root }}" wx:if="{{ _h[ 1 ]._if }}" />` +
        `<template is="${CompB.name}" data="{{ ...$root[ cp + 1 ], $root }}" wx:else />`
      ),
      options
    )
    assertCodegen(
      (
        `<CompA v-for="item in list" :message="count"></CompA>`
      ),
      (
        `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 + '-' + item_index$0 ], $root }}"` +
          ` wx:for="{{ _h[ 1 ].li }}" wx:for-item="item" wx:for-index="item_index$0"` +
        ` />`
      ),
      options
    )
  })

  // slot
  it('claim slot default slot', () => {
    const slot1 = slotName('default')
    assertCodegen(
      (
        `<div>` +
          `<slot>default slot</slot>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<template name="${slot1}">default slot</template>` +
          `<template is="{{ s_default || '${slot1}' }}" data="{{ ...$root[ s ], $root }}"/>` +
        `</view>`
      ),
      options
    )
  })

  it('claim slot named slot', () => {
    const slot1 = slotName('head')
    const slot2 = slotName('default')
    const slot3 = slotName('foot')
    assertCodegen(
      (
        `<div>` +
          `<slot name="head">head default slot</slot>` +
          `<slot>default slot</slot>` +
          `<slot name="foot">foot default slot</slot>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<template name="${slot1}">head default slot</template>` +
          `<template is="{{ s_head || '${slot1}' }}" data="{{ ...$root[ s ], $root }}"/>` +
          `<template name="${slot2}">default slot</template>` +
          `<template is="{{ s_default || '${slot2}' }}" data="{{ ...$root[ s ], $root }}"/>` +
          `<template name="${slot3}">foot default slot</template>` +
          `<template is="{{ s_foot || '${slot3}' }}" data="{{ ...$root[ s ], $root }}"/>` +
        `</view>`
      ),
      options
    )
  })

  it('define(using) slot', () => {
    const slot1 = slotName('default').replace('$', '_')
    assertCodegen(
      (
        `<div>` +
          `<CompA>` +
            `<template>` +
              `<div>{{ title }}</div>` +
            `</template>` +
          `</CompA>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 ], $root, s_default: '${slot1}' }}" />` +
        `</view>`
      ),
      options,
      function aasertRes (res) {
        res.slots.forEach((slot, index) => {
          expect(slot.name).toEqual('default')
          expect(slot.body).toEqual(
            `<template name="${slot.slotName}" parent="${options.name}">` +
              `<view class="_div">{{ _h[ 6 ].t }}</view>` +
            `</template>`
          )
        })
      }
    )
  })

  it('define(using) named slot', () => {
    const slot1 = slotName('default').replace('$', '_')
    const slot2 = slotName('head').replace('$', '_')
    assertCodegen(
      (
        `<div>` +
          `<CompA>` +
            `default 1` +
            `<template slot="head">` +
              `<div>{{ title }}</div>` +
            `</template>` +
            `default 2` +
          `</CompA>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 ], $root, s_default: '${slot1}', s_head: '${slot2}' }}" />` +
        `</view>`
      ),
      options,
      function aasertRes (res) {
        expect(res.slots.length).toEqual(2)
        res.slots.forEach((slot, index) => {
          if (slot.name === 'head') {
            expect(slot.body).toEqual(
              `<template name="${slot.slotName}" parent="${options.name}">` +
                `<view class="_div">{{ _h[ 7 ].t }}</view>` +
              `</template>`
            )
          } else if (slot.name === 'default') {
            expect(slot.body).toEqual(
              `<template name="${slot.slotName}" parent="${options.name}">` +
                `default 1` +
                `default 2` +
              `</template>`
            )
          }
        })
      }
    )
  })

  it('define(using) embedded slot', () => {
    // const slotName1 =
    slotName('default').replace('$', '_')
    const slotName2 = slotName('default').replace('$', '_')
    assertCodegen(
      (
        `<div>` +
          `<CompA>` +
            `<div>` +
              `<CompB>` +
                `<div>{{ title }}</div>` +
              `</CompB>` +
            `</div>` +
          `</CompA>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 ], $root, s_default: '${slotName2}' }}" />` +
        `</view>`
      ),
      options,
      function aasertRes (res) {
        expect(res.slots.length).toEqual(2)

        const slot1 = res.slots[0]
        const slot2 = res.slots[1]

        expect(slot1.dependencies.length).toEqual(0)
        expect(slot1.body).toEqual(
          `<template name="${slot1.slotName}" parent="${options.name}">` +
            `<view class="_div">{{ _h[ 8 ].t }}</view>` +
          `</template>`
        )

        expect(slot2.dependencies.length).toEqual(1)
        expect(slot2.dependencies[0]).toEqual(CompB.src)
        expect(slot2.body).toEqual(
          `<template name="${slot2.slotName}" parent="${options.name}">` +
            `<view class="_div">` +
              `<template is="${CompB.name}" data="{{ ...$root[ cp + 1 ], $root, s_default: '${slot1.slotName}' }}" />` +
            `</view>` +
          `</template>`
        )
      }
    )
  })

  it('define(using) slot-scope', () => {
    const slot1 = slotName('default').replace('$', '_')
    assertCodegen(
      (
        `<div>` +
          `<CompA>` +
            `<template slot-scope="slotScope">` +
              `<div>{{ title }}</div>` +
            `</template>` +
          `</CompA>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 ], $root, s_default: '${slot1}' }}" />` +
        `</view>`
      ),
      options,
      function aasertRes (res) {
        expect(res.slots.length).toEqual(1)
        res.slots.forEach((slot, index) => {
          if (slot.name === 'default') {
            expect(slot.body).toEqual(
              `<template name="${slot.slotName}" parent="${options.name}">` +
                `<view class="_div">{{ _h[ 5 ].t }}</view>` +
              `</template>`
            )
          }
        })
      }
    )
  })

  it('define(using) slot-scope with scattered template', () => {
    const slot1 = slotName('default').replace('$', '_')
    assertCodegen(
      (
        `<div>` +
          `<CompA>` +
            'default 1' +
            `<template slot-scope="slotScope">` +
              `<div>{{ title }}</div>` +
            `</template>` +
            'default 2' +
          `</CompA>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<template is="${CompA.name}" data="{{ ...$root[ cp + 0 ], $root, s_default: '${slot1}' }}" />` +
        `</view>`
      ),
      options,
      function aasertRes (res) {
        expect(res.slots.length).toEqual(1)
        res.slots.forEach((slot, index) => {
          if (slot.name === 'default') {
            expect(slot.body).toEqual(
              `<template name="${slot.slotName}" parent="${options.name}">` +
                `<view class="_div">{{ _h[ 7 ].t }}</view>` +
              `</template>`
            )
          }
        })
      }
    )
  })

  // v-show
  it('genrate v-show', () => {
    assertCodegen(
      (
        `<div v-show="count > 50">` +
          `{{ item.name }}` +
        `</div>`
      ),
      (
        `<view hidden="{{ _h[ 1 ].vs }}" class="_div">` +
          `{{ _h[ 2 ].t }}` +
        `</view>`
      )
    )
  })

  it('generate v-model', () => {
    assertCodegen(
      (
        `<input v-model="input">`
      ),
      (
        `<input class="_input" value="{{ _h[ 1 ].value }}" data-cid="{{ c }}" data-hid="{{ 1 }}" bindinput="_pe"></input>`
      )
    )
    assertCodegen(
      (
        `<input value="otherInput" v-model="input">`
      ),
      (
        `<input class="_input" value="{{ _h[ 1 ].value }}" data-cid="{{ c }}" data-hid="{{ 1 }}" bindinput="_pe"></input>`
      )
    )
  })

  it('generate v-html', () => {
    assertCodegen(
      (
        `<div v-html="input"></div>`
      ),
      (
        `<view class="_vhtml">{{ _h[ 1 ].html }}</view>`
      )
    )
  })
})

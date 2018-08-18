const { compileToTemplate } = require('mp/compiler')
const tagMap = require('../helpers/tag-map')

const CompA = {
  name: 'CompA$1234',
  src: './CompA$1234'
}

const CompB = {
  name: 'CompB$1234',
  src: './CompB$1234'
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

describe('base tag', () => {
  const baseTagList = Object.keys(tagMap)
    .map(k => ({
      html: k,
      mp: tagMap[k]
    }))
    .filter(tag => tag.html !== 'template' && tag.html !== 'script' && tag.html !== 'br')

  baseTagList.forEach((tag) => {
    it(tag.html, () => {
      const htmlTag = tag.html
      const mpTag = tag.mp
      assertCodegen(
        `<${htmlTag}></${htmlTag}>`,
        `<${mpTag} class="_${htmlTag}"></${mpTag}>`
      )
    })
  })
})

describe('textnode', () => {
  it('static text', () => {
    assertCodegen(
      `<div>static text</div>`,
      `<view class="_div">static text</view>`,
    )
  })

  it('static text with &lt;', () => {
    assertCodegen(
      `<div>static text with &lt;</div>`,
      `<view class="_div">static text with {{"<"}}</view>`,
    )
  })

  it('static text with <', () => {
    assertCodegen(
      `<div>static text with <</div>`,
      `<view class="_div">static text with {{"<"}}</view>`,
    )
  })

  it('static text with other special charactors', () => {
    assertCodegen(
      `<div>static text with ~\`!@#$%^&*()_+={}[]>,./?</div>`,
      `<view class="_div">static text with ~\`!@#$%^&*()_+={}[]>,./?</view>`,
    )
  })

  it('binding text', () => {
    assertCodegen(
      `<div>{{ title }}<div>{{ info.name }}</div></div>`,
      `<view class="_div">{{ _h[ 2 ].t }}<view class="_div">{{ _h[ 4 ].t }}</view></view>`,
    )
  })

  it('binding text with static text', () => {
    assertCodegen(
      `<div>head {{ title }} tail</div>`,
      `<view class="_div">{{ _h[ 2 ].t }}</view>`,
    )
  })
})

describe('imports', () => {
  it('static test with other special charactors', () => {
    const options = {
      name: 'App$1234',
      imports: { CompA }
    }
    assertCodegen(
      `<div></div>`,
      `<view class="_div"></view>`,
      options
    )
  })
})

describe('class', () => {
  it('no class', () => {
    assertCodegen(
      `<div class=""></div>`,
      `<view class="_div"></view>`
    )
  })

  it('static class', () => {
    assertCodegen(
      `<div class="app"></div>`,
      `<view class="_div app"></view>`
    )
  })

  it('binding class with array', () => {
    assertCodegen(
      `<div :class="{ show: true }"></div>`,
      `<view class="_div {{ _h[ 1 ].cl }}"></view>`
    )
  })

  it('binding class with object', () => {
    assertCodegen(
      `<div :class="[ showClass ]"></div>`,
      `<view class="_div {{ _h[ 1 ].cl }}"></view>`
    )
  })

  it('combine class', () => {
    assertCodegen(
      `<div class="app" :class="[ showClass ]"></div>`,
      `<view class="_div app {{ _h[ 1 ].cl }}"></view>`
    )
  })

  it('static class with scoped', () => {
    assertCodegen(
      `<div class="app"></div>`,
      `<view class="_div app v-2333"></view>`,
      { scopeId: 'v-2333' }
    )
  })

  it('binding class with scoped', () => {
    assertCodegen(
      `<div :class="[ showClass ]"></div>`,
      `<view class="_div {{ _h[ 1 ].cl }} v-2333"></view>`,
      { scopeId: 'v-2333' }
    )
  })

  it('combine class with scoped', () => {
    assertCodegen(
      `<div class="app" :class="[ showClass ]"></div>`,
      `<view class="_div app {{ _h[ 1 ].cl }} v-2333"></view>`,
      { scopeId: 'v-2333' }
    )
  })
})

describe('style', () => {
  it('static style', () => {
    assertCodegen(
      `<div style="height: 10px"></div>`,
      `<view class="_div" style="height:10px"></view>`
    )
  })

  it('binding style', () => {
    assertCodegen(
      `<div :style="{ backgroundColor: 'red' }"></div>`,
      `<view class="_div" style="{{ _h[ 1 ].st }}"></view>`
    )
  })

  it('combine style', () => {
    assertCodegen(
      `<div style="height: 10px" :style="{ backgroundColor: 'red' }"></div>`,
      `<view class="_div" style="height:10px; {{ _h[ 1 ].st }}"></view>`
    )
  })
})

describe('attributes', () => {
  it('attribute without value', () => {
    assertCodegen(
      `<div disable></div>`,
      `<view class="_div" disable=""></view>`
    )
  })

  it('attribute with value', () => {
    assertCodegen(
      `<div data-store="123"></div>`,
      `<view class="_div" data-store="123"></view>`
    )
  })

  it('binding attribute', () => {
    assertCodegen(
      `<div :data-store="store"></div>`,
      `<view class="_div" data-store="{{ _h[ 1 ][ 'data-store' ] }}"></view>`
    )
  })

  it('binding attribute with static value', () => {
    assertCodegen(
      `<div :data-store="true"></div>`,
      `<view class="_div" data-store="{{ _h[ 1 ][ 'data-store' ] }}"></view>`
    )
  })
})

describe('v-if', () => {
  it('single v-if', () => {
    assertCodegen(
      `<div v-if="code === 200"></div>`,
      `<view wx:if="{{ _h[ 1 ]._if }}" class="_div"></view>`
    )
  })

  it('v-if & v-else', () => {
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
  })

  it('v-if & $ v-else-if', () => {
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
  })

  it('v-if & $ v-else-if & v-else', () => {
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
})

describe('v-for', () => {
  it('v-for', () => {
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
  })

  it('v-for with index', () => {
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
  })

  it('v-for with key', () => {
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
  })

  it('embbeded v-for with index', () => {
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
  })

  it('embbeded v-for without index', () => {
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
  })
})

describe('v-show', () => {
  it('base use', () => {
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
})

describe('v-model', () => {
  it('base use', () => {
    assertCodegen(
      (
        `<input v-model="input">`
      ),
      (
        `<input class="_input" value="{{ _h[ 1 ].value }}" data-cid="{{ c }}" data-hid="{{ 1 }}" bindinput="_pe"></input>`
      )
    )
  })
})

describe('component', () => {
  const options = {
    imports: {
      CompA,
      CompB
    }
  }

  it('base use', () => {
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
  })

  it('with v-if', () => {
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
  })

  it('with v-for', () => {
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
})

describe('slots', () => {
  it('claim slot', () => {
    const options = {
      name: 'App$1234',
      imports: { CompA, CompB }
    }
    assertCodegen(
      `<div></div>`,
      `<view class="_div"></view>`,
      options
    )
  })
})

// describe('mp component', () => {

// })

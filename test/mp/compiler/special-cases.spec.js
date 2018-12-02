import { compileToTemplate } from 'mp/compiler'
import { slotName } from '../helpers'

const CompA = {
  name: 'CompA$1234',
  src: './CompA$1234'
}

const CompB = {
  name: 'CompB$1234',
  src: './CompB$1234'
}

// const options = {
//   name: 'App$1234',
//   imports: {
//     CompA,
//     CompB
//   },
//   htmlParse: {
//     templateName: 'octoParse'
//   }
// }

function wrapHtml (code) {
  return `<div>${code}</div>`
}

function wrapMP (code, options = {}) {
  const { imports = {}, name = 'defaultName', scopeId } = options
  const scopedClass = scopeId ? ` ${scopeId}` : ''
  const importStr = Object.keys(imports)
    .map(k => `<import src="${imports[k].src}"/>`)
    .join('')
  return (
    importStr +
    `<template name="${name}">` +
      `<view class="_div {{ h[ 0 ].rcl }}${scopedClass}">${code}</view>` +
    `</template>`
  )
}

function assertCodegen (body, assertTemplate, options = {}, callback) {
  const template = wrapHtml(body, options)
  const output = compileToTemplate(template, options)

  expect(output.body).toEqual(wrapMP(assertTemplate, options))

  typeof callback === 'function' && callback(output)
}

describe('special cases', () => {
  it('slot, v-for [1]', () => {
    const slot1 = slotName('default').replace('$', '_')
    const slot2 = slotName('default').replace('$', '_')
    assertCodegen(
      (
        `<div>` +
          `<div v-for="item in 3">` +
            `<CompA>` +
              `<div v-for="ele in 3">` +
                `<comp-b>` +
                  `<div v-for="e in 3">` +
                    `{{ item + ele + e }}` +
                  `</div>` +
                `</comp-b>` +
              `</div>` +
            `</CompA>` +
          `</div>` +
        `</div>`
      ),
      (
        `<view class="_div">` +
          `<view wx:for="{{ h[ 2 ].li }}" wx:for-item="item" wx:for-index="item_i1" class="_div">` +
            `<template is="${CompA.name}" ` +
              `data="{{ ...$root[ cp + 0 + '-' + (item_i2 !== undefined ? item_i2 : item_i1) ],` +
                      ` $root, s_default: '${slot2}', _t: '-' + (item_i2 !== undefined ? item_i2 : item_i1) }}" />` +
          `</view>` +
        `</view>`
      ),
      // options
      {
        name: 'App$1234',
        imports: {
          CompA,
          CompB
        }
      },
      // assert output.slots
      function assertRes (res) {
        expect(res.slots.length).toBe(2)
        res.slots.forEach((slot, i) => {
          if (i === 1) {
            expect(slot.body).toBe(
              `<template name="${slot2}" parent="App$1234">` +
                `<view wx:for="{{ h[ 5 + _t ].li }}" wx:for-item="ele" wx:for-index="ele_i1" class="_div">` +
                  `<template is="CompB$1234" ` +
                    `data="{{ ...$root[ cp + 1 + _t + '-' + (ele_i2 !== undefined ? ele_i2 : ele_i1) ], $root, s_default: '${slot1}', _t: (_t || '') + '-' + (ele_i2 !== undefined ? ele_i2 : ele_i1) }}" ` +
                  `/>` +
                `</view>` +
              `</template>`
            )
          } else if (i === 0) {
            expect(slot.body).toBe(
              `<template name="${slot1}" parent="App$1234">` +
                `<view wx:for="{{ h[ 8 + _t ].li }}" wx:for-item="e" wx:for-index="e_i1" class="_div">` +
                  `{{ h[ 9 + _t + '-' + (e_i2 !== undefined ? e_i2 : e_i1) ].t }}` +
                `</view>` +
              `</template>`
            )
          }
        })
      }
    )
  })
})

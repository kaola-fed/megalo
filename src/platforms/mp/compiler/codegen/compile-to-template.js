/* @flow */

import TAG_MAP from '../tag-map'
import { cloneAST, removeQuotes, uid } from '../util'
import presets from './presets/index'
import { baseWarn } from 'compiler/helpers'
// import { eventTypeMap } from 'mp/util/index'

const vbindReg = /^(v-bind)?:/
const vonReg = /^v-on:|@/

export function compileToTemplate (ast, options = {}): string {
  const templateGenerator = new TemplateGenerator(options)
  return templateGenerator.generate(ast)
}

export class TemplateGenerator {
  constructor (options = {}) {
    const {
      target = 'wechat',
      name = 'defaultName',
      scopeId = '',
      imports = [],
      slots = [],
      warn = baseWarn
    } = options

    const preset = presets[target]

    Object.assign(this, {
      name,
      scopeId,
      imports,
      slots,
      preset,
      drt: preset.directives,
      warn
    })
  }

  generate (ast) {
    try {
      const clonedAST = cloneAST(ast)
      const importsCode = this.genImports()
      const code = this.genElement(clonedAST)
      const body = [
        importsCode,
        `<template name="${this.name}">${code}</template>`
      ].join('')

      return {
        body,
        slots: this.slots
      }
    } catch (err) {
      return {
        body: this.genError(err),
        slots: this.slots
      }
    }
  }

  genImports () {
    const { imports } = this
    return Object.keys(imports)
      .map(name => `<import src="${imports[name].src}"/>`)
      .join('')
  }

  genElement (el): string {
    if (el.ifConditions && !el.ifConditionsGenerated) {
      return this.genIfConditions(el)
    } else if (this.isVHtml(el)) {
      return this.genVHtml(el)
    } else if (this.isSlot(el)) {
      return this.genSlot(el)
    } else if (this.isComponent(el)) {
      return this.genComponent(el)
    } else if (el.type === 1) {
      return this.genTag(el)
    } else {
      return this.genText(el)
    }
  }

  genComponent (el): string {
    const { _cid, tag } = el
    const compInfo = this.imports[tag]
    const { name: compName } = compInfo
    const slots = this.resolveSlotDefinition(el)
    const slotsNames = slots.map(sl => `s_${sl.name}: '${sl.slotName}'`)
    const data = [
      `...$root[ cp + ${_cid} ]`,
      `$root`,
      ...slotsNames
    ].join(', ')

    this.slots = this.slots.concat(slots)

    return `<template${this.genIf(el)} is="${compName}" data="{{${data}}}"/>`
  }

  // TODO: deprecate the namedSlots inside a nameSlots
  resolveSlotDefinition (el): any {
    const self = this
    const root = el
    const slots = {}

    walk(root)

    return Object.keys(slots).map(name => {
      const slot = slots[name]
      const { ast } = slot
      const parts = slot.ast.map(e => this.genElement(e))
      const dependencies = slot.ast.reduce((res, e) => res.concat(this.collectDependencies(e)), [])
      const slotName = `${name}_${uid()}`
      const body = [
        `<template name="${slotName}" parent="${this.name}">`,
        ...parts,
        `</template>`
      ].join('')

      return {
        name,
        slotName,
        dependencies,
        body,
        ast
      }
    })

    function walk (el, parent) {
      if (self.isNamedSlotDefinition(el)) {
        const name = removeQuotes(el.slotTarget)
        addSlotAst(name, el)
        // extract the slot wrapper
        if (parent) {
          parent.children = parent.children.filter(e => e !== el)
        }
        return
      }
      if (el.children) {
        if (!parent ||
          (parent !== root && !self.isComponent(el))
        ) {
          el.children.forEach(e => {
            walk(e, el)
          })
        }
      }
      if (parent === root) {
        addSlotAst('default', el)
      }
    }

    function addSlotAst (name, ...ast) {
      if (!slots[name]) {
        slots[name] = {
          ast: [],
          dependencies: [],
          template: ''
        }
      }
      const slot = slots[name]
      slot.ast = slot.ast.concat(ast)
    }
  }

  genTag (el): string {
    const children = this.genChildren(el)
    if (this.isPlainTemplate(el)) {
      return children
    }

    const { tag } = el
    const mpTag = TAG_MAP[tag] || tag
    const attrs = this.isTemplate(el) ? [] : [
      this.genClass(el),
      this.genStyle(el),
      this.genAttrs(el),
      this.genEvents(el)
    ]

    const startTag = `<${[
      mpTag,
      this.genIf(el),
      this.genFor(el),
      ...attrs
    ].join('')}>`

    const endTag = `</${mpTag}>`

    return [startTag, children, endTag].join('')
  }

  genClass (el): string {
    const { tag, classBinding, _hid } = el
    let { staticClass = '' } = el
    let klass = [`_${tag}`]
    staticClass = removeQuotes(staticClass)
    if (staticClass) {
      klass.push(staticClass)
      // scoped id class
      klass.push(this.scopeId)
    }
    if (classBinding) {
      klass.push(`{{ _h[ ${_hid} ].cl }}`)
    }
    klass = klass.join(' ')
    return ` class="${klass}"`
  }

  genStyle (el): string {
    const { styleBinding, _hid } = el
    let { staticStyle = '' } = el
    let style = []
    staticStyle = staticStyle.replace(/"|{|}/g, '').split(',').join('; ')
    if (staticStyle) {
      style.push(staticStyle)
    }
    if (styleBinding) {
      style.push(`{{ _h[ ${_hid} ].st }}`)
    }
    style = style.filter(e => e).join('; ')
    return style ? ` style="${style}"` : ''
  }

  genAttrs (el): string {
    const { attrsList = [], _hid, attrsMap = {}} = el
    const hasVModel = !!attrsMap['v-model']

    let attrs = attrsList.map((attr) => {
      const { name, value } = attr
      if (vonReg.test(name) || (name === 'value' && hasVModel)) {
        return ''
      } else if (vbindReg.test(name)) {
        const realName = name.replace(vbindReg, '')
        return `${realName}="{{ _hid[ ${_hid} ][ '${realName}' ] }}"`
      } else if (name === 'v-model') {
        return `value="{{ _h[${_hid}].value }}"`
      } else {
        return `${name}="${value}"`
      }
    })
    attrs = attrs.filter(e => e).join(' ')
    return attrs ? ` ${attrs}` : ''
  }

  genEvents (el): string {
    const { events, tag, _hid } = el
    if (!events) {
      return ''
    }

    let eventAttrs = Object.keys(events).map(type => {
      const event = events[type]
      const { modifiers = {}} = event
      const { stop, capture } = modifiers
      let mpType = type
      let binder = 'bind'
      if (stop) {
        binder = 'catchbind'
      } else if (capture) {
        binder = 'capturebind'
      }
      if (type === 'change' && (tag === 'input' || tag === 'textarea')) {
        mpType = 'blur'
      } else {
        mpType = type === 'click' ? 'tap' : mpType
      }
      return `${binder}${mpType}="_pe"`
    })
    eventAttrs = eventAttrs.join(' ')
    return ` data-cid="{{ c }}" data-hid="{{ ${_hid} }}" ${eventAttrs}`
  }

  genIfConditions (el): string {
    el.ifConditionsGenerated = true
    if (!el.ifConditions) {
      return ''
    }
    return el.ifConditions
      .map(cond => {
        const { block } = cond
        return this.genElement(block)
      })
      .filter(e => e)
      .join('')
  }

  genIf (el): string {
    const { _hid } = el
    if (el.if) {
      return ` wx:if="{{ _h[ ${_hid} ]._if }}"`
    } else if (el.elseif) {
      return ` wx:elif="{{ _h[ ${_hid} ]._if }}"`
    } else if (el.else) {
      return ` wx:else`
    }
    return ''
  }

  genFor (el): string {
    if (!el.for) {
      return this.genForKey(el)
    }
    const { _hid = '', iterator1, alias } = el
    // remove the last index
    const forId = `${_hid}`.split(`+ '-' +`).slice(0, -1).join(`+ '-' +`).trim()
    const _for = [
      ` wx:for="{{ _h[ ${forId} ].li }}"`,
      this.genForKey(el),
      alias ? ` wx:for-item="${alias}"` : ''
    ]
    iterator1 && _for.push(` wx:for-index="${iterator1}"`)

    return _for.filter(e => e).join('')
  }

  genForKey (el): string {
    if (!el.key) {
      return ''
    }

    const keyName = el.key.replace(/^\w*\./, '').replace(/\./g, '_')
    return keyName ? ` wx:key="${keyName}"` : ''
  }

  genText (el): string {
    const { text = '' } = el
    if (el.expression) {
      return `{{ _h[ ${el._hid} ].t }}`
    }
    return text || ''
  }

  genSlot (el): string {
    let { slotName = 'default' } = el
    slotName = slotName.replace(/"/g, '')
    const defaultSlotName = `${slotName}$${uid()}`
    const defaultSlotBody = this.genChildren(el)
    const defaultSlot = defaultSlotBody ? `<template name="${defaultSlotName}">${defaultSlotBody}</template>` : ''
    return `${defaultSlot}<template is="{{ s_${slotName} || '${defaultSlotName}' }}" data="{ ...$root[ p ], $root }"/>`
  }

  genChildren (el): string {
    if (!el || !el.children || !el.children.length) {
      return ''
    }
    return el.children.map(child => this.genElement(child)).join('')
  }

  genError (err: Error) {
    return `<template name="${this.name}">compile error: ${err.toString()}\n${err.stack}</template>`
  }

  collectDependencies (el): Array {
    let deps = []
    const { tag, children } = el
    if (this.isComponent(el)) {
      deps.push(this.getComponentSrc(tag))
    }
    if (children) {
      children.forEach(c => {
        deps = deps.concat(this.collectDependencies(c))
      })
    }
    return deps
  }

  getComponentSrc (name): string {
    return (this.imports[name] || {}).src || ''
  }

  genVHtml (el): string {
    const { _hid } = el
    return `<view class="_vhtml" ${[
      this.genIf(el),
      this.genFor(el)
    ].join('')}>{{ _h[${_hid}].html }}</view>`
  }

  isVHtml (el = {}): boolean {
    const { attrsMap = {}} = el
    return attrsMap['v-html'] !== undefined
  }

  isPlainTemplate (el): boolean {
    return el &&
      this.isTemplate(el) &&
      !el.iterator1 &&
      !el.if && !el.elseif && !el.else
  }

  isTemplate (el): boolean {
    return el && el.tag === 'template'
  }

  isSlot (el): boolean {
    return el && el.tag === 'slot'
  }

  isNamedSlotDefinition (el): boolean {
    const { tag, slotTarget } = el
    return tag === 'template' && slotTarget
  }

  isComponent (el): boolean {
    return el._cid && !!this.imports[el.tag]
  }
}


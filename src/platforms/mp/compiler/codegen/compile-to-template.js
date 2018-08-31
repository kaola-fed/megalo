/* @flow */

import TAG_MAP from '../tag-map'
import { cloneAST, removeQuotes, uid, escapeText } from '../util'
import presets from './presets/index'
import { baseWarn } from 'compiler/helpers'
// import { eventTypeMap } from 'mp/util/index'

const vbindReg = /^(v-bind)?:/
const vonReg = /^v-on:|@/
const vmodelReg = /^v-model/

const notEmpty = e => e

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

    this.slotSnippet = 0
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
      /* istanbul ignore next */
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
    const slots = this.genSlotSnippets(el)
    const slotsNames = slots.map(sl => `s_${sl.name}: '${sl.slotName}'`)
    let tail = `, $t: ''`
    // passing parent for tail to slot inside v-for
    if (/'-'/.test(_cid)) {
      tail = `, $t: ${extractHidTail(_cid)}`
    }
    const data = [
      `...$root[ cp + ${_cid} ]`,
      `$root`,
      ...slotsNames
    ].join(', ')

    const attrs = [
      ` is="${compName}"`,
      ` data="{{ ${data}${tail} }}"`,
      this.genIf(el),
      this.genFor(el)
    ].filter(notEmpty).join('')

    return `<template${attrs} />`
  }

  // TODO: deprecate the namedSlots inside a nameSlots
  genSlotSnippets (el): any {
    const self = this
    const root = el
    const slots = {}
    const { scopedSlots } = el

    if (scopedSlots) {
      Object.keys(scopedSlots)
        .forEach(k => {
          const slot = scopedSlots[k] || /* istanbul ignore next */ {}
          let slotAst = []
          if (slot.tag === 'template') {
            slotAst = slot.children || /* istanbul ignore next */ []
          } else {
            slotAst = [slot]
          }
          const slotName = removeQuotes(k)
          addSlotAst(slotName, ...slotAst)
          slots[slotName].scoped = true
        })
    }

    walk(root)

    const slotsArr = Object.keys(slots)
      .map(name => {
        const slot = slots[name]
        const { ast } = slot
        if (ast.length <= 0) {
          return null
        }

        this.enterSlotSnippet()
        const parts = slot.ast.map(e => this.genElement(e))
        this.leaveSlotSnippet()

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
      .filter(notEmpty)

    this.slots = this.slots.concat(slotsArr)

    return slotsArr

    function walk (el, parent) {
      if (self.isNamedSlotDefinition(el)) {
        const name = removeQuotes(el.slotTarget)
        if (parent === root) {
          addSlotAst(name, el)
        }
        // extract the slot wrapper
        /* istanbul ignore else */
        if (parent && parent.children && parent.children.length) {
          parent.children = parent.children.filter(e => e !== el)
        }
        return
      }
      if (el.children) {
        if (!parent ||
          /* istanbul ignore next */
          !self.isComponent(el)
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

    function addSlotAst (name, ...asts) {
      if (!slots[name]) {
        slots[name] = {
          ast: [],
          dependencies: [],
          template: ''
        }
      }
      const slot = slots[name]
      if (slot.scoped) return
      asts = asts.filter((el) => {
        /* istanbul ignore if */
        if (!el) return false
        if (el.tag) return true
        // ignore white space text node
        const text = (el.text || /* istanbul ignore next */ '').trim()
        return text !== ''
      })
      slot.ast = slot.ast.concat(asts)
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
      this.genVShow(el),
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
    const { tag, classBinding } = el
    let { staticClass = '' } = el
    let klass = []
    staticClass = removeQuotes(staticClass)
    if (staticClass) {
      klass.push(staticClass)
    }
    if (classBinding) {
      klass.push(`{{ _h[ ${this.genHid(el)} ].cl }}`)
    }
    // scoped id class
    if (klass.length) {
      klass.push(this.scopeId)
    }
    klass.unshift(`_${tag}`)
    klass = klass.filter(notEmpty).join(' ')
    return ` class="${klass}"`
  }

  genStyle (el): string {
    const { styleBinding } = el
    let { staticStyle = '' } = el
    let style = []
    staticStyle = staticStyle.replace(/"|{|}/g, '').split(',').join('; ')
    if (staticStyle) {
      style.push(staticStyle)
    }
    if (styleBinding) {
      style.push(`{{ _h[ ${this.genHid(el)} ].st }}`)
    }
    style = style.filter(e => e).join('; ')
    return style ? ` style="${style}"` : ''
  }

  genVShow (el): string {
    const { attrsMap = {}} = el
    if (!attrsMap['v-show']) {
      return ''
    }
    return ` hidden="{{ _h[ ${this.genHid(el)} ].vs }}"`
  }

  genAttrs (el): string {
    const { attrsList = [] } = el
    const hasVModel = this.hasVModel(el)

    let attrs = attrsList.map((attr) => {
      const { name, value } = attr
      if (vonReg.test(name) || (name === 'value' && hasVModel) || name === 'v-show') {
        return ''
      } else if (vbindReg.test(name)) {
        const realName = name.replace(vbindReg, '')
        return `${realName}="{{ _h[ ${this.genHid(el)} ][ '${realName}' ] }}"`
      } else if (vmodelReg.test(name)) {
        return `value="{{ _h[ ${this.genHid(el)} ].value }}"`
      } else {
        return `${name}="${value}"`
      }
    })
    attrs = attrs.filter(e => e).join(' ')
    return attrs ? ` ${attrs}` : ''
  }

  genEvents (el): string {
    const { events, tag } = el
    if (!events) {
      return ''
    }

    const cid = 'c'

    let eventAttrs = Object.keys(events).map(type => {
      const event = events[type]
      const { modifiers = {}} = event
      const isCapture = /!/.test(type)
      const realType = type.replace(/^[~|!]/, '')
      const { stop } = modifiers
      let mpType = realType
      let binder = stop ? 'catch' : 'bind'
      binder = isCapture ? `capture-${binder}` : binder

      if (type === 'change' && (tag === 'input' || tag === 'textarea')) {
        mpType = 'blur'
      } else {
        mpType = mpType === 'click' ? 'tap' : mpType
      }
      return `${binder}${mpType}="_pe"`
    })
    eventAttrs = eventAttrs.join(' ')
    return ` data-cid="{{ ${cid} }}" data-hid="{{ ${this.genHid(el)} }}" ${eventAttrs}`
  }

  genIfConditions (el): string {
    el.ifConditionsGenerated = true
    /* istanbul ignore if */
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
    if (el.if) {
      return ` wx:if="{{ _h[ ${this.genHid(el)} ]._if }}"`
    } else if (el.elseif) {
      return ` wx:elif="{{ _h[ ${this.genHid(el)} ]._if }}"`
    } else if (el.else) {
      return ` wx:else`
    }
    return ''
  }

  genFor (el): string {
    if (!el.for) {
      return this.genForKey(el)
    }
    const { iterator1, alias, _forId } = el
    const _for = [
      ` wx:for="{{ _h[ ${_forId} ].li }}"`,
      this.genForKey(el),
      alias ? ` wx:for-item="${alias}"` : /* istanbul ignore next */ ''
    ]
    iterator1 && _for.push(` wx:for-index="${iterator1}"`)

    return _for.filter(e => e).join('')
  }

  genForKey (el): string {
    if (!el.key) {
      return ''
    }

    const keyName = el.key.replace(/^\w*\./, '').replace(/\./g, '_')
    return keyName ? ` wx:key="${keyName}"` : /* istanbul ignore next */ ''
  }

  genText (el): string {
    const { text = '' } = el
    if (el.expression) {
      return `{{ _h[ ${this.genHid(el)} ].t }}`
    }
    return escapeText(text) || /* istanbul ignore next */ ''
  }

  genSlot (el): string {
    const { _hid } = el
    let { slotName = 'default' } = el
    slotName = slotName.replace(/"/g, '')
    const defaultSlotName = `${slotName}$${uid()}`
    const defaultSlotBody = this.genChildren(el)
    const defaultSlot = defaultSlotBody ? `<template name="${defaultSlotName}">${defaultSlotBody}</template>` : /* istanbul ignore next */ ''
    let tail = `, $t: ($t || '')`
    // sloped-slot inside v-for
    if (el.hasBindings && /'-'/.test(_hid)) {
      tail = `, $t: ${extractHidTail(_hid)}`
    }

    return `${defaultSlot}<template is="{{ s_${slotName} || '${defaultSlotName}' }}" data="{{ ...$root[ s ], $root${tail} }}"${this.genFor(el)}/>`
  }

  genChildren (el): string {
    if (!el || !el.children || !el.children.length) {
      return ''
    }
    return el.children.map(child => this.genElement(child)).join('')
  }

  /* istanbul ignore next */
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
    return (this.imports[name] || /* istanbul ignore next */ {}).src /* istanbul ignore next */ ||
      ''
  }

  genVHtml (el): string {
    return `<view class="_vhtml"${[
      this.genIf(el),
      this.genFor(el)
    ].join('')}>{{ _h[ ${this.genHid(el)} ].html }}</view>`
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
    const { slotTarget } = el
    return slotTarget
  }

  isComponent (el): boolean {
    return el._cid && !!this.imports[el.tag]
  }

  hasVModel (el): boolean {
    const { attrsList = [] } = el
    return attrsList.some(attr => vmodelReg.test(attr.name))
  }

  genHid (el): string {
    let tail = ''
    if (this.isInSlotSnippet()) {
      tail = ` + $t`
    }
    return `${el._hid}${tail}`
  }
  enterSlotSnippet () {
    this.slotSnippet++
  }

  leaveSlotSnippet () {
    this.slotSnippet--
  }

  isInSlotSnippet () {
    return this.slotSnippet > 0
  }
}

function extractHidTail (hid = ''): string {
  const delimiter = `+ '-' +`
  let parts = hid.split(delimiter)
  parts = parts.slice(1).map(s => s.trim())
  return `'-' + ${parts.join(delimiter)}`
}

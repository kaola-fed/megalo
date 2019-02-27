/* @flow */

import TAG_MAP from '../tag-map'
import {
  cloneAST,
  removeQuotes,
  uid,
  escapeText,
  getComponentInfo
} from '../util'
import presets from '../../util/presets/index'
import { baseWarn } from 'compiler/helpers'
import { isDef } from 'shared/util'
import {
  notEmpty,
  ROOT_DATA_VAR,
  LIST_TAIL_SEPS,
  SLOT_HOLDER_VAR,
  HOLDER_VAR,
  FOR_TAIL_VAR,
  VM_ID_PREFIX,
  HOLDER_TYPE_VARS,
  PARENT_SCOPE_ID_VAR
} from 'mp/util/index'

const vbindReg = /^(v-bind)?:/
const vonReg = /^v-on:|@/
const vmodelReg = /^v-model/
const vtextReg = /^v-text/

let sep = `'${LIST_TAIL_SEPS.wechat}'`

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
      imports = {},
      transformAssetUrls = {},
      slots = [],
      warn = baseWarn,
      htmlParse = {}
    } = options

    const preset = presets[target]
    sep = LIST_TAIL_SEPS[target] ? `'${LIST_TAIL_SEPS[target]}'` : sep

    Object.assign(this, {
      name,
      target,
      scopeId,
      imports,
      transformAssetUrls,
      slots,
      preset,
      warn,
      needHtmlParse: false,
      htmlParse,
      options,
      errors: []
    })

    this.slotSnippetBuffer = []
    this.fallbackSlot = 0
    this.children = []
    this.componentsStack = []
  }

  generate (ast) {
    try {
      const clonedAST = cloneAST(ast)
      const code = this.genElement(clonedAST)
      const body = [
        // this.genImports(),
        `<template name="${this.name}">${code}</template>`
      ].join('')

      const { needHtmlParse } = this
      return {
        body,
        slots: this.slots,
        needHtmlParse,
        errors: this.errors,
        children: this.children
      }
    } catch (err) {
      console.error('[compile template error]', err)
      this.errors.push(err)
      /* istanbul ignore next */
      return {
        body: this.genError(err),
        slots: this.slots
      }
    }
  }

  // genImports () {
  //   const { imports } = this
  //   return Object.keys(imports)
  //     .map(name => `<import src="${imports[name].src}"/>`)
  //     .join('')
  // }

  genElement (el): string {
    if (el.ifConditions && !el.ifConditionsGenerated) {
      return this.genIfConditions(el)
    } else if (this.isVHtml(el)) {
      this.needHtmlParse = true
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

  // TODO: refactor component name problem
  genComponent (el): string {
    const { c_, tag, f_ } = el
    const compInfo = this.getComponent(tag)
    this.enterComponent(compInfo)

    const { name: compName } = compInfo
    const slots = this.genSlotSnippets(el)
    const slotsNames = slots.map(sl => `s_${sl.name}: '${sl.slotName}'`)
    let cid = c_
    let scope = ''
    let tail = `, ${FOR_TAIL_VAR}: _t || ''`

    // if the component is in slot snippet, the slot scopeid is contained in PARENT_SCOPE_ID_VAR
    if (this.scopeId && !this.isInSlotSnippet()) {
      scope = `,${PARENT_SCOPE_ID_VAR}:(${PARENT_SCOPE_ID_VAR}||'')+' ${this.scopeId}'`
    } else {
      scope = `,${PARENT_SCOPE_ID_VAR}:${PARENT_SCOPE_ID_VAR}||''`
    }

    // passing parent v-for tail to slot inside v-for
    // TODO: refactor
    if (isDef(f_)) {
      cid = `${c_} + (_t || '') + ${sep} + ${f_}`
      tail = `, ${FOR_TAIL_VAR}: (${FOR_TAIL_VAR} || '') + ${sep} + ${f_}`
    } else {
      cid = `${c_} + (_t || '')`
      tail = `, ${FOR_TAIL_VAR}: ${FOR_TAIL_VAR} || ''`
    }

    const data = [
      `...${ROOT_DATA_VAR}[ ${VM_ID_PREFIX} + ${cid} ]`,
      `${ROOT_DATA_VAR}`,
      ...slotsNames
    ].join(', ')

    const attrs = [
      ` is="${compName}"`,
      ` data="` + this.wrapTemplateData(`${data}${tail}${scope}`) + `"`,
      this.genIf(el),
      this.genFor(el)
    ].filter(notEmpty).join('')

    const currentComponent = this.getCurrentCompoent()
    currentComponent.slots = slots

    this.leaveComponent()

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

        this.enterSlotSnippet(slot)
        const parts = slot.ast.map(e => this.genElement(e))
        this.leaveSlotSnippet(slot)

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
    const children = this.isVText(el) ? this.genVText(el) : this.genChildren(el)
    if (this.isPlainTemplate(el)) {
      return children
    }

    const { tag, isSelfCloseTag } = el
    const mpTag = TAG_MAP[tag] || tag
    const attrs = this.isTemplate(el) ? [] : [
      this.genVShow(el),
      this.genClass(el),
      this.genStyle(el),
      this.genAttrs(el),
      this.genEvents(el),
      this.genNativeSlotName(el)
    ]

    const startTag = `<${[
      mpTag,
      this.genIf(el),
      this.genFor(el),
      ...attrs
    ].join('')}` + (isSelfCloseTag ? `/>` : `>`)

    const endTag = isSelfCloseTag ? `` : `</${mpTag}>`

    return [startTag, children, endTag].join('')
  }

  genClass (el): string {
    const { tag, classBinding, h_ } = el
    let { staticClass = '' } = el
    let klass = []
    staticClass = removeQuotes(staticClass)
    if (staticClass) {
      klass.push(staticClass)
    }
    if (classBinding) {
      klass.push(`{{ ${this.genHolder(el, 'class')} }}`)
    }
    if (h_ === '0') {
      klass.push(`{{ ${this.genHolder(el, 'rootClass')} }}`)
    }

    // parent scope id class string
    klass.push(`{{${PARENT_SCOPE_ID_VAR}}}`)

    // scope id class string
    if (this.scopeId && !this.isInSlotSnippet()) {
      klass.push(`${this.scopeId}`)
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
      style.push(`{{ ${this.genHolder(el, 'style')} }}`)
    }
    style = style.filter(notEmpty).join('; ')
    return style ? ` style="${style}"` : ''
  }

  genVShow (el): string {
    const { attrsMap = {}} = el
    if (!attrsMap['v-show']) {
      return ''
    }
    return ` hidden="{{ ${this.genHolder(el, 'vshow')} }}"`
  }

  genAttrs (el): string {
    const { attrsList = [] } = el
    const hasVModel = this.hasVModel(el)

    let attrs = attrsList.map((attr) => {
      const { name, value } = attr
      if (
        vtextReg.test(name) ||
        vonReg.test(name) ||
        (name === 'value' && hasVModel) ||
        name === 'v-show' ||
        name === 'v-html'
      ) {
        return ''
      } else if (vmodelReg.test(name)) {
        return `value="{{ ${this.genHolder(el, 'value')} }}"`
      // <img :data-a="a" :src="img">
      } else if (vbindReg.test(name)) {
        const realName = name.replace(vbindReg, '')
        return `${realName}="{{ ${this.genHolderVar()}[ ${this.genHid(el)} ][ '${realName}' ] }}"`
      // <img src="../assets/img.jpg">
      } else if (!/^https?|data:/.test(value) && this.isTransformAssetUrl(el, name)) {
        return `${name}="{{ ${this.genHolderVar()}[ ${this.genHid(el)} ][ '${name}' ] }}"`
      } else {
        return `${name}="${value}"`
      }
    })
    attrs = attrs.filter(notEmpty).join(' ')
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
      const binder = this.preset.genBind(event, type, tag)
      return `${binder}="_pe"`
    })
    eventAttrs = eventAttrs.join(' ')

    /**
     * when the element is in a slot, it will recieve "_c" as the actual component instance id
     * othewise, using the current scope which usually the parent component in the template
     */
    return ` data-cid="{{ _c || ${cid} }}" data-hid="{{ ${this.genHid(el)} }}" ${eventAttrs}`
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
      .filter(notEmpty)
      .join('')
  }

  genIf (el): string {
    const IF = this.directive('if')
    const ELSE_IF = this.directive('elseif')
    const ELSE = this.directive('else')

    if (el.if) {
      return ` ${IF}="{{ ${this.genHolder(el, 'if')} }}"`
    } else if (el.elseif) {
      return ` ${ELSE_IF}="{{ ${this.genHolder(el, 'if')} }}"`
    } else if (el.else) {
      return ` ${ELSE}`
    }
    return ''
  }

  genFor (el): string {
    if (!el.for) {
      return this.genForKey(el)
    }
    const { iterator1, alias, _forInfo = {}} = el
    const FOR = this.directive('for')
    const FOR_ITEM = this.directive('forItem')
    const FOR_INDEX = this.directive('forIndex')
    const { h_: forHid, f_: forFid } = _forInfo

    let forHolderId = ''

    if (this.isInSlotSnippet()) {
      forHolderId =
        isDef(forFid)
          ? `${forHid} + (${FOR_TAIL_VAR} || '') + ${sep} + ${forFid}`
          : `${forHid} + (${FOR_TAIL_VAR} || '')`
    } else {
      forHolderId = isDef(forFid) ? `${forHid} + ${sep} + ${forFid}` : forHid
    }

    const _for = [
      ` ${FOR}="{{ ${this.genHolder(forHolderId, 'for')} }}"`,
      this.genForKey(el),
      alias ? ` ${FOR_ITEM}="${alias}"` : /* istanbul ignore next */ ''
    ]
    iterator1 && _for.push(` ${FOR_INDEX}="${iterator1}"`)

    return _for.filter(notEmpty).join('')
  }

  genForKey (el): string {
    if (!el.key) {
      return ''
    }
    const FOR_KEY = this.directive('forKey')

    const keyName = el.key.replace(/^\w*\./, '').replace(/\./g, '_')
    return keyName ? ` ${FOR_KEY}="${keyName}"` : /* istanbul ignore next */ ''
  }

  genText (el): string {
    const { text = '' } = el
    if (el.expression) {
      return `{{ ${this.genHolder(el, 'text')} }}`
    }
    return escapeText(text) || /* istanbul ignore next */ ''
  }

  genSlot (el): string {
    const { f_ } = el
    let { slotName = 'default' } = el
    slotName = slotName.replace(/"/g, '')
    const fallbackSlotName = `${slotName}$${uid()}`
    this.enterFallbackSlot()
    const fallbackSlotBody = this.genChildren(el)
    this.leaveFallbackSlot()
    const fallbackSlot = `<template name="${fallbackSlotName}">${fallbackSlotBody || ''}</template>`
    let tail = `, ${FOR_TAIL_VAR}: ${FOR_TAIL_VAR} || ''`
    if (isDef(f_)) {
      tail = `, ${FOR_TAIL_VAR}: (${FOR_TAIL_VAR} || '') + ${sep} + ${f_}`
    }

    let scope = ''
    if (this.scopeId) {
      scope = `,${PARENT_SCOPE_ID_VAR}:(${PARENT_SCOPE_ID_VAR}||'')+' ${this.scopeId}'`
    } else {
      scope = `,${PARENT_SCOPE_ID_VAR}:${PARENT_SCOPE_ID_VAR}||''`
    }

    const directives = [
      `${this.genIf(el)}`,
      `${this.genFor(el)}`
    ].filter(notEmpty).join(' ')

    /**
     * use "_c" to passing the actual vdom host component instance id to slot template
     *      because the vdom is actually stored in the component's _vnodes
     *      event hanlders searching depends on this id
     */

    if (this.target === 'swan') {
      return [
        // if
        `${fallbackSlot}`,
        `<block s-if="s_${slotName}">`,
          `<template `,
            `is="{{ s_${slotName} }}" `,
            `data="`,
            this.wrapTemplateData(`...${ROOT_DATA_VAR}[ c ], ${ROOT_DATA_VAR}${tail}, _c: c`),
          `"${directives}/>`,
        `</block>`,

        // else use default slot snippet
        `<block s-else>`,
          `<template `,
            `is="{{ '${fallbackSlotName}' }}" `,
            `data="`,
              this.wrapTemplateData(`...${ROOT_DATA_VAR}[ c ], ${ROOT_DATA_VAR}${tail}, _c: c`),
          `"${this.genFor(el)}/>`,
        `</block>`
      ].join('')
    }

    return [
      `${fallbackSlot}`,
      `<template `,
        `is="{{ s_${slotName} || '${fallbackSlotName}' }}" `,
        `data="`,
          this.wrapTemplateData(`...${ROOT_DATA_VAR}[ c ], ${ROOT_DATA_VAR}${tail}${scope}, _c: c`),
        `"${directives}/>`
    ].join('')
  }

  genChildren (el): string {
    if (!el || !el.children || !el.children.length) {
      return ''
    }
    return el.children.map(child => this.genElement(child)).join('')
  }

  genHolderVar () {
    if (this.isInSlotSnippet() || this.isInFallbackSlot()) {
      return SLOT_HOLDER_VAR
    }
    return HOLDER_VAR
  }

  genHolder (el, type): string {
    const varName = HOLDER_TYPE_VARS[type]
    const hid = typeof el === 'string' ? el : this.genHid(el)
    /* istanbul ignore next */
    if (!varName) {
      throw new Error(`${type} holder HOLDER_TYPE_VARS not found`)
    }
    return `${this.genHolderVar()}[ ${hid} ].${varName}`
  }

  /* istanbul ignore next */
  genError (err: Error) {
    return `<template name="${this.name}">compile error: ${err.toString()}\n${err.stack}</template>`
  }

  collectDependencies (el): Array {
    let deps = []
    const { tag, children } = el
    if (this.isComponent(el)) {
      deps.push(this.getComponentName(tag))
    }
    if (children) {
      children.forEach(c => {
        deps = deps.concat(this.collectDependencies(c))
      })
    }
    return deps
  }

  genVHtml (el): string {
    const { htmlParse } = this
    const children = `<template is="${htmlParse.templateName}" data="${this.wrapTemplateData(`nodes: ${this.genHolder(el, 'vhtml')}`)}"/>`

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
      this.genEvents(el),
      this.genNativeSlotName(el)
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

  genNativeSlotName (el): string {
    const { slotTarget } = el
    if (!slotTarget || this.isComponent(el.parent)) {
      return ''
    }
    const isDynamicSlot = !/"/.test(slotTarget)
    const slotName = isDynamicSlot ? `"{{ ${this.genHolder(el, 'slot')} }}"` : slotTarget

    return ` slot=${slotName}`
  }

  genVText (el = {}): string {
    return `{{ ${this.genHolder(el, 'vtext')} }}`
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

  isComponent (el = {}): boolean {
    const { tag, c_ } = el
    if (c_) {
      return !!this.getComponent(tag)
    }
    return false
  }

  getComponentName (name): string {
    const info = this.getComponent(name)
    if (info) {
      return info.name
    } else {
      return ''
    }
  }

  getComponent (name) {
    return getComponentInfo(name, this.imports)
  }

  isVText (el = {}): boolean {
    const { attrsMap = {}} = el
    return attrsMap.hasOwnProperty('v-text')
  }

  hasVModel (el): boolean {
    const { attrsList = [] } = el
    return attrsList.some(attr => vmodelReg.test(attr.name))
  }
  directive (grammar) {
    return this.preset.directives[grammar] || ''
  }

  genHid (el): string {
    const { h_, f_ } = el
    let tail = ''
    const hid = h_
    if (this.isInSlotSnippet()) {
      tail = ` + ${FOR_TAIL_VAR}`
    }
    if (f_) {
      return `${h_}${tail} + ${sep} + ${f_}`
    } else {
      return `${hid}${tail}`
    }
  }
  enterSlotSnippet (slot) {
    this.slotSnippetBuffer.push(slot)
  }

  enterFallbackSlot () {
    this.fallbackSlot++
  }

  leaveSlotSnippet () {
    this.slotSnippetBuffer.pop()
  }

  leaveFallbackSlot () {
    this.fallbackSlot--
  }

  isInSlotSnippet () {
    return this.slotSnippetBuffer.length > 0
  }

  isInFallbackSlot () {
    return this.fallbackSlot > 0
  }

  // isInScopedSlotSnippet () {
  //   return this.slotSnippetBuffer.length > 0 && this.getCurrentSlotSnippet().scoped
  // }

  // getCurrentSlotSnippet () {
  //   return this.slotSnippetBuffer[this.slotSnippetBuffer.length - 1]
  // }

  wrapTemplateData (str) {
    return this.target === 'swan' ? `{{{ ${str} }}}` : `{{ ${str} }}`
  }

  isTransformAssetUrl (node, name) {
    return this.transformAssetUrls[node.tag] === name
  }

  enterComponent (compInfo) {
    const newComp = {
      name: compInfo.name,
      slots: [],
      children: []
    }
    this.getCurrentCompoent().children.push(newComp)
    this.componentsStack.push(newComp)
  }

  leaveComponent () {
    this.componentsStack.pop()
  }

  getCurrentCompoent () {
    return this.componentsStack[this.componentsStack.length - 1] || this
  }
}
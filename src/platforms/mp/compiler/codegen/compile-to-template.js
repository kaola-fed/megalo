/* @flow */

import TAG_MAP from '../tag-map'
import { cloneAST, removeQuotes, uid, escapeText } from '../util'
import presets from '../../util/presets/index'
import { baseWarn } from 'compiler/helpers'
import { capitalize, camelize, isDef } from 'shared/util'
import { postMpify } from '../mpify/post'
import {
  notEmpty,
  ROOT_DATA_VAR,
  LIST_TAIL_SEPS,
  HOLDER_VAR,
  FOR_TAIL_VAR,
  VM_ID_PREFIX,
  HOLDER_TYPE_VARS
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
      imports = [],
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
      slots,
      preset,
      warn,
      needHtmlParse: false,
      htmlParse,
      options,
      errors: []
    })

    this.slotSnippetBuffer = []
  }

  generate (ast) {
    try {
      const clonedAST = cloneAST(ast)
      postMpify(clonedAST, this.options, {
        isComponent: this.isComponent.bind(this)
      })
      const code = this.genElement(clonedAST)
      const body = [
        this.genImports(),
        `<template name="${this.name}">${code}</template>`
      ].join('')

      const { needHtmlParse } = this
      return {
        body,
        slots: this.slots,
        needHtmlParse,
        errors: this.errors
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
    const { _cid, tag, _fid } = el
    const pascalTag = pascalize(tag)
    const camelizedTag = camelize(tag)
    const compInfo = this.imports[tag] || this.imports[pascalTag] || this.imports[camelizedTag]
    const { name: compName } = compInfo
    const slots = this.genSlotSnippets(el)
    const slotsNames = slots.map(sl => `s_${sl.name}: '${sl.slotName}'`)
    let cid = _cid
    let tail = `, ${FOR_TAIL_VAR}: _t || ''`

    // passing parent v-for tail to slot inside v-for
    // TODO: refactor
    if (this.isInSlotSnippet()) {
      if (isDef(_fid)) {
        cid = `${_cid} + _t + ${sep} + ${_fid}`
        tail = `, ${FOR_TAIL_VAR}: (${FOR_TAIL_VAR} || '') + ${sep} + ${_fid}`
      } else {
        cid = `${_cid} + _t`
        tail = `, ${FOR_TAIL_VAR}: ${FOR_TAIL_VAR} || ''`
      }
    } else if (isDef(_fid)) {
      cid = `${_cid} + ${sep} + ${_fid}`
      tail = `, ${FOR_TAIL_VAR}: ${sep} + ${_fid}`
    }

    const data = [
      `...${ROOT_DATA_VAR}[ ${VM_ID_PREFIX} + ${cid} ]`,
      `${ROOT_DATA_VAR}`,
      ...slotsNames
    ].join(', ')

    const attrs = [
      ` is="${compName}"`,
      ` data="` + this.wrapTemplateData(`${data}${tail}`) + `"`,
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
    const { tag, classBinding, _hid } = el
    let { staticClass = '' } = el
    let klass = []
    staticClass = removeQuotes(staticClass)
    if (staticClass) {
      klass.push(staticClass)
    }
    if (classBinding) {
      klass.push(`{{ ${this.genHolder(el, 'class')} }}`)
    }
    if (_hid === '0') {
      klass.push(`{{ ${this.genHolder(el, 'rootClass')} }}`)
    }
    // scoped id class
    klass.push(this.scopeId)
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
        name === 'v-show'
      ) {
        return ''
      } else if (vbindReg.test(name)) {
        const realName = name.replace(vbindReg, '')
        return `${realName}="{{ ${HOLDER_VAR}[ ${this.genHid(el)} ][ '${realName}' ] }}"`
      } else if (vmodelReg.test(name)) {
        return `value="{{ ${this.genHolder(el, 'value')} }}"`
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
    const { iterator1, alias, _forId, _hid } = el
    const FOR = this.directive('for')
    const FOR_ITEM = this.directive('forItem')
    const FOR_INDEX = this.directive('forIndex')
    let forHolderId = ''
    if (this.isInSlotSnippet()) {
      forHolderId = `${_hid} + _t`
    } else {
      forHolderId = _forId
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
    const { _fid } = el
    let { slotName = 'default' } = el
    slotName = slotName.replace(/"/g, '')
    const fallbackSlotName = `${slotName}$${uid()}`
    const fallbackSlotBody = this.genChildren(el)
    const fallbackSlot = `<template name="${fallbackSlotName}">${fallbackSlotBody || ''}</template>`
    let tail = `, ${FOR_TAIL_VAR}: ${FOR_TAIL_VAR} || ''`
    // sloped-slot inside v-for
    if (el.hasBindings && isDef(_fid)) {
      tail = `, ${FOR_TAIL_VAR}: '-' + ${_fid} + (${FOR_TAIL_VAR} || '')`
    }

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
        `<template is="{{ s_${slotName} }}" `,
        `data="`,
        this.wrapTemplateData(`...${ROOT_DATA_VAR}[ s ], ${ROOT_DATA_VAR}${tail}, _c: c`),
        `"${this.genFor(el)}/>`,
        `</block>`,

        // else use default slot snippet
        `<block s-else>`,
        `<template is="{{ '${fallbackSlotName}' }}" `,
        `data="`,
        this.wrapTemplateData(`...${ROOT_DATA_VAR}[ s ], ${ROOT_DATA_VAR}${tail}, _c: c`),
        `"${this.genFor(el)}/>`,
        `</block>`
      ].join('')
    }

    return [
      `${fallbackSlot}`,
      `<template is="{{ s_${slotName} || '${fallbackSlotName}' }}" `,
      `data="`,
      this.wrapTemplateData(`...${ROOT_DATA_VAR}[ s ], ${ROOT_DATA_VAR}${tail}, _c: c`),
      `"${this.genFor(el)}/>`
    ].join('')
  }

  genChildren (el): string {
    if (!el || !el.children || !el.children.length) {
      return ''
    }
    return el.children.map(child => this.genElement(child)).join('')
  }

  genHolder (el, type): string {
    const varName = HOLDER_TYPE_VARS[type]
    const hid = typeof el === 'string' ? el : this.genHid(el)
    /* istanbul ignore next */
    if (!varName) {
      throw new Error(`${type} holder HOLDER_TYPE_VARS not found`)
    }
    return `${HOLDER_VAR}[ ${hid} ].${varName}`
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
    const { imports = {}} = this
    const camelizedName = camelize(name)
    const pascalizedName = pascalize(name)

    const dep = imports[name] || imports[camelizedName] || imports[pascalizedName]
    if (dep) {
      return dep.src
    } else {
      return ''
    }
  }

  genVHtml (el): string {
    const { htmlParse } = this
    return `<template is="${htmlParse.templateName}"${[
      this.genIf(el),
      this.genFor(el)
    ].join('')} data="{{ nodes: ${this.genHolder(el, 'vhtml')} }}"/>`
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
    const { tag } = el
    if (el._cid) {
      const { imports = {}} = this
      const pascalName = pascalize(tag)
      const camelizedName = camelize(tag)
      return !!(imports[tag] || imports[pascalName] || imports[camelizedName])
    }
    return false
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
    const { _hid, _fid } = el
    let tail = ''
    const hid = _hid
    if (this.isInSlotSnippet()) {
      tail = ` + ${FOR_TAIL_VAR}`
    }
    if (_fid) {
      return `${_hid}${tail} + ${sep} + ${_fid}`
    } else {
      return `${hid}${tail}`
    }
  }
  enterSlotSnippet (slot) {
    this.slotSnippetBuffer.push(slot)
  }

  leaveSlotSnippet () {
    this.slotSnippetBuffer.pop()
  }

  isInSlotSnippet () {
    return this.slotSnippetBuffer.length > 0
  }

  // getCurrentSlotSnippet () {
  //   return this.slotSnippetBuffer[this.slotSnippetBuffer.length - 1]
  // }

  wrapTemplateData (str) {
    return this.target === 'swan' ? `{{{ ${str} }}}` : `{{ ${str} }}`
  }
}

// function extractHidTail (hid = ''): string {
//   const delimiter = `+ ${sep} +`
//   let parts = hid.split(delimiter)
//   parts = parts.slice(1).map(s => s.trim())
//   return `${sep} + ${parts.join(delimiter)}`
// }

function pascalize (str = ''): string {
  const camelized = camelize(str)
  const pascalized = capitalize(camelized)
  return pascalized
}

/* @flow */

import TAG_MAP from '../tag-map'
// import { eventTypeMap } from 'mp/util/index'

const vbindReg = /^(v-bind)?:/
const vonReg = /^v-on:|@/

export function generateWXML (ast) {
  const code = genElem(ast)
  return code
}

function genElem (el) {
  if (el.type === 2) {
    return genText(el)
  } else {
    return genTag(el)
  }
}

function genTag (el) {
  const { tag } = el
  const mpTag = TAG_MAP[tag]
  const klass = genClass(el)
  const style = genStyle(el)
  const attrs = genAttrs(el)
  const events = genEvents(el)

  const startTag = `<${[
    mpTag,
    klass,
    style,
    attrs,
    events
  ].join('')}>`

  const endTag = `</${mpTag}>`

  return [startTag, genChildren(el), endTag].join('')
}

function genClass (el): string {
  const { tag, classBinding, _hid } = el
  let { staticClass = '' } = el
  let klass = [`_${tag}`]
  staticClass = staticClass.replace(/"/g, '')
  if (staticClass) {
    klass.push(staticClass)
  }
  if (classBinding) {
    klass.push(`{{ _h[ ${_hid} ].cl }}`)
  }
  klass = klass.join(' ')
  return ` class="${klass}"`
}

function genStyle (el): string {
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
  style = style.join(' ')
  return style ? ` style="${style}"` : ''
}

function genAttrs (el) {
  const { attrsList, _hid } = el
  let attrs = attrsList.map((attr) => {
    const { name, value } = attr
    if (vonReg.test(name)) {
      return ''
    } else if (vbindReg.test(name)) {
      const realName = name.replace(vbindReg, '')
      return `${realName}="{{ _hid[ ${_hid} ][ '${realName}' ] }}"`
    } else {
      return `${name}="${value}"`
    }
  })
    .filter(e => e)
  attrs = attrs.join(' ')
  return ` ${attrs}`
}

function genEvents (el) {
  const { events, tag, _hid } = el
  if (!events) {
    return ''
  }
  let eventAttrs = Object.keys(events).map(type => {
    const event = events[type]
    const { modifiers } = event
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

    return `${binder}${mpType}="proxyEvent"`
  })
  eventAttrs = eventAttrs.join(' ')
  return ` data-cid="{{ cid }}" data-hid="{{ ${_hid} }}" ${eventAttrs}`
}

function genText (el) {
  return `{{ _h[ ${el._hid} ].t }}`
}

function genChildren (el) {
  if (!el || !el.children || !el.children.length) {
    return ''
  }

  const childrenCode = el.children.map(child => genElem(child))
  return childrenCode.join('\n')
}

/* @flow */

import { makeMap } from 'shared/util'

export const isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
)

// Elements that you can, intentionally, leave open
// (and which close themselves)
export const canBeLeftOpenTag = makeMap(
  'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
)

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
export const isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
)

export const removeQuotes = (t = '') => t.replace(/"/g, '')

export function cloneAST (ast) {
  const walked = []
  const newAst = doClone(ast)
  return newAst
  function doClone (old) {
    const walkedVal = walked.find(v => v.old === old)
    if (walkedVal) {
      return walkedVal._new
    }
    if (typeof old === 'object') {
      const _new = Array.isArray(old) ? [] : {}
      walked.push({ _new, old })
      for (const key in old) {
        const newVal = doClone(old[key])
        _new[key] = newVal
      }
      return _new
    } else {
      return old
    }
  }
}

export class Stack {
  constructor () {
    this.stack = []
  }
  push (data) {
    return this.stack.push(data)
  }
  pop () {
    return this.stack.pop()
  }
  get top () {
    return this.stack[this.stack.length - 1] || null
  }
}

export const createUidFn = (prefix = '') => {
  let id = 0
  return () => {
    return `${prefix}${id++}`
  }
}

export const uid = createUidFn()

export const escapeText = (str = '') => {
  return str.replace(/\</g, `{{"<"}}`)
}

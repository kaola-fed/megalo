import TAG_MAP from './tag-map'
import { Stack, createUidFn } from './util'
import { LIST_TAIL_SEPS } from 'mp/util/index'
import presets from '../util/presets/index'

const vbindReg = /^(v-bind:?|:)/
const iteratorUid = createUidFn('item')

const TYPE = {
  ELEMENT: 1,
  TEXT: 2,
  STATIC_TEXT: 3
}

let sep = `'${LIST_TAIL_SEPS.wechat}'`

export function mpify (node, options) {
  const { target = 'wechat' } = options
  sep = LIST_TAIL_SEPS[target] ? `'${LIST_TAIL_SEPS[target]}'` : sep
  const preset = presets[target]
  const state = new State({
    rootNode: node,
    target,
    preset
  })
  walk(node, state)
}

function visit (el, state) {
  const { visitors = {}} = state.preset

  if (visitors.all) {
    visitors.all(el)
  }

  if (visitors[el.tag]) {
    visitors[el.tag](el)
  }
}

function walk (node, state) {
  visit(node, state)

  if (node.for && !node.mpForWalked) {
    return walkFor(node, state)
  }

  if (node._hid === undefined) {
    state.assignHId(node)
    addAttr(node, '_hid', node._hid)
    state.assignLId(node)
    addAttr(node, '_fid', node._fid)
  }

  if (node.ifConditions && !node.mpIfWalked) {
    return walkIf(node, state)
  }

  /* istanbul ignore else */
  if (node.type === TYPE.ELEMENT) {
    walkElem(node, state)
  } else if (
    node.type === TYPE.TEXT || node.type === TYPE.STATIC_TEXT
  ) {
    walkText(node, state)
  }
}

function walkFor (node, state) {
  const { for: _for, key, alias } = node
  const prefix = /{/.test(alias) ? `${iteratorUid()}` : alias
  // create default iterator1, iterator2 for xml listing,
  // which is needed for _hid generating
  const { iterator1 = `${prefix}_i1`, iterator2 = `${prefix}_i2` } = node
  Object.assign(node, {
    mpForWalked: true,
    iterator1,
    iterator2
  })

  state.pushListState({
    iterator1,
    iterator2,
    _for,
    key,
    node,
    alias
  })

  /* istanbul ignore if */
  if (node._hid === undefined) {
    state.assignHId(node)
    addAttr(node, '_hid', node._hid)
    state.assignLId(node)
    addAttr(node, '_fid', node._fid)
  }

  const { _hid, _fid } = node
  let tail = ''
  // extract last index
  if (_fid) {
    tail = `${_fid}`.split(`+ ${sep} +`).slice(0, -1).join(`+ ${sep} +`).trim()
    tail = tail ? ` + ${sep} + ${tail}` : tail
  }
  node._forId = _hid + tail

  walk(node, state)

  state.popListState()
}

function walkElem (node, state) {
  processAttrs(node)
  if (node.key) {
    const key = node.key.replace(/^\w*\./, '')
    addAttr(node, '_fk', `"${key}"`)
  }

  if (!isTag(node)) {
    return walkComponent(node, state)
  }

  walkChildren(node, state)
}

function walkComponent (node, state) {
  // generate _cid first
  const _cid = state.getCId()

  // enter a component
  state.pushComp()

  Object.assign(node, { _cid })
  addAttr(node, '_cid', _cid)

  walkChildren(node, state)
  state.popComp()
}

function walkText (node, state) {
  const { expression, type, _hid, _fid } = node
  if (type === TYPE.STATIC_TEXT) {
    node.mpNotGenRenderFn = true
  } else {
    node.expression = `${expression},${_hid},${_fid}`
  }
}

function walkIf (node, state) {
  const conditions = node.ifConditions

  node.mpIfWalked = true

  conditions.forEach(condition => {
    const { block, exp } = condition

    walk(block, state)

    if (exp) {
      condition.rawexp = exp
      if (block._fid) {
        condition.exp = `_ri(!!(${exp}), ${block._hid}, ${block._fid})`
      } else {
        condition.exp = `_ri(!!(${exp}), ${block._hid})`
      }
    }
  })
}

function walkChildren (node, state) {
  const { children, scopedSlots } = node
  if (children && children.length) {
    children.forEach(n => {
      walk(n, state)
    })
  }

  if (scopedSlots) {
    Object.keys(scopedSlots).forEach(k => {
      const slot = scopedSlots[k]
      walk(slot, state)
    })
  }
}

function processAttrs (node) {
  const { attrsList = [], attrs = [], attrsMap = {}} = node
  const bindingAttrs = []

  attrsList.forEach((attr, i) => {
    if (!vbindReg.test(attr.name)) {
      // set default true, <div enable></div> -> <div enable="true"></div>
      if (attr.value === '') {
        attr.value = 'true'
        attrs[i].value = '"true"'
        attrsMap[attr.name] = 'true'
      }
    } else {
      // collect dynamic attrs, only update daynamic attrs in runtime
      const realName = attr.name.replace(vbindReg, '') || 'value'
      bindingAttrs.push(realName)
    }
  })

  if (bindingAttrs.length) {
    addAttr(node, '_batrs', `"${bindingAttrs.join(',')}"`)
  }
}

function addAttr (node, name, value) {
  // generate attr code when plain is false
  node.plain = false
  const { attrs = [], attrsMap = {}} = node
  const attr = attrs.filter(attr => attr.name === name)[0]
  let attrIndex = attrs.indexOf(attr)
  /* istanbul ignore next */
  attrIndex = attrIndex !== -1 ? attrIndex : attrs.length
  attrs[attrIndex] = {
    name,
    value: `${value}`
  }
  attrsMap[name] = `${value}`

  Object.assign(node, { attrs, attrsMap })
}

function isTag (node) {
  return !!TAG_MAP[node.tag] || node.tag === 'template'
}

class State {
  constructor (options = {}) {
    this.rootNode = options.rootNode
    this.compCount = -1
    this.elemCount = -1
    this.compStack = new Stack()
    this.sep = options.sep || '-'
    this.preset = options.preset
    this.listStates = new Stack()
    // this.listStates = new Stack()
    // init a root component state, like page
    this.pushComp()
  }
  pushComp () {
    this.compStack.push({
      id: ++this.compCount,
      elems: 0
      // listStates: new Stack()
    })
  }
  popComp () {
    this.compStack.pop()
  }
  pushElem () {
    this.elemCount++
  }
  popListState () {
    return this.listStates.pop()
  }
  pushListState (state) {
    const currentStates = this.listStates.top
    let newStates = []
    if (currentStates && currentStates.length) {
      newStates = [].concat(currentStates)
    }

    newStates.push(state)
    this.listStates.push(newStates)
  }
  getCurrentComp () {
    return this.compStack.top
  }
  getCurrentCompIndex () {
    return `${this.compCount}`
  }
  getCurrentElemIndex () {
    return this.elemCount
  }
  getCurrentListState () {
    return this.listStates.top
  }
  getCurrentListNode () {
    const top = this.listStates.top || []
    return (top[top.length - 1] || {}).node
  }
  getHId (node) {
    this.pushElem()
    // const currentListState = this.getCurrentListState()
    const _hid = `${this.getCurrentElemIndex()}`
    // if (currentListState) {
    //   const listTail = currentListState.map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
    // _hid = `${_hid} + ${sep} + ${listTail}`
    // }
    return `${_hid}`
  }
  getCId (node) {
    this.pushElem()
    // const currentListState = this.getCurrentListState()
    const _cid = `${this.getCurrentCompIndex()}`
    // if (currentListState) {
    //   const listTail = currentListState.map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
    //   _cid = `${_cid} + ${sep} + ${listTail}`
    // }
    return `${_cid}`
  }
  assignHId (node) {
    const _hid = this.getHId(node)
    Object.assign(node, { _hid })
  }
  assignLId (node) {
    const currentListState = this.getCurrentListState() || []
    const _fid = currentListState.map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
    if (_fid) {
      Object.assign(node, { _fid })
    }
  }
}

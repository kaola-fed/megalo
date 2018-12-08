import {
  Stack,
  createUidFn,
  getComponentInfo
} from '../util'
import { LIST_TAIL_SEPS } from 'mp/util/index'
import presets from '../../util/presets/index'

const vbindReg = /^(v-bind:?|:)/
const iteratorUid = createUidFn('item')

const TYPE = {
  ELEMENT: 1,
  TEXT: 2,
  STATIC_TEXT: 3
}

let sep = `'${LIST_TAIL_SEPS.wechat}'`

// walk and modify ast before render function is generated
export function mpify (node, options) {
  const { target = 'wechat', imports } = options
  sep = LIST_TAIL_SEPS[target] ? `'${LIST_TAIL_SEPS[target]}'` : sep
  const preset = presets[target]
  const state = new State({
    rootNode: node,
    target,
    preset,
    imports
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

  state.resolveHolder(node)

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

  state.resolveHolder(node)
  state.resolveForHolder(node)

  walk(node, state)

  state.popListState()
}

function walkElem (node, state) {
  processAttrs(node)
  if (node.key) {
    const key = node.key.replace(/^\w*\./, '')
    addAttr(node, '_fk', `"${key}"`)
  }

  // if (!isTag(node)) {
  if (state.isComponent(node)) {
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
  } else if (_fid) {
    node.expression = `${expression},${_hid},_fid`
  } else {
    node.expression = `${expression},${_hid}`
  }
}

function walkIf (node, state) {
  const conditions = node.ifConditions

  node.mpIfWalked = true

  conditions.forEach(condition => {
    const { block, exp } = condition

    walk(block, state)

    if (state.isInSlot()) {
      condition.__isInSlot = true
      if (!conditions.__extratExpression) {
        conditions.__extratExpression = []
      }
      if (exp) {
        const extratExpression = `!!(${exp}), ${block._hid}, ${block._fid || null}`
        conditions.__extratExpression.push(extratExpression)
      }
    }

    if (exp) {
      condition.rawexp = exp
      if (block._fid) {
        condition.exp = `_ri(!!(${exp}), ${block._hid}, ${block._fid})`
      } else {
        condition.exp = `_ri(!!(${exp}), ${block._hid})`
      }
    }
  })

  if (conditions.__extratExpression) {
    conditions.forEach(condition => {
      const { block } = condition
      const noneTemplateBlock = findFirstNoneTemplateNode(block)
      addAttr(noneTemplateBlock, '__if', `[ ${conditions.__extratExpression.join(',')} ]`)
    })
  }
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
    let { name } = attr
    if (/^:?mp:/.test(name)) {
      const realName = attr.name.replace(/mp:/, '')
      renameObjectPropName(attrsMap, name, realName)
      modifyAttrName(attrs, name, realName)
      attr.name = realName
      name = realName
    }

    if (!vbindReg.test(name)) {
      // set default true, <div enable></div> -> <div enable="true"></div>
      if (attr.value === '') {
        attr.value = 'true'
        attrsMap[name] = 'true'
        modifyAttr(attrs, name, '"true"')
      }
    } else {
      // collect dynamic attrs, only update daynamic attrs in runtime
      const bindingName = name.replace(vbindReg, '') || 'value'
      bindingAttrs.push(bindingName)
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

class State {
  constructor (options = {}) {
    this.imports = options.imports || {}
    this.rootNode = options.rootNode
    this.compCount = -1
    this.elemCount = -1
    this.compStack = new Stack()
    this.sep = options.sep || '-'
    this.preset = options.preset
    // init a root component state, like page
    this.pushComp()
  }
  pushComp () {
    this.compStack.push({
      id: ++this.compCount,
      elems: 0,
      listStates: new Stack()
    })
  }
  popComp () {
    this.compStack.pop()
  }
  pushElem () {
    this.elemCount++
  }
  popListState () {
    return this.getCurrentComp().listStates.pop()
  }
  pushListState (state) {
    const currentStates = this.getCurrentListState()
    let newStates = []
    if (currentStates && currentStates.length) {
      newStates = [].concat(currentStates)
    }

    newStates.push(state)
    this.getCurrentComp().listStates.push(newStates)
  }
  getCurrentListState () {
    return this.getCurrentComp().listStates.top
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
  getCurrentListNode () {
    const top = this.getCurrentListState() || []
    return (top[top.length - 1] || {}).node
  }
  getHId (node) {
    this.pushElem()
    const _hid = `${this.getCurrentElemIndex()}`
    return `${_hid}`
  }
  getCId (node) {
    this.pushElem()
    const _cid = `${this.getCurrentCompIndex()}`
    return `${_cid}`
  }
  getFid (node) {
    const currentListState = this.getCurrentListState() || []
    const _fid = currentListState.map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
    return _fid
  }
  isInSlot () {
    return this.getCurrentComp().id !== 0
  }
  assignHId (node) {
    const _hid = this.getHId(node)
    Object.assign(node, { _hid })
  }
  resolveForHolder (node) {
    const { _hid, _fid } = node
    const currentListState = this.getCurrentListState() || []
    let tail = ''

    // remove last index, like '0-1-2', we only need '0-1'
    // store v-for list in this holder
    node._forInfo = { _hid }
    if (_fid) {
      tail = currentListState.slice(0, -1).map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
      node._forInfo._fid = `${tail}` || undefined
    }
  }
  resolveHolder (node) {
    if (node._hid === undefined) {
      // holder id
      this.assignHId(node)
      addAttr(node, '_hid', node._hid)

      // list tail in v-for, exp: '0-0', '0-1'
      const _fid = this.getFid(node)
      if (_fid) {
        Object.assign(node, { _fid })
        addAttr(node, '_fid', '_fid')
      }
    }
  }

  isComponent (el) {
    const { tag } = el
    return !!getComponentInfo(tag, this.imports)
  }
}

function findFirstNoneTemplateNode (el) {
  let res = null
  if (el.tag !== 'template') {
    return el
  }

  if (el.children) {
    el.children.some(c => {
      const found = findFirstNoneTemplateNode(c)
      if (found) {
        res = found
        return true
      }
    })
  }

  return res
}

function renameObjectPropName (obj, from, to) {
  if (obj.hasOwnProperty(from)) {
    obj[to] = obj[from]
    delete obj[from]
  }
}

function modifyAttr (attrs, name, value) {
  attrs.some(attr => {
    if (attr.name === name) {
      attr.value = value
      return true
    }
  })
}

function modifyAttrName (attrs, name, newName) {
  const realName = name.replace(/^:/, '')
  const realNewName = newName.replace(/^:/, '')
  attrs.some(attr => {
    if (attr.name === realName) {
      attr.name = realNewName
      return true
    }
  })
}

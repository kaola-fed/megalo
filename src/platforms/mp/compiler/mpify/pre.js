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
  const {
    target = 'wechat',
    imports = {},
    transformAssetUrls = {}
  } = options
  sep = LIST_TAIL_SEPS[target] ? `'${LIST_TAIL_SEPS[target]}'` : sep
  const preset = presets[target]
  const state = new State({
    rootNode: node,
    target,
    preset,
    imports,
    transformAssetUrls
  })
  walk(node, state)
}

function visit (node, state) {
  const { visitors = {}} = state.preset

  if (visitors.all) {
    visitors.all(node)
  }

  if (visitors[node.tag]) {
    visitors[node.tag](node)
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
  // which is needed for h_ generating
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
  processAttrs(node, state)
  if (node.key) {
    const key = node.key.replace(/^\w*\./, '')
    addAttr(node, 'k_', `"${key}"`)
  }

  // if (!isTag(node)) {
  if (state.isComponent(node)) {
    return walkComponent(node, state)
  }

  walkChildren(node, state)
}

function walkComponent (node, state) {
  // generate c_ first
  const c_ = state.getCId()

  // enter a component
  state.pushComp()

  Object.assign(node, { c_ })
  addAttr(node, 'c_', c_)

  walkChildren(node, state)
  state.popComp()
}

function walkText (node, state) {
  const { expression, type, h_, f_ } = node
  if (type === TYPE.STATIC_TEXT) {
    node.mpNotGenRenderFn = true
  } else if (f_) {
    node.expression = `${expression},${h_},f_`
  } else {
    node.expression = `${expression},${h_}`
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
        const extratExpression = `!!(${exp}), ${block.h_}, ${block.f_ || null}`
        conditions.__extratExpression.push(extratExpression)
      }
    }

    if (exp) {
      condition.rawexp = exp
      if (block.f_) {
        condition.exp = `_ri(!!(${exp}), ${block.h_}, ${block.f_})`
      } else {
        condition.exp = `_ri(!!(${exp}), ${block.h_})`
      }
    }
  })

  if (conditions.__extratExpression) {
    conditions.forEach(condition => {
      const { block } = condition
      const noneTemplateBlock = findFirstNoneTemplateNode(block)
      addAttr(noneTemplateBlock, 'i_', `[ ${conditions.__extratExpression.join(',')} ]`)
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

function processAttrs (node, state) {
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

    // img.src
    if (!/https?/.test(attr.value) && state.isTransformAssetUrl(node, name)) {
      bindingAttrs.push(name)
    }
  })

  if (bindingAttrs.length) {
    addAttr(node, 'b_', `"${bindingAttrs.join(',')}"`)
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
    this.transformAssetUrls = options.transformAssetUrls
    this.imports = options.imports
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
    const h_ = `${this.getCurrentElemIndex()}`
    return `${h_}`
  }
  getCId (node) {
    this.pushElem()
    const c_ = `${this.getCurrentCompIndex()}`
    return `${c_}`
  }
  getFid (node) {
    const currentListState = this.getCurrentListState() || []
    const f_ = currentListState.map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
    return f_
  }
  isInSlot () {
    return this.getCurrentComp().id !== 0
  }
  assignHId (node) {
    const h_ = this.getHId(node)
    Object.assign(node, { h_ })
  }
  resolveForHolder (node) {
    const { h_, f_ } = node
    const currentListState = this.getCurrentListState() || []
    let tail = ''

    // remove last index, like '0-1-2', we only need '0-1'
    // store v-for list in this holder
    node._forInfo = { h_ }
    if (f_) {
      tail = currentListState.slice(0, -1).map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
      node._forInfo.f_ = `${tail}` || undefined
    }
  }
  resolveHolder (node) {
    if (node.h_ === undefined) {
      // holder id
      this.assignHId(node)
      addAttr(node, 'h_', node.h_)

      // list tail in v-for, exp: '0-0', '0-1'
      const f_ = this.getFid(node)
      if (f_) {
        Object.assign(node, { f_ })
        addAttr(node, 'f_', 'f_')
      }
    }
  }

  isComponent (node) {
    const { tag } = node
    return !!getComponentInfo(tag, this.imports)
  }

  isTransformAssetUrl (node, name) {
    return this.transformAssetUrls[node.tag] === name
  }
}

function findFirstNoneTemplateNode (node) {
  let res = null
  if (node.tag !== 'template') {
    return node
  }

  if (node.children) {
    node.children.some(c => {
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

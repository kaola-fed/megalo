import TAG_MAP from './tag-map'
import { Stack } from './util'

const TYPE = {
  ELEMENT: 1,
  TEXT: 2,
  STATIC_TEXT: 3
}

export function mpify (node) {
  const state = new State({
    rootNode: node
  })
  walk(node, state)
}

function walk (node, state) {
  if (node.for && !node.mpForWalked) {
    return walkFor(node, state)
  }

  if (node._hid === undefined) {
    state.assignHId(node)
    addAttr(node, '_hid', node._hid)
  }

  if (node.ifConditions && !node.mpIfWalked) {
    return walkIf(node, state)
  }

  if (node.type === TYPE.ELEMENT) {
    walkElem(node, state)
  } else if (node.type === TYPE.TEXT || node.type === TYPE.STATIC_TEXT) {
    walkText(node, state)
  }
}

function walkFor (node, state) {
  const { for: _for, key, alias } = node
  // create a default iterator1 for wxml listing,
  // which is needed for _hid generating
  const { iterator1 = `${alias}_index$0` } = node
  Object.assign(node, {
    mpForWalked: true,
    iterator1
  })

  state.pushListState({
    iterator1,
    _for,
    key,
    node,
    alias
  })

  walk(node, state)

  state.popListState()
}

function walkElem (node, state) {
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
  // enter a component
  state.pushComp()
  const _cid = state.getCId()

  Object.assign(node, { _cid })
  addAttr(node, '_cid', _cid)

  walkChildren(node, state)
  state.popComp()
}

function walkText (node, state) {
  const { expression, type, _hid } = node
  if (type === TYPE.STATIC_TEXT) {
    node.mpNotGenRenderFn = true
  } else {
    node.expression = `${expression}, ${_hid}`
  }
}

function walkIf (node, state) {
  const conditions = node.ifConditions
  const scopeNode = state.getCurrentListNode() || state.rootNode

  node.mpIfWalked = true

  conditions.forEach(condition => {
    const { block, exp } = condition
    const _if = scopeNode._if || []
    let currIdxInIf = -1
    scopeNode._if = _if

    // if exp === undefined, it's a v-else
    if (exp !== undefined) {
      const cond = `__cond$${_if.length}`

      _if.push({
        exp,
        cond
      })

      currIdxInIf = _if.length - 1
      condition.rawExp = exp
      condition.exp = cond
    }

    walk(block, state)

    // update _hid in _if after node is walked
    if (currIdxInIf !== -1) {
      _if[currIdxInIf]._hid = block._hid
    }
  })

  const { _if } = scopeNode
  _if.forEach((c, i) => {
    addAttr(scopeNode, `_if_id$${i}`, c._hid)
    addAttr(scopeNode, `_if_v$${i}`, c.cond)
  })

  Object.assign(scopeNode, { _if })
}

function walkChildren (node, state) {
  const { children, scopedSlots } = node
  if (children) {
    children.forEach(n => {
      walk(n, state)
    })
  }

  if (scopedSlots) {
    Object.keys(scopedSlots).forEach(k => {
      const slot = scopedSlots[k] || {}
      const { children = [] } = slot
      children.forEach(n => {
        walk(n, state)
      })
    })
  }
}

function addAttr (node, name, value) {
  // generate attr code when plain is false
  node.plain = false
  const { attrs = [], attrsMap = {}} = node

  let attrIndex = attrs.findIndex(attr => attr.name === name)
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
    this.rootNode = options.rootNode || null
    this.compCount = -1
    this.elemCount = -1
    this.compStack = new Stack()
    this.listStates = new Stack()
    // init a root component state, like page
    this.pushComp()
  }
  pushComp () {
    this.compStack.push({
      id: this.compCount++,
      elems: 0
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
  getCurrentCompIndex () {
    const currentComponent = this.compStack.top
    return `${currentComponent.id}`
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
    const currentListState = this.getCurrentListState()
    let _hid = `${this.getCurrentElemIndex()}`
    if (currentListState) {
      const listTail = currentListState.map(s => s.iterator1).join(` + '-' + `)
      _hid = `${_hid} + '-' + ${listTail}`
    }
    return `${_hid}`
  }
  getCId (node) {
    this.pushElem()
    const currentListState = this.getCurrentListState()
    let _cid = `${this.getCurrentCompIndex()}`
    if (currentListState) {
      const listTail = currentListState.map(s => s.iterator1).join(` + '-' + `)
      _cid = `${_cid} + '-' + ${listTail}`
    }
    return `${_cid}`
  }
  assignHId (node) {
    const _hid = this.getHId(node)
    Object.assign(node, { _hid })
  }
}

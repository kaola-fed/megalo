import TAG_MAP from './tag-map'

const TYPE = {
  ELEMENT: 1,
  TEXT: 2
}

export function mpify (node) {
  const state = new State({
    rootNode: node
  })
  state.pushComp()
  walk(node, state)
}

function walk (node, state) {
  if (node.for && !node.forWalked) {
    return walkFor(node, state)
  }
  if (node.ifConditions && !node.ifWalked) {
    return walkIf(node, state)
  }

  if (node._hid === undefined) {
    state.assignHId(node)
    addAttr(node, '_hid', node._hid)
  }

  if (node.type === TYPE.ELEMENT) {
    walkElem(node, state)
  } else if (node.type === TYPE.TEXT) {
    walkText(node, state)
  } else {
    walkOther(node, state)
  }
}

function walkFor (node, state) {
  const { iterator1: iterator, for: _for, key } = node

  node.forWalked = true

  state.pushListState({
    iterator,
    _for,
    key,
    node
  })

  walk(node, state)

  state.popListState()
}

function walkElem (node, state) {
  if (!isTag(node)) {
    return walkComponent(node, state)
  }

  walkChildren(node, state)
}

function walkComponent (node, state) {
  // current component index
  state.pushComp()
  const _cid = state.getCurrentCompIndex()

  addAttr(node, '_cid', _cid)

  walkChildren(node, state)
  state.popComp()
}

function walkText (node, state) {
  if (node.expression) {
    node.expression = `${node.expression}, ${node._hid}`
  }
}

function walkIf (node, state) {
  const conditions = node.ifConditions
  const scopeNode = state.getCurrentListNode() || state.rootNode

  node.ifWalked = true

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
  if (node.children) {
    node.children.forEach(n => {
      walk(n, state)
    })
  }
}

function walkOther (node, state) {
}

function addAttr (node, name, value) {
  // generate attr code when plain is false
  node.plain = false
  const { attrs = [] } = node

  let attrIndex = attrs.findIndex(attr => attr.name === name)
  attrIndex = attrIndex !== -1 ? attrIndex : attrs.length
  attrs[attrIndex] = {
    name,
    value: `${value}`
  }

  Object.assign(node, { attrs })
}

function isTag (node) {
  return !!TAG_MAP[node.tag] || node.tag === 'template'
}

class Stack {
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

class State {
  constructor (options = {}) {
    this.rootNode = options.rootNode || null
    this.compCount = 0
    this.compStack = new Stack()
    this.listStates = new Stack()
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
    const currentComponent = this.compStack.top
    currentComponent.elems++
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
    return currentComponent.id
  }
  getCurrentElemIndex () {
    const currentComponent = this.compStack.top
    return currentComponent.elems - 1
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
      const listTail = currentListState.map(s => s.iterator).join(` + "-" + `)
      _hid = `"${_hid}" + ${listTail}`
    }

    return `${_hid}`
  }
  assignHId (node) {
    const _hid = this.getHId(node)
    Object.assign(node, { _hid })
  }
}

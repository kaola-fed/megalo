import { Stack, createUidFn } from '../util'
import { LIST_TAIL_SEPS } from 'mp/util/index'
import presets from '../../util/presets/index'

const iteratorUid = createUidFn('item')

const TYPE = {
  ELEMENT: 1,
  TEXT: 2,
  STATIC_TEXT: 3
}

let sep = `'${LIST_TAIL_SEPS.wechat}'`

// walk and modify ast after render function is generated
// modify some value before the template is generated
export function postMpify (node, options, tools) {
  const { target = 'wechat' } = options
  sep = LIST_TAIL_SEPS[target] ? `'${LIST_TAIL_SEPS[target]}'` : sep
  const preset = presets[target]
  const state = new State({
    rootNode: node,
    target,
    preset,
    tools
  })
  walk(node, state)
}

function walk (node, state) {
  if (node.for && !node.postMpForWalked) {
    return walkFor(node, state)
  }

  state.resolveFid(node)

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
    postMpForWalked: true,
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

  walk(node, state)

  state.popListState()
}

function walkElem (node, state) {
  if (state.tools.isComponent(node)) {
    return walkComponent(node, state)
  }

  walkChildren(node, state)
}

function walkComponent (node, state) {
  state.pushComp()

  walkChildren(node, state)
  state.popComp()
}

function walkText (node, state) {
}

function walkIf (node, state) {
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

class State {
  constructor (options = {}) {
    this.rootNode = options.rootNode
    this.compCount = -1
    this.elemCount = -1
    this.compStack = new Stack()
    this.sep = options.sep || '-'
    this.preset = options.preset
    this.tools = options.tools
    // init a root component state, like page
    this.pushComp()
  }
  pushComp () {
    /**
     * major difference against pre procedure
     * the listState is based on component context,
     * which is, if the slot is inside of v-for, it's tail should be pased throw "_t" in templates
     *
     *  exp:
     * <div v-for="(item,index) in items">{{item}}</div>
     *  <compa>
     *    <div v-for="(ele,i) in item.list">{{index}}-{{ele}}</div>
     *   </compa>
     * </div>
     *
     * the slot should compile to:
     * <template name="slot_a">
     *   <view wx:for="{{ h[ 1 + _t ].li }}" wx:for-item="ele" wx:for-index="i">
     *     {{ h[ 2 + _t + '-' + i ].li }}
     *   </view>
     * </template>
     *
     * the "_t" is passed by <compa>:
     * <template is="slot_a" data="{{ _t: _t || '' }}"></template>
     *
     * the source is from main page:
     * <template>
     *   <view wx:for="{{ h[ 1 + _t ].li }}" wx:for-item="item" wx:for-index="index">
     *     <template is="compa" data="{{ _t: '-' + index }}"></template>
     *   </view>
     * </template>
     */
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
    return this.getCurrentComp().listStates.top
  }
  getCurrentListNode () {
    const top = this.getCurrentListState() || []
    return (top[top.length - 1] || {}).node
  }
  resolveFid (node) {
    const { _hid } = node
    const currentListState = this.getCurrentListState() || []
    const _fid = currentListState.map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
    let tail = ''

    node._fid = _fid || undefined

    // remove last index, like '0-1-2', we only need '0-1'
    // store v-for list in this holder
    if (_fid) {
      tail = currentListState.slice(0, -1).map(s => `(${s.iterator2} !== undefined ? ${s.iterator2} : ${s.iterator1})`).join(` + ${sep} + `)
      tail = tail ? ` + ${sep} + ${tail}` : tail
    }
    node._forId = _hid + tail
  }
}

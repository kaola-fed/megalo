/* @flow */

// import { extend, warn, isObject } from 'core/util/index'
import { getVMId, updateSlotId } from '../../instance/index'
import { isDef } from 'shared/util'
/**
 * Runtime helper for rendering <slot>
 */
export function afterRenderSlot (
  nodes: ?Array<VNode>,
  name: string,
  fallback: ?Array<VNode>,
  props: ?Object,
  bindObject: ?Object
): ?Array<VNode> {
  const { _fid } = props
  // single tag:
  // <CompA><span slot-scope="props">{{ props.msg }}</span></CompA>
  if (nodes && nodes.tag) {
    nodes = [nodes]
  }
  if (nodes && nodes.length) {
    const firstNode = getFirstNode(nodes)
    const { context } = firstNode
    if (context !== this) {
      const sid = getVMId(context)
      updateSlotId(this, sid)
    }
    markComponents(nodes, this._uid)
  }

  // scopedSlotFn with v-for
  const scopedSlotFn = this.$scopedSlots[name]
  // update vnode hid in scoped slot with the slot host's actual fid
  if (scopedSlotFn && isDef(_fid)) {
    updateNodesHid(nodes, `-${_fid}`)
  }

  return nodes
}

function updateNodesHid (nodes = [], tail) {
  nodes.forEach(node => {
    /* istanbul ignore else */
    if (node.data && node.data._hid) {
      node.data._hid += tail
    } else if (node && node.data && node.data.attrs && node.data.attrs._hid) {
      node.data.attrs._hid += tail
    }
    updateNodesHid(node.children || [], tail)
  })
}

function getFirstNode (nodes) {
  let firstNode = nodes
  while (firstNode && Array.isArray(firstNode)) {
    firstNode = firstNode[0]
  }
  return firstNode
}

function markComponents (nodes, parentUId) {
  return (nodes || []).forEach(node => {
    const { componentOptions } = node
    if (componentOptions) {
      node._mpSlotParentUId = parentUId
    }
    markComponents(node.children)
  })
}

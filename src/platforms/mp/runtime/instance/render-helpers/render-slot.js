/* @flow */

// import { extend, warn, isObject } from 'core/util/index'
import { getVMId, updateSlotId } from '../../instance/index'
import { VM_ID_SEP_REG, NODE_ID_SEP_REG } from 'mp/util/index'
/**
 * Runtime helper for rendering <slot>
 */
export function afterRenderSlot (
  name: string,
  fallback: ?Array<VNode>,
  props: ?Object,
  bindObject: ?Object,
  nodes: ?Array<VNode>
): ?Array<VNode> {
  const componentVnode = this.$vnode
  const componentCid = componentVnode.data.attrs._cid
  const { _hid = '' } = props
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
  if (scopedSlotFn && NODE_ID_SEP_REG.test(_hid)) {
    const tail = _hid.replace(/^\d+/, '')
    updateNodesHid(nodes, tail)
  } else if (VM_ID_SEP_REG.test(componentCid)) {
    const tail = componentCid.replace(/^\d+/, '')
    updateNodesHid(nodes, tail)
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
  return (nodes || []).reduce((res, node) => {
    const { componentOptions } = node
    if (componentOptions) {
      node._mpSlotParentUId = parentUId
    }
    markComponents(node.children)
    return res
  }, [])
}

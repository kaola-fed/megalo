/* @flow */

// import { extend, warn, isObject } from 'core/util/index'
import { getVMId, updateSlotId } from '../../instance/index'

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
  if (nodes && nodes.length) {
    const firstNode = getFirstNode(nodes)
    const { context } = firstNode
    const sid = getVMId(context)
    updateSlotId(this, sid)
    markComponents(nodes, this._uid)
  }
  return nodes
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

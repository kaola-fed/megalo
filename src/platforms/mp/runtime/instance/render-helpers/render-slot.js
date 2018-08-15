/* @flow */

// import { extend, warn, isObject } from 'core/util/index'

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
  resolveSlotContext(nodes, this)
  return nodes
}

function resolveSlotContext (nodes, slotContext) {
  (nodes || []).forEach(node => {
    node.slotContext = slotContext
    resolveSlotContext(node.children, slotContext)
  })
}

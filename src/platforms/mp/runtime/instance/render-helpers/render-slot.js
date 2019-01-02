/* @flow */

import { getFid } from '../../instance/index'
import { isDef } from 'shared/util'
import { updateVnodeToMP } from '../index'
import { HOLDER_TYPE_VARS, LIST_TAIL_SEPS } from 'mp/util/index'

let sep = null

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
  if (!sep) {
    sep = LIST_TAIL_SEPS[this.$mp.platform] || LIST_TAIL_SEPS.wechat
  }

  // single tag:
  // <CompA><span slot-scope="props">{{ props.msg }}</span></CompA>
  if (nodes && nodes.tag) {
    nodes = [nodes]
  }

  if (!nodes || !nodes.length) {
    return nodes
  }

  const firstNode = getFirstNode(nodes)

  if (firstNode.__slotWalked) {
    return nodes
  }

  firstNode.__slotWalked = true

  const slotFid = props.f_
  const hostFId = this.$vnode.data.attrs.f_
  walkVnodes(
    nodes,
    {
      hostFId,
      slotContext: this,
      slotFid
    }
  )

  return nodes
}

function getFidPath (vm) {
  const fids = []
  let cursor = vm
  while (cursor) {
    const fid = getFid(cursor)
    if (isDef(fid)) {
      fids.unshift(fid)
    }
    cursor = cursor.$parent
  }
  return fids.join(sep) || undefined
}

function walkVnodes (nodes = [], { hostFid, slotContext, slotFid }) {
  const fidPath = getFidPath(slotContext)
  const parentUId = slotContext._uid
  nodes.forEach(node => {
    setSlotContextAndParentUid(node, slotContext, parentUId)

    // update vnode hid in scoped slot with the slot host's actual fid
    if (node.data && node.data.attrs) {
      if (/^vue-component/.test(node.tag)) {
        node.data.attrs.f_ = resolveFid(
          [slotFid, node.data.attrs.f_]
        )
      } else {
        node.data.attrs.f_ = resolveFid(
          [fidPath, slotFid, node.data.attrs.f_]
        )
      }
    } else if (node.data) {
      node.data.f_ = resolveFid(
        [fidPath, slotFid, node.data.f_]
      )
    }

    walkVnodes(node.children, { hostFid, slotContext, fidPath, slotFid })

    renderIf(node, { fidPath, slotFid, slotContext })

    if (node.__renderListFn) {
      const renderListVnode = node.__renderListVnode
      renderListVnode.data.attrs.f_ = resolveFid(
        [fidPath, slotFid, renderListVnode.data.attrs.f_]
      )
      renderListVnode.slotContext = slotContext
      node.__renderListFn()
    }
  })
}

function renderIf (node, { fidPath, slotFid, slotContext }) {
  if (node.data && node.data.attrs && node.data.attrs.i_) {
    const i_ = node.data.attrs.i_
    for (let i = 0, len = i_.length; i < len; i += 3) {
      const cond = i_[i]
      const _ifHid = i_[i + 1]
      const _ifFid = i_[i + 2]
      const realIfFid = resolveFid(
        [fidPath, slotFid, _ifFid]
      )
      const ifNode = {
        slotContext,
        data: {
          attrs: {
            h_: _ifHid,
            f_: realIfFid
          }
        }
      }

      updateVnodeToMP(ifNode, HOLDER_TYPE_VARS.if, cond)
    }
  }
}

function resolveFid (ids = []) {
  return ids
    .filter(e => isDef(e) && e !== '')
    .join(sep) || undefined
}

function getFirstNode (nodes) {
  let firstNode = nodes
  while (firstNode && Array.isArray(firstNode)) {
    firstNode = firstNode[0]
  }
  return firstNode
}

function setSlotContextAndParentUid (node, slotContext, parentUId) {
  const { componentOptions } = node
  if (componentOptions) {
    node._mpSlotParentUId = parentUId
  }
  node.slotContext = slotContext
}

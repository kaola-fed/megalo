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

  const slotFid = props._fid
  const hostFId = this.$vnode.data.attrs._fid
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
        node.data.attrs._fid = resolveFid(
          [slotFid, node.data.attrs._fid]
        )
      } else {
        node.data.attrs._fid = resolveFid(
          [fidPath, slotFid, node.data.attrs._fid]
        )
      }
    } else if (node.data) {
      node.data._fid = resolveFid(
        [fidPath, slotFid, node.data._fid]
      )
    }

    walkVnodes(node.children, { hostFid, slotContext, fidPath, slotFid })

    renderIf(node, { fidPath, slotFid, slotContext })

    if (node.__renderListFn) {
      const renderListVnode = node.__renderListVnode
      renderListVnode.data.attrs._fid = resolveFid(
        [fidPath, slotFid, renderListVnode.data.attrs._fid]
      )
      renderListVnode.slotContext = slotContext
      node.__renderListFn()
    }
  })
}

function renderIf (node, { fidPath, slotFid, slotContext }) {
  if (node.data && node.data.attrs && node.data.attrs.__if) {
    const __if = node.data.attrs.__if
    for (let i = 0, len = __if.length; i < len; i += 3) {
      const cond = __if[i]
      const _ifHid = __if[i + 1]
      const _ifFid = __if[i + 2]
      const realIfFid = resolveFid(
        [fidPath, slotFid, _ifFid]
      )
      const ifNode = {
        slotContext,
        data: {
          attrs: {
            _hid: _ifHid,
            _fid: realIfFid
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

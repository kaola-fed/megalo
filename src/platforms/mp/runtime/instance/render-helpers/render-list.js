/* @flow */

import { isObject } from 'core/util/index'
import { updateVnodeToMP } from '../update'
import { HOLDER_TYPE_VARS, getValue } from 'mp/util/index'
import VNode from 'core/vdom/vnode'

/**
 * Runtime helper for rendering v-for lists.
 */
export function afterRenderList (
  ret: Array<VNode>,
  val: any,
  render: (
    val: any,
    keyOrIndex: string | number,
    index?: number
  ) => VNode,
  forInfo: Array,
  context: Vue
) {
  updateListToMP(ret, val, forInfo, context)
}

// TODO: support for destructuring
// TODO: keys collecting method needs improve for
// <li v-for="i in 3" :key="i"></li>
function updateListToMP (vnodeList = [], val, forInfo, context) {
  let firstItem = vnodeList[0]
  let forKeys
  let list = []
  if (!firstItem) {
    vnodeList.push(new VNode('div'))
    firstItem = vnodeList[0]
  }

  /* istanbul ignore else */
  if (firstItem) {
    // collect v-key
    if (Array.isArray(firstItem)) {
      forKeys = firstItem.map(e => {
        const { attrs = {}} = e.data || /* istanbul ignore next */ {}
        const { k_ = '' } = attrs
        return k_
      })
    } else {
      const { attrs = {}} = firstItem.data || {}
      const { k_ = '' } = attrs
      forKeys = [k_]
    }

    forKeys = forKeys.filter(e => e)

    // generate list array with v-key value
    let valToList = []
    /* istanbul ignore else */
    if (Array.isArray(val) || typeof val === 'string') {
      valToList = new Array(val.length)
      for (let i = 0, l = val.length; i < l; i++) {
        valToList[i] = val[i]
      }
    } else if (typeof val === 'number') {
      valToList = new Array(val)
      for (let i = 0; i < val; i++) {
        valToList[i] = i
      }
    } else if (isObject(val)) {
      valToList = Object.keys(val).map((e, i) => i)
    }

    list = valToList.map((e, i) => {
      if (forKeys.length === 0) {
        return i
      }
      return forKeys.reduce((res, k) => {
        res[k.replace(/\./g, '_')] = getValue(val[i], k)
        return res
      }, {})
    })
  }

  const cloneVnode = {
    context,
    data: {
      attrs: { h_: forInfo[0], f_: forInfo[1] }
    }
  }

  // TODO: try not disable key diff in patching process
  // key will reuse existing vnode which won't update the vnode content
  // see unit test: with key
  // list won't update after this.list.reverse() if it's not disable

  // if is a scoped slot list
  if (firstItem && !firstItem.fn) {
    vnodeList.forEach(vnode => {
      if (Array.isArray(vnode)) {
        vnode.forEach(c => {
          delete c.key
        })
      } else {
        delete vnode.key
      }
    })
  }

  updateVnodeToMP(cloneVnode, HOLDER_TYPE_VARS.for, list)

  const fnStoreNode = Array.isArray(firstItem) ? firstItem[0] : firstItem

  if (fnStoreNode) {
    fnStoreNode.__renderListFn = function (vnode) {
      updateVnodeToMP(vnode || cloneVnode, HOLDER_TYPE_VARS.for, list)
    }

    fnStoreNode.__renderListVnode = cloneVnode
  }
}

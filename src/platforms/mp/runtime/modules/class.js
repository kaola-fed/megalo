/* @flow */

import {
  isDef,
  isUndef
} from 'shared/util'

import {
  genClassForVnode,
  HOLDER_TYPE_VARS
} from 'mp/util/index'

import { updateVnodeToMP } from '../instance/index'

function updateClass (oldVnode: any, vnode: any) {
  const data: VNodeData = vnode.data
  const oldData: VNodeData = oldVnode.data

  if (
    isUndef(data.staticClass) &&
    isUndef(data.class) && (
      isUndef(oldData) || (
        isUndef(oldData.staticClass) &&
        isUndef(oldData.class)
      )
    )
  ) {
    return
  }

  const { elm = {}} = vnode
  const cls = genClassForVnode(vnode)
  if (isDef(cls) && elm.class !== cls && !/^vue-component/.test(vnode.tag)) {
    // don't update empty class string on init
    if (cls === '' && isUndef(elm.class)) {
      return
    }
    if (!/^vue-component/.test(vnode.tag)) {
      Object.assign(vnode.elm, {
        class: cls
      })
    }
    updateVnodeToMP(vnode, HOLDER_TYPE_VARS.class, cls)
  }
}

export default {
  create: updateClass,
  update: updateClass
}

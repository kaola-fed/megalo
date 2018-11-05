/* @flow */

import {
  isDef,
  isUndef
} from 'shared/util'

import {
  genClassForVnode,
  VARS
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
  if (isDef(cls) && elm.class !== cls) {
    updateVnodeToMP(vnode, VARS.class, cls)
  }
}

export default {
  create: updateClass,
  update: updateClass
}

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

  let cls = genClassForVnode(vnode)
  let rootClass
  let rootVnode

  if (isDef(vnode.componentInstance)) {
    const { staticClass = '' } = vnode.data
    const rootClassList = (cls || '')
      .split(/\s+/)
      .concat(staticClass.split(/\s+/))
      .filter(e => e)
    rootVnode = vnode.componentInstance._vnode
    rootClass = rootClassList.join(' ')
    cls = undefined
  }

  if (isDef(cls)) {
    vnode.elm.class = cls
    updateVnodeToMP(vnode, HOLDER_TYPE_VARS.class, cls)
  }

  if (isDef(rootClass)) {
    updateVnodeToMP(rootVnode, HOLDER_TYPE_VARS.rootClass, rootClass)
  }
}

export default {
  create: updateClass,
  update: updateClass
}

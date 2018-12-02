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

function isRootVnodeOfComponent (vnode = {}) {
  const { data = {}} = vnode
  const _hid = isDef(data._hid) ? data._hid : (data.attrs && data.attrs._hid)
  return _hid === 0 && vnode.parent
}

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

  // const { elm = {}} = vnode
  const cls = genClassForVnode(vnode)
  if (isDef(cls) && !/^vue-component/.test(vnode.tag)) {
    Object.assign(vnode.elm, {
      class: cls
    })
    updateVnodeToMP(vnode, HOLDER_TYPE_VARS.class, cls)
  }

  // extract component class
  if (isRootVnodeOfComponent(vnode)) {
    const { staticClass = '' } = vnode.parent.data
    const cls = staticClass
    if (cls) {
      updateVnodeToMP(vnode, HOLDER_TYPE_VARS.rootClass, cls)
    }
  }
}

export default {
  create: updateClass,
  update: updateClass
}

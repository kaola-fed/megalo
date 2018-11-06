/* @flow */

import { updateVnodeToMP } from '../instance/index'
import { HOLDER_TYPE_VARS } from 'mp/util/index'

export default {
  bind (el: any, { value, oldValue }: VNodeDirective, vnode: VNodeWithData) {
    /* istanbul ignore else */
    if (value !== oldValue) {
      updateVnodeToMP(vnode, HOLDER_TYPE_VARS.vshow, !value)
    }
  },

  update (el: any, { value, oldValue }: VNodeDirective, vnode: VNodeWithData) {
    if (value !== oldValue) {
      updateVnodeToMP(vnode, HOLDER_TYPE_VARS.vshow, !value)
    }
  },

  unbind (
    el: any,
    binding: VNodeDirective,
    vnode: VNodeWithData,
    oldVnode: VNodeWithData,
    isDestroy: boolean
  ) {
    // if (!isDestroy) {
    //   el.style.display = el.__vOriginalDisplay
    // }
  }
}

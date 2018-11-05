/* @flow */

import { updateVnodeToMP } from '../instance/index'
import { VARS } from 'mp/util/index'

export default {
  bind (el: any, { value }: VNodeDirective, vnode: VNodeWithData) {
    updateVnodeToMP(vnode, VARS.vshow, !value)
  },

  update (el: any, { value, oldValue }: VNodeDirective, vnode: VNodeWithData) {
    updateVnodeToMP(vnode, VARS.vshow, !value)
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

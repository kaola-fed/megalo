/* @flow */

import { updateVnodeToMP } from '../instance/index'

export default {
  bind (el: any, { value }: VNodeDirective, vnode: VNodeWithData) {
    updateVnodeToMP(vnode, 'vs', !value)
  },

  update (el: any, { value, oldValue }: VNodeDirective, vnode: VNodeWithData) {
    updateVnodeToMP(vnode, 'vs', !value)
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

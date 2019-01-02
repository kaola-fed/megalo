import { updateVnodeToMP } from '../index'
import { HOLDER_TYPE_VARS } from 'mp/util/index'

export function renderIf (cond, h_, f_) {
  const cloneVnode = {
    context: this,
    data: {
      attrs: { h_, f_ }
    }
  }
  updateVnodeToMP(cloneVnode, HOLDER_TYPE_VARS.if, cond)
  return cond
}

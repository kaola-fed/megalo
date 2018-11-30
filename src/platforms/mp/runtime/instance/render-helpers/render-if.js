import { updateVnodeToMP } from '../index'
import { HOLDER_TYPE_VARS } from 'mp/util/index'

export function renderIf (cond, _hid, _fid) {
  const cloneVnode = {
    context: this,
    data: {
      attrs: { _hid, _fid }
    }
  }
  updateVnodeToMP(cloneVnode, HOLDER_TYPE_VARS.if, cond)
  return cond
}

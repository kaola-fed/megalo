import { isDef } from 'core/util/index'
import { VM_ID_SEP, LIST_TAIL_SEPS } from 'mp/util/index'

export function getHid (vm, vnode = {}) {
  const sep = LIST_TAIL_SEPS[vm.$mp.platform] || LIST_TAIL_SEPS.wechat
  const { data = {}} = vnode
  const _hid = isDef(data._hid) ? data._hid : (data.attrs && data.attrs._hid)
  const _fid = isDef(data._fid) ? data._fid : (data.attrs && data.attrs._fid)
  if (isDef(_fid)) {
    return `${_hid}${sep}${_fid}`
  }
  return _hid
}

export function getVM (vm = {}, id) {
  let res
  if (getVMId(vm) === `${id}`) {
    return vm
  }
  const { $children } = vm
  for (let i = 0; i < $children.length; ++i) {
    res = getVM($children[i], id)
    /* istanbul ignore else */
    if (res) {
      return res
    }
  }
}

export function getCid (vm) {
  const { $vnode } = vm
  let cid = $vnode && $vnode.data && $vnode.data.attrs._cid
  cid = cid || '0'
  return cid
}

export function getFid (vm) {
  const { $vnode } = vm
  const fid = $vnode && $vnode.data && $vnode.data.attrs._fid
  return fid
}

export function getVMId (vm) {
  const sep = LIST_TAIL_SEPS[vm.$mp.platform] || LIST_TAIL_SEPS.wechat
  const res = []
  let cursor = vm
  let prev
  while (cursor) {
    if (cursor === vm || !isSlotParent(cursor, prev)) {
      res.unshift(getCid(cursor))
    }
    prev = cursor
    cursor = cursor.$parent
  }
  const vmId = res.join(VM_ID_SEP)
  const fid = getFid(vm)
  if (isDef(fid)) {
    return `${vmId}${sep}${fid}`
  }
  return vmId
}

function isSlotParent (parent, child) {
  const { $vnode = {}} = child || {}
  const childSlotParentUId = $vnode._mpSlotParentUId
  return isDef(childSlotParentUId) && childSlotParentUId === parent._uid
}

// export function getVMParentId (vm) {
//   if (vm.$parent) {
//     return getVMId(vm.$parent)
//   }
//   return ''
// }

import { isDef } from 'core/util/index'
import { VM_ID_SEP, LIST_TAIL_SEPS } from 'mp/util/index'
let sep = null

function updateSep (vm) {
  if (!sep) {
    sep = LIST_TAIL_SEPS[vm.$mp.platform] || LIST_TAIL_SEPS.wechat
  }
}

export function getHid (vm, vnode = {}) {
  updateSep(vm)
  const { data = {}} = vnode
  const h_ = isDef(data.h_) ? data.h_ : (data.attrs && data.attrs.h_)
  const f_ = isDef(data.f_) ? data.f_ : (data.attrs && data.attrs.f_)
  if (isDef(f_)) {
    return `${h_}${sep}${f_}`
  }
  return h_
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
  let cid = $vnode && $vnode.data && $vnode.data.attrs.c_
  cid = cid || '0'
  return cid
}

export function getFid (vm) {
  const { $vnode } = vm
  const fid = $vnode && $vnode.data && $vnode.data.attrs.f_
  return fid
}

function getFidPath (vm) {
  updateSep(vm)
  const fids = []
  let cursor = vm
  while (cursor) {
    const fid = getFid(cursor)
    if (isDef(fid)) {
      fids.unshift(fid)
    }
    cursor = cursor.$parent
  }
  return fids.join(sep) || undefined
}

export function getVMId (vm) {
  const sep = LIST_TAIL_SEPS[vm.$mp.platform] || LIST_TAIL_SEPS.wechat
  const res = []
  const fids = []
  let cursor = vm
  while (cursor) {
    let tmp = getCid(cursor)
    const fidPath = getFidPath(cursor)
    if (cursor !== vm && isDef(fidPath)) {
      tmp += `${sep}${fidPath}`
    }
    const fid = getFid(cursor)
    if (cursor !== vm && isDef(fid)) {
      fids.unshift(fid)
    }
    res.unshift(tmp)

    cursor = cursor.$parent
  }
  const vmId = res.join(VM_ID_SEP)
  const fid = getFid(vm)
  if (isDef(fid)) {
    fids.push(fid)
  }
  if (fids.length) {
    return `${vmId}${sep}${fids.join(sep)}`
  }
  return vmId
}

// function isSlotParent (parent, child) {
//   const { $vnode = {}} = child || {}
//   const childSlotParentUId = $vnode._mpSlotParentUId
//   return isDef(childSlotParentUId) && childSlotParentUId === parent._uid
// }

// export function getVMParentId (vm) {
//   if (vm.$parent) {
//     return getVMId(vm.$parent)
//   }
//   return ''
// }

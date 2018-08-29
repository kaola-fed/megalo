import { isDef } from 'core/util/index'

export function getHid (vm, vnode = {}) {
  const { data = {}} = vnode
  return data._hid || (data.attrs && data.attrs._hid)
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

export function getVMMarker (vm) {
  return vm && vm.$attrs && vm.$attrs['_cid'] ? vm.$attrs['_cid'] : '0'
}

export function getVMId (vm) {
  const res = []
  let cursor = vm
  let prev
  while (cursor) {
    if (cursor === vm || !isSlotParent(cursor, prev)) {
      res.unshift(getVMMarker(cursor))
    }
    prev = cursor
    cursor = cursor.$parent
  }
  return res.join(',')
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

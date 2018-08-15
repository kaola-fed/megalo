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
  while (cursor) {
    res.unshift(getVMMarker(cursor))
    cursor = cursor.$parent
  }
  return res.join(',')
}

export function getVMParentId (vm) {
  if (vm.$parent) {
    return getVMId(vm.$parent)
  }
  return ''
}

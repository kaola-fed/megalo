import { isDef } from 'core/util/index'
import { getVMMarker, getVMId, getVMParentId, getHid } from './helper'
import { throttle } from 'mp/util/throttle'
import { Buffer } from 'mp/util/buffer'

function isEmptyObj (obj = {}) {
  return Object.keys(obj).length === 0
}

export function initVMToMP (vm) {
  vm = vm || this
  const pid = getVMParentId(vm)
  const vmKey = getVMMarker(vm)
  const cid = [pid, vmKey].filter(e => e).join(',')
  const info = {
    cid,
    pid,
    cpath: `${cid},`
  }

  vm.$mp.update({
    [`$root.${cid}.cid`]: info.cid,
    [`$root.${cid}.pid`]: info.pid,
    [`$root.${cid}.cpath`]: info.cpath
  })
}

export function updateMPData (type = 't', data, vnode) {
  const vm = this
  const vmId = getVMId(vm)
  const hid = getHid(vm, vnode)

  if (isDef(hid)) {
    vm.$mp.update({
      [`$root.${vmId}._h.${hid}.${type}`]: data
    })
  }
}

export function createUpdateFn (page) {
  const buffer = new Buffer()
  const throttleSetData = throttle(function () {
    const data = buffer.pop()

    if (!isEmptyObj(data)) {
      console.log('setData', data)
      page.setData(data)
    }
  }, 50, { leadingDelay: 0 })

  return function update (data) {
    buffer.push(data)
    throttleSetData()
  }
}

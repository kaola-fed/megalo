import { isDef } from 'core/util/index'
import { getVMId, getHid } from './helper'
import { throttle, Buffer, COMP_ID_SEP } from 'mp/util/index'

function isEmptyObj (obj = {}) {
  return Object.keys(obj).length === 0
}

export function initVMToMP (vm) {
  vm = vm || this
  const cid = getVMId(vm)
  const info = {
    cid,
    cpath: `${cid}${COMP_ID_SEP}`
  }

  vm.$mp.update({
    [`$root.${cid}.c`]: info.cid,
    [`$root.${cid}.cp`]: info.cpath
  })
}

export function updateSlotId (vm, sid) {
  vm = vm || this
  const vmId = getVMId(vm)

  /* istanbul ignore else */
  if (isDef(sid)) {
    vm.$mp.update({
      [`$root.${vmId}.s`]: sid
    })
  }
}

export function updateMPData (type = 't', data, vnode) {
  const vm = this
  const vmId = getVMId(vm)
  const hid = getHid(vm, vnode)

  /* istanbul ignore else */
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

    if (!isEmptyObj(data) && page.setData) {
      page.setData(data)
    }
  }, 50, { leadingDelay: 0 })

  return function update (data) {
    buffer.push(data)
    throttleSetData()
  }
}

export function updateVnodeToMP (vnode, key = 't', value) {
  const { context, slotContext } = vnode
  const realContext = slotContext || context
  realContext && realContext.$updateMPData(key, value, vnode)

  /* istanbul ignore if */
  if (!realContext) {
    console.warn('update text with no context', key, value, vnode)
  }
}

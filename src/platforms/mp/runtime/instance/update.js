import { isDef } from 'core/util/index'
import { getVMId, getHid } from './helper'
import {
  throttle,
  getValue,
  deepEqual,
  Buffer,
  VM_ID_SEP,
  VM_ID_VAR,
  VM_ID_PREFIX,
  ROOT_DATA_VAR,
  HOLDER_VAR,
  SLOT_CONTEXT_ID_VAR,
  HOLDER_TYPE_VARS
} from 'mp/util/index'

function isEmptyObj (obj = {}) {
  return Object.keys(obj).length === 0
}

export function initVMToMP (vm) {
  vm = vm || this
  const cid = getVMId(vm)
  const info = {
    cid,
    cpath: `${cid}${VM_ID_SEP}`
  }

  const prefix = `${ROOT_DATA_VAR}.${cid}`

  vm.$mp._update({
    [`${prefix}.${VM_ID_VAR}`]: info.cid,
    [`${prefix}.${VM_ID_PREFIX}`]: info.cpath
  })
}

export function updateSlotId (vm, sid) {
  vm = vm || this
  const vmId = getVMId(vm)
  const dataPaths = [ROOT_DATA_VAR, vmId, SLOT_CONTEXT_ID_VAR]
  const curValue = getValue(vm.$mp.page.data, dataPaths)
  const dataPathStr = dataPaths.join('.')

  /* istanbul ignore else */
  if (isDef(sid) && curValue !== sid) {
    vm.$mp._update({
      [dataPathStr]: sid
    })
  }
}

export function updateMPData (type = HOLDER_TYPE_VARS.text, data, vnode) {
  const vm = this
  const vmId = getVMId(vm)
  const hid = getHid(vm, vnode)
  const dataPaths = [
    ROOT_DATA_VAR,
    vmId,
    HOLDER_VAR,
    hid,
    type
  ]
  const dataPathStr = dataPaths.join('.')

  const curValue = getValue(vm.$mp.page.data, dataPaths)
  const isDeepEqual = deepEqual(curValue, data)

  /* istanbul ignore else */
  if (isDef(hid) && !isDeepEqual) {
    vm.$mp._update({
      [dataPathStr]: data
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

export function updateVnodeToMP (vnode, key = HOLDER_TYPE_VARS.text, value) {
  const { context, slotContext } = vnode
  const realContext = slotContext || context
  realContext && realContext.$updateMPData(key, value, vnode)

  /* istanbul ignore if */
  if (!realContext) {
    console.warn('update text with no context', key, value, vnode)
  }
}


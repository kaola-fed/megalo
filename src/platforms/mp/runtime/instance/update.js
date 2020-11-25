import { camelize } from 'shared/util'
import { isDef } from 'core/util/index'
import { getVMId, getHid, calculateScopeId } from './helper'
import {
  throttle,
  getValue,
  deepEqual,
  Buffer,
  VM_ID_SEP,
  VM_ID_VAR,
  VM_ID_PREFIX,
  SCOPE_ID_VAR,
  // LIST_TAIL_SEPS,
  ROOT_DATA_VAR,
  SLOT_HOLDER_VAR,
  HOLDER_VAR,
  // SLOT_CONTEXT_ID_VAR,
  HOLDER_TYPE_VARS
} from 'mp/util/index'

function isEmptyObj (obj = {}) {
  return Object.keys(obj).length === 0
}

export function initVMToMP (vm) {
  // const sep = LIST_TAIL_SEPS[vm.$mp.platform] || LIST_TAIL_SEPS.wechat

  vm = vm || this
  const vmId = getVMId(vm)
  const scopeId = calculateScopeId(vm)
  const { $vnode = '' } = vm
  const info = {
    cid: vmId,
    cpath: `${vmId}${VM_ID_SEP}`
  }

  const prefix = `${ROOT_DATA_VAR}.${vmId}`

  vm.$mp._update({
    [`${prefix}.n`]: $vnode.tag || '$root',
    [`${prefix}.${SCOPE_ID_VAR}`]: ' ' + (scopeId || ''),
    [`${prefix}.${VM_ID_VAR}`]: info.cid,
    [`${prefix}.${VM_ID_PREFIX}`]: info.cpath
  })
}

export function updateMPData (type = HOLDER_TYPE_VARS.text, data, vnode) {
  const vm = this
  const vmId = getVMId(vm)
  const hid = getHid(vm, vnode)
  const camelizedType = camelize(type)
  const holderVar = (vnode.slotContext && vnode.context !== vnode.slotContext) ? SLOT_HOLDER_VAR : HOLDER_VAR
  const dataPaths = [
    ROOT_DATA_VAR,
    vmId,
    holderVar,
    hid,
    camelizedType
  ]
  let dataPathStr = dataPaths.join('.')

  const curValue = getValue(vm.$mp.page.data, dataPaths)

  // fix: 在设置 a.1 时，头条小程序会把 a 变成数组，导致后续的 a.b 设置失败
  // 通过强制加一个字符串 key，将 holderVar 变成对象
  if (vm.$mp.platform === 'toutiao') {
    const convertObjectPaths = [ROOT_DATA_VAR, vmId, holderVar, '_obj']
    const convertObjectPathStr = convertObjectPaths.join('.')
    if (!getValue(vm.$mp.page.data, convertObjectPaths)) {
      vm.$mp._update({
        [convertObjectPathStr]: true
      })
    }
  }

  /* istanbul ignore else */
  if (isDef(hid)) {
    const isDeepEqual = deepEqual(curValue, data)
    /* istanbul ignore else */
    if (!isDeepEqual || vm.$mp._shouldUpdateBuffer(dataPathStr, data)) {
      vm.$mp._update({
        [dataPathStr]: data
      })
    }
  }
}

export function createUpdateFn (page, options) {
  const buffer = new Buffer()
  const __refreshInterval = options.__refreshInterval || 50

  function doUpdate () {
    const data = buffer.pop()

    if (!isEmptyObj(data) && page.setData) {
      page.setData(data)
    }
  }

  const throttleSetData = throttle(function () {
    doUpdate()
  }, __refreshInterval, { leadingDelay: 0 })

  return {
    update (data) {
      buffer.push(data)
      throttleSetData()
    },
    instantUpdate () {
      doUpdate()
    },
    shouldUpdateBuffer (key, value) {
      return buffer.shouldUpdateBuffer(key, value)
    }
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


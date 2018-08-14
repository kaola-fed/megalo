/* @flow */

import { isObject, isDef } from 'core/util/index'

/**
 * Runtime helper for rendering v-for lists.
 */
export function renderList (
  val: any,
  render: (
    val: any,
    keyOrIndex: string | number,
    index?: number
  ) => VNode
): ?Array<VNode> {
  let ret: ?Array<VNode>, i, l, keys, key
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length)
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i)
    }
  } else if (typeof val === 'number') {
    ret = new Array(val)
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i)
    }
  } else if (isObject(val)) {
    keys = Object.keys(val)
    ret = new Array(keys.length)
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i]
      ret[i] = render(val[key], key, i)
    }
  }
  if (isDef(ret)) {
    (ret: any)._isVList = true
  }

  updateListToMP(ret, val)
  return ret
}

function updateListToMP (vnodeList, val) {
  let firstItem = vnodeList[0]
  let forId, forKeys

  if (Array.isArray(firstItem)) {
    forKeys = firstItem.map(e => {
      const { attrs = {}} = e.data || {}
      const { _fk = '' } = attrs
      return _fk
    })
  } else {
    const { attrs = {}} = firstItem.data || {}
    const { _fk = '' } = attrs
    forKeys = [_fk]
  }

  forKeys = forKeys.filter(e => e)

  const list = val.map((e, i) => {
    if (forKeys.length === 0) {
      return i
    }
    return forKeys.reduce((res, k) => {
      res[k.replace(/\./g, '_')] = getValue(val[i], k)
      return res
    }, {})
  })

  // <template v-for></template>
  // won't create VDOM for template
  // using parent holder to store listing data
  if (Array.isArray(firstItem)) {
    firstItem = firstItem[0]
    const { attrs = {}} = firstItem.data || {}
    const { _hid = '' } = attrs
    const parentIndex = +(_hid.match(/(^\d*)(?=-)/)[0]) - 1
    forId = _hid.replace(/-\d+$/, '').replace(/^\d*/, parentIndex)
  // <div v-for></div> => <div wx:for></div>
  // using itself to store listing data
  } else {
    const { attrs = {}} = firstItem.data || {}
    const { _hid = '' } = attrs
    forId = _hid.replace(/-\d+$/, '')
  }
  const { context } = firstItem
  context.$updateMPData('li', list, {
    data: { _hid: forId }
  })
}

function getValue (obj = {}, path = '') {
  const paths = path.split('.')
  return paths.reduce((prev, k) => {
    if (prev && isDef(prev)) {
      prev = prev[k]
    }
    return prev
  }, obj)
}

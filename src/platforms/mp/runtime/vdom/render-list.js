/* @flow */

import { isObject, isDef } from 'core/util/index'
import { updateVnodeToMP } from '../instance/index'

/**
 * Runtime helper for rendering v-for lists.
 */
export function renderList (
  val: any,
  render: (
    val: any,
    keyOrIndex: string | number,
    index?: number
  ) => VNode,
  forId: string | number,
  context: Vue
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

  updateListToMP(ret, val, forId, context)
  return ret
}

// TODO: aop
// TODO: support v-for="(item, key, i) in object"
// TODO: support for destructuring
function updateListToMP (vnodeList, val, forId, context) {
  const firstItem = vnodeList[0]
  let forKeys
  let list = []
  if (firstItem) {
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

    let valToList = []

    if (Array.isArray(val) || typeof val === 'string') {
      valToList = new Array(val.length)
      for (let i = 0, l = val.length; i < l; i++) {
        valToList[i] = val[i]
      }
    } else if (typeof val === 'number') {
      valToList = new Array(val)
      for (let i = 0; i < val; i++) {
        valToList[i] = i
      }
    } else if (isObject(val)) {
      valToList = Object.keys(val).map((e, i) => i)
    }

    list = valToList.map((e, i) => {
      if (forKeys.length === 0) {
        return i
      }
      return forKeys.reduce((res, k) => {
        res[k.replace(/\./g, '_')] = getValue(val[i], k)
        return res
      }, {})
    })
  }

  const cloneVnode = {
    context,
    data: {
      attrs: { _hid: forId }
    }
  }

  // TODO: try not disable key diff in patching process
  // key will reuse existing vnode which won't update the vnode content
  // see unit test: with key
  // list won't update after this.list.reverse() if it's not disable
  vnodeList.forEach(vnode => {
    vnode.key = undefined
  })

  updateVnodeToMP(cloneVnode, 'li', list)
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

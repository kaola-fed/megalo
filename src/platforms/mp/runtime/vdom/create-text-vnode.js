/* @flow */

import VNode from 'core/vdom/vnode'

export function createTextVNode (val: string | number, _hid) {
  const vnode = new VNode(undefined, {
    _hid
  }, undefined, String(val), undefined, this)

  return vnode
}

/* @flow */

import VNode from 'core/vdom/vnode'

export function createTextVNode (val: string | number, hid) {
  const vnode = new VNode(undefined, {
    hid
  }, undefined, String(val), undefined, this)

  return vnode
}

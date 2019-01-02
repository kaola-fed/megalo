/* @flow */

import VNode from 'core/vdom/vnode'

export function createTextVNode (val: string | number, h_, f_) {
  const vnode = new VNode(undefined, {
    h_, f_
  }, undefined, String(val), undefined, this)

  return vnode
}

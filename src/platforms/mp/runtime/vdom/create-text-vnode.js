/* @flow */

import VNode from 'core/vdom/vnode'

export function createTextVNode (val: string | number, _hid, _fid) {
  const vnode = new VNode(undefined, {
    _hid, _fid
  }, undefined, String(val), undefined, this)

  return vnode
}

/* @flow */

import {
  extend,
  isDef,
  isUndef
} from 'shared/util'
import { updateVnodeToMP } from '../instance/index'
import { isHTMLTag } from 'mp/util/index'

const ignoreKeys = ['h_', 'f_', 'k_', 'c_', 'b_', 'sc_']

function isIgnoreKey (key) {
  return ignoreKeys.indexOf(key) > -1 ||
  /^_if_/.test(key)
}

function updateAttrs (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  const opts = vnode.componentOptions
  if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
    return
  }
  if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
    return
  }
  let key, cur, old
  const oldAttrs = oldVnode.data.attrs || {}
  let attrs: any = vnode.data.attrs || {}
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(attrs.__ob__)) {
    attrs = vnode.data.attrs = extend({}, attrs)
  }

  for (key in attrs) {
    if (isIgnoreKey(key)) {
      continue
    }
    cur = attrs[key] !== undefined ? attrs[key] : ''
    old = oldAttrs[key]

    // only update daynamic attrs in runtime
    if (
      key !== 'slot' &&
      (
        old !== cur ||
        attrs.h_ !== oldAttrs.h_ ||
        // if it's not html tag, attribute can be object
        // just update it if is changes
        // TODO: optimize performance, diff the Array or Object first
        !isHTMLTag(vnode.tag) && typeof cur === 'object'
      )
    ) {
      // if using local image file, set path to the root
      if (cur && vnode.tag === 'img' && key === 'src' && !/^\/|:\/\/|data:/.test(cur)) {
        cur = `/${cur}`
      }
      updateVnodeToMP(vnode, key, cur)
    }
  }
}

export default {
  create: updateAttrs,
  update: updateAttrs
}

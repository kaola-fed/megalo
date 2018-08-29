/* @flow */

import {
  isPrimitive
} from 'core/util/index'

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
export function beforeCreateElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean,
  args
): VNode | Array<VNode> {
  let childrenIndex = 3
  if (Array.isArray(data) || isPrimitive(data)) {
    childrenIndex = 2
    normalizationType = children
    children = data
    data = undefined
  }
  args[childrenIndex] = normalizeChildren(children)
}

function normalizeChildren (children = []) {
  let res = []
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i]
    if (Array.isArray(child)) {
      res = res.concat(normalizeChildren(child))
    } else if (child) {
      res.push(child)
    }
  }
  return res
}

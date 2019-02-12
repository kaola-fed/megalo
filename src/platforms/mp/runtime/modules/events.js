/* @flow */

import { isUndef } from 'shared/util'
import { updateListeners } from 'core/vdom/helpers/index'

let target: any

function createOnceHandler (name, handler, capture) {
  const _target = target // save current target element in closure
  return function onceHandler () {
    const res = handler.apply(null, arguments)
    if (res !== null) {
      remove(name, onceHandler, capture, _target)
    }
  }
}

function add (
  name: string,
  handler: Function
) {
  /* istanbul ignore else */
  if (!target.on[name]) {
    target.on[name] = []
  }
  target.on[name].push(handler)
}

function remove (
  name: string,
  handler: Function,
  capture: boolean,
  _target?: HTMLElement
) {
  if (!handler) {
    return
  }
  const realTarget = _target || target
  const realHanlder = handler._withTask || handler
  /* istanbul ignore else */
  if (realTarget.on[name]) {
    const index = realTarget.on[name].indexOf(realHanlder)
    /* istanbul ignore else */
    if (index > -1) {
      realTarget.on[name].splice(index, 1)
    }
  }
}

function updateDOMListeners (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  target = vnode.elm
  updateListeners(on, oldOn, add, remove, createOnceHandler, vnode.context)
  target = undefined
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}
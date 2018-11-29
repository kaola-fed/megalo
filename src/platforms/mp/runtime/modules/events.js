/* @flow */

import { isUndef } from 'shared/util'
import { updateListeners } from 'core/vdom/helpers/index'

let target: any

function createOnceHandler (handler, event, capture) {
  const _target = target // save current target element in closure
  return function onceHandler () {
    const res = handler.apply(null, arguments)
    if (res !== null) {
      remove(event, onceHandler, capture, _target)
    }
  }
}

function add (
  event: string,
  handler: Function,
  once: boolean,
  capture: boolean,
  passive: boolean
) {
  // handler = withMacroTask(handler)
  if (once) handler = createOnceHandler(handler, event, capture)
  /* istanbul ignore else */
  if (!target.on[event]) {
    target.on[event] = []
  }
  target.on[event].push(handler)
}

function remove (
  event: string,
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
  if (realTarget.on[event]) {
    const index = realTarget.on[event].indexOf(realHanlder)
    /* istanbul ignore else */
    if (index > -1) {
      realTarget.on[event].splice(index, 1)
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
  updateListeners(on, oldOn, add, remove, vnode.context)
  target = undefined
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}

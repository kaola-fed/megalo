import { handleError } from 'core/util/index'
import config from 'core/config'
import { getVM } from './helper'
import { isDef } from 'shared/util'
import { LIST_TAIL_SEPS, eventTypeMap } from 'mp/util/index'

let sep = ''

function assertHid (vnode, hid) {
  const { data = {}} = vnode
  const { attrs = {}} = data
  const { h_, f_ } = attrs
  const curHid = isDef(f_) ? `${h_}${sep}${f_}` : h_
  return `${curHid}` === `${hid}`
}

export function proxyEvent (rootVM, event) {
  if (!sep) {
    sep = LIST_TAIL_SEPS[rootVM.$mp.platform] || LIST_TAIL_SEPS.wechat
  }
  const { type, detail = {}} = event
  const target = event.currentTarget || event.target
  const { dataset = {}} = target
  const { cid, hid } = dataset

  const vm = getVM(rootVM, cid)
  const { vnode, handlers } = getHandlers(vm, type, hid)
  const $event = Object.assign({}, event)
  Object.assign(event.target, {
    value: detail.value
  })

  if (config.globalEventHandler) {
    config.globalEventHandler(vm, $event, vnode, handlers);
  }

  handlers.forEach(handler => {
    handler($event)
  })
}

function getVnode (vnode = {}, hid) {
  let { children = [] } = vnode
  if (assertHid(vnode, hid)) {
    return vnode
  }

  for (let i = 0, len = children.length; i < len; ++i) {
    const res = getVnode(children[i], hid)
    if (res) return res
  }
}

const eventPrefixes = ['', '!', '~']

function getHandlers (vm, rawType, hid) {
  let handlers = []

  /* istanbul ignore if */
  if (!vm) return { handlers }

  const vnode = getVnode(vm._vnode, hid)

  if (!vnode) return { vnode, handlers }

  /* istanbul ignore if */
  if (!assertHid(vnode, hid)) return handlers
  
  handlers = getHandlersFromVnode(vm, vnode, rawType)

  return { vnode, handlers }
}

function getHandlersFromVnode(vm, vnode, rawType) {
  const { elm, data = {} } = vnode
  const dataOn = data.on || {}
  const { on = {} } = elm
  const type = rawType.toLowerCase()
  const eventTypes = eventTypeMap[type] || [type]
  let handlerIsUndefined = true
  if (type !== rawType) {
    eventTypes.push(rawType)
  }

  const res = eventTypes.reduce((buf, event) => {
    const handler = on[event]
    /* istanbul ignore if */

    if (Array.isArray(handler)) {
      buf = buf.concat(handler)
    }

    // try to find registered undefined handler
    // if the handler is defined, set handlerIsUndefined to be true
    // otherwise, throw an error
    eventPrefixes.forEach((prefix) => {
      const dataEventName = prefix + event
      if (
        dataOn.hasOwnProperty(dataEventName) &&
        dataOn[dataEventName] !== undefined
      ) {
        handlerIsUndefined = false
      }
    })

    return buf
  }, [])

  // throws error if an undefined handler is registered
  if (handlerIsUndefined) {
    const msg = `event: handler for "${rawType}" is undefined`
    const error = new Error(msg)
    handleError(error, vm, msg)
  }

  return res
}

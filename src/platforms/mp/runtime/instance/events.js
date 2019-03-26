import { handleError } from 'core/util/index'
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
  let handlers = []

  if (isAlipayMapEvent(event)) {
    handlers = getAlipayMapEventHanlders(rootVM, event)
  } else {
    const target = event.currentTarget || event.target
    const { dataset = {}} = target
    const { cid, hid } = dataset

    const vm = getVM(rootVM, cid)
    handlers = getHandlers(vm, type, hid)
  }

  const $event = Object.assign({}, event)
  if (event.target) {
    Object.assign(event.target, {
      value: detail.value
    })
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


function getHandlers (vm, rawType, hid) {
  let res = []

  /* istanbul ignore if */
  if (!vm) return res

  const vnode = getVnode(vm._vnode, hid)

  if (!vnode) return res


  /* istanbul ignore if */
  if (!assertHid(vnode, hid)) return res

  res = getHandlersOnVnode(vm, rawType, vnode)

  return res
}

function getHandlersOnVnode(vm, rawType, vnode) {
  const type = rawType.toLowerCase()
  const eventTypes = eventTypeMap[type] || [type]
  if (type !== rawType) {
    eventTypes.push(rawType)
  }

  const { elm, data = {} } = vnode
  const dataOn = data.on || {}
  const { on = {} } = elm
  let handlerIsUndefined = true
  const eventPrefixes = ['', '!', '~']
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

function isAlipayMapEvent(e) {
  if (
    !e.target &&
    (e.type === 'begin' || e.type === 'end')
  ) {
    return true
  }
  return false
}

function getAlipayMapEventHanlders(vm, event) {
  const mapVNode = getAlipayMapVNode(vm, event)
  return getHandlersOnVnode(vm, 'regionChange', mapVNode)
}

function getAlipayMapVNode(vm) {
  let mapVNode = findVnode(vm._vnode, vnode => vnode.tag === 'map' && vnode )
  if (!mapVNode) {
    for(let i = 0; i < vm.$children.length; i++) {
      mapVNode = getAlipayMapVNode(vm.$children[i])
      if (mapVNode) {
        break
      }
    }
  }
  return mapVNode
}

function findVnode(vnode, callback) {
  let res = callback(vnode)
  if (!res && vnode.children) {
    for(let i = 0; i < vnode.children.length; i++) {
      res = findVnode(vnode.children[i], callback)
      if (res) {
        break;
      }
    }
  }
  return res;
}
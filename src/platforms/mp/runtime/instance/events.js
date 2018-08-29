import { getVM } from './helper'
import { eventTypeMap } from 'mp/util/index'

export function proxyEvent (rootVM, event) {
  const { type, detail = {}} = event
  const target = event.currentTarget || event.target
  const { dataset = {}} = target
  const { cid, hid } = dataset

  const vm = getVM(rootVM, cid)
  const handlers = getHandlers(vm, type, hid)
  const $event = Object.assign({}, event)
  Object.assign(event.target, {
    value: detail.value
  })

  handlers.forEach(handler => {
    handler($event)
  })
}

function getVnode (vnode = {}, hid) {
  const { data = {}, componentInstance } = vnode
  let { children = [] } = vnode
  const { attrs = {}} = data
  if (`${attrs._hid}` === `${hid}`) {
    return vnode
  }

  // if vnode is component
  // find vnode in its slots
  if (componentInstance) {
    const { $slots = {}} = componentInstance
    children = Object.keys($slots)
      .reduce((res, k) => {
        const nodes = $slots[k]
        /* istanbul ignore else */
        if (nodes._rendered) {
          res = res.concat(nodes)
        }
        return res
      }, [])
  }

  for (let i = 0, len = children.length; i < len; ++i) {
    const res = getVnode(children[i], hid)
    if (res) return res
  }
}

function getHandlers (vm, type, hid) {
  let res = []

  const eventTypes = eventTypeMap[type] || [type]
  /* istanbul ignore if */
  if (!vm) return res

  const vnode = getVnode(vm._vnode, hid)

  if (!vnode) return res

  const { data, elm } = vnode
  const { attrs = {}} = data
  const { on = {}} = elm

  /* istanbul ignore if */
  if (('' + attrs._hid) !== ('' + hid)) return res

  res = eventTypes.reduce((buf, event) => {
    const handler = on[event]
    /* istanbul ignore if */
    if (typeof handler === 'function') {
      buf.push(handler)
    } else if (Array.isArray(handler)) {
      buf = buf.concat(handler)
    }
    return buf
  }, [])

  return res
}

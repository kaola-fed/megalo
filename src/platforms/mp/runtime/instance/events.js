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
  const type = rawType.toLowerCase()
  let res = []

  const eventTypes = eventTypeMap[type] || [type]
  if (type !== rawType) {
    eventTypes.push(rawType)
  }

  /* istanbul ignore if */
  if (!vm) return res

  const vnode = getVnode(vm._vnode, hid)

  if (!vnode) return res

  const { elm } = vnode
  const { on = {}} = elm

  /* istanbul ignore if */
  if (!assertHid(vnode, hid)) return res

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

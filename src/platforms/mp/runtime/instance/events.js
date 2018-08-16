import { getVM } from './helper'
import { eventTypeMap } from 'mp/util/index'

export function proxyEvent (rootVM, event) {
  const { type, detail = {}} = event
  const target = event.currentTarget || event.target
  const { dataset = {}} = target
  const { cid, hid } = dataset

  const vm = getVM(rootVM, cid)
  const hanlders = getHandlers(vm, type, hid)
  const $event = Object.assign({}, event)
  Object.assign(event.target, {
    value: detail.value
  })

  hanlders.forEach(hanlder => {
    hanlder($event)
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

  const eventTypes = eventTypeMap[type]
  if (!vm) return res

  const vnode = getVnode(vm._vnode, hid)
  if (!vnode) return res

  const { data } = vnode
  const { attrs, on } = data

  if (('' + attrs._hid) !== ('' + hid)) return res

  res = eventTypes.reduce((buf, event) => {
    const hanlder = on[event]
    if (typeof hanlder === 'function') {
      buf.push(hanlder)
    } else if (Array.isArray(hanlder)) {
      buf = buf.concat(hanlder)
    }
    return buf
  }, [])

  return res
}

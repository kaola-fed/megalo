import { getVM } from './helper'
import { eventTypeMap } from 'mp/util/index'

export function proxyEvent (rootVM, event) {
  const { type } = event
  const target = event.currentTarget || event.target
  const { dataset = {}} = target
  const { comkey, eventid } = dataset

  const vm = getVM(rootVM, comkey)
  const hanlders = getHandlers(vm, type, eventid)

  hanlders.forEach(hanlder => {
    hanlder(event)
  })
}

function getHandlers (vm, type, eventId) {
  const eventTypes = eventTypeMap[type]
  const vnode = vm._vnode
  const { data } = vnode
  const { attrs, on } = data
  let res = []

  if (attrs.eventid !== eventId) {
    return res
  }

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

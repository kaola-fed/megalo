import { updateVnodeToMP } from '../instance/index'

export function afterCreateElement (vnode) {
  updateIfConditionsToMP(vnode)
}

function updateIfConditionsToMP (vnode) {
  const { data = {}} = vnode
  const { attrs = {}} = data
  for (const key in attrs) {
    if (/^_if_id/.test(key)) {
      const ifIndex = key.split('$')[1]
      const _hid = attrs[key]
      const cond = attrs[`_if_v$${ifIndex}`]
      const { context, slotContext } = vnode
      const cloneVnode = {
        context,
        slotContext,
        data: {
          attrs: { _hid }
        }
      }
      updateVnodeToMP(cloneVnode, '_if', cond)
    }
  }
}

export function afterCreateElement (vnode) {
  updateIfConditionsToMP(vnode)
}

function updateIfConditionsToMP (vnode) {
  const { data = {}, context } = vnode
  const { attrs = {}} = data
  for (const key in attrs) {
    if (/^_if_id/.test(key)) {
      const ifIndex = key.split('$')[1]
      const _hid = attrs[key]
      const cond = attrs[`_if_v$${ifIndex}`]
      context.$updateMPData('_if', cond, { data: { attrs: { _hid }}})
    }
  }
}

export function afterCreateElement (vnode) {
  const { data = {}, context } = vnode

  console.log('after', vnode, context)
  if (data._if) {
    data._if.forEach(e => {
      context.$updateMPData('if', e.v, {
        data: {
          hid: e.id
        }
      })
    })
  }
}

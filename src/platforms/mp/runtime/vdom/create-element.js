export function afterCreateElement (vnode) {
  const { data = {}, context } = vnode

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

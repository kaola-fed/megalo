export function createFindEventTypeFn (eventTypeMap) {
  return function findEventType (type) {
    let res = ''
    Object.keys(eventTypeMap)
      .some(mpType => {
        if (eventTypeMap[ mpType ].indexOf(type) > -1) {
          res = mpType
          return true
        }
      })
    return res
  }
}

export function mergePreset (presetA, presetB) {
  const res = Object.assign({}, presetA, presetB)
  const aVisitors = presetA.visitors || {}
  const bVisitors = presetB.visitors || {}
  const mergeVisitors = Object.assign({}, aVisitors, bVisitors)
  Object.assign(res, {
    visitors: mergeVisitors
  })

  return res
}

export function alterAttrName (el, oldName, newName) {
  const { attrsMap = {}, attrsList = [], attrs = [] } = el
  let indexInAttrs = -1
  let indexInAttrsList = -1

  attrs.some((attr, i) => {
    if (isSameAttrName(attr.name, oldName)) {
      indexInAttrs = i
      return true
    }
  })

  attrsList.some((attr, i) => {
    if (isSameAttrName(attr.name, oldName)) {
      indexInAttrsList = i
      return true
    }
  })

  if (indexInAttrs > -1) {
    const rawOldName = attrsList[indexInAttrsList].name
    const rawNewName = rawOldName.replace(oldName, newName)
    attrs[indexInAttrs].name = newName
    attrsList[indexInAttrsList].name = rawNewName

    const mapValue = attrsMap[rawOldName]
    delete attrsMap[rawOldName]
    attrsMap[rawNewName] = mapValue
  }
}

function isSameAttrName (oldName = '', newName = '') {
  return (
    oldName === newName ||
    oldName.replace(/:/, '') === newName.replace(/:/, '')
  )
}

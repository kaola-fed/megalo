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

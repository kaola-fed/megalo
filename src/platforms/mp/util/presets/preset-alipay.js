import { capitalize } from 'shared/util'

const prefix = `a:`

export const eventTypeMap = {
  tap: ['tap', 'click'],
  touchstart: ['touchStart'],
  touchmove: ['touchMove'],
  touchcancel: ['touchCancel'],
  touchend: ['touchEnd'],
  longtap: ['longTap'],
  input: ['input'],
  blur: ['change', 'blur'],
  submit: ['submit'],
  focus: ['focus'],
  scrolltoupper: ['scrollToUpper'],
  scrolltolower: ['scrollToLower'],
  scroll: ['scroll']
}

function findEventType (type) {
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

export default {
  prefix,
  ext: `axml`,
  directives: {
    if: `${prefix}if`,
    elseif: `${prefix}elif`,
    else: `${prefix}else`,
    for: `${prefix}for`,
    forItem: `${prefix}for-item`,
    forIndex: `${prefix}for-index`,
    forKey: `${prefix}key`,
    on: `bind`,
    onStop: `catch`,
    capture: `capture`
  },
  eventTypeMap,
  findEventType,
  genBind: function genBind (event, type, tag) {
    const { modifiers = {}} = event
    // const isCapture = /!/.test(type)
    const realType = type.replace(/^[~|!]/, '')
    const stop = modifiers.stop
    let mpType = findEventType(realType) || realType
    const binder = stop ? 'catch' : 'on'

    // capture is not supported yet in alipay
    // binder = isCapture ? `capture-${binder}` : binder

    if (type === 'change' && (tag === 'input' || tag === 'textarea')) {
      mpType = 'blur'
    }

    return `${binder}${capitalize(mpType)}`
  }
}

const prefix = `s-`

export const eventTypeMap = {
  tap: ['tap', 'click'],
  touchstart: ['touchstart'],
  touchmove: ['touchmove'],
  touchcancel: ['touchcancel'],
  touchend: ['touchend'],
  longtap: ['longtap'],
  input: ['input'],
  blur: ['change', 'blur'],
  submit: ['submit'],
  focus: ['focus'],
  scrolltoupper: ['scrolltoupper'],
  scrolltolower: ['scrolltolower'],
  scroll: ['scroll']
}

export function findEventType (type) {
  let res = ''
  Object.keys(this.eventTypeMap)
    .forEach(mpType => {
      if (this.eventTypeMap[ mpType ].indexOf(type) > -1) {
        res = mpType
      }
    })
  return res
}

export default {
  prefix,
  ext: `swan`,
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
  genBind (event, type, tag) {
    const { modifiers = {}} = event
    const isCapture = /!/.test(type)
    const realType = type.replace(/^[~|!]/, '')
    const { stop } = modifiers
    let mpType = realType
    let binder = stop ? 'catch' : 'bind'
    binder = isCapture ? `capture-${binder}` : binder

    if (type === 'change' && (tag === 'input' || tag === 'textarea')) {
      mpType = 'blur'
    } else {
      mpType = mpType === 'click' ? 'tap' : mpType
    }
    return `${binder}${mpType}`
  },
  visitors: {
    all (el) {
      if (el.tag === 'input') {
        el.isSelfCloseTag = true
      }
    }
  }
}

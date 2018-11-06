import { capitalize } from 'shared/util'
import { createFindEventTypeFn } from './helper'

const prefix = `a:`

export const eventTypeMap = {
  Tap: ['tap', 'click'],
  TouchStart: ['touchstart'],
  TouchMove: ['touchmove'],
  TouchCancel: ['touchcancel'],
  TouchEnd: ['touchend'],
  LongTap: ['longtap'],
  Input: ['input'],
  Change: ['change'],
  Changing: ['changing'],
  Blur: ['change', 'blur'],
  Clear: ['clear'],
  Submit: ['submit'],
  Focus: ['focus'],
  ScrollToUpper: ['scrolltoupper'],
  ScrollToLower: ['scrolltolower'],
  Scroll: ['scroll'],
  TransitionEnd: ['transitionend'],
  AnimationStart: ['animationstart'],
  AnimationIteration: ['animationiteration'],
  AnimationEnd: ['animationend'],
  Appear: ['appear'],
  Disappear: ['disappear'],
  FirstAppear: ['firstappear'],
  Reset: ['reset'],
  Confirm: ['confirm'],
  Load: ['load'],
  Error: ['error'],
  MarkerTap: ['markertap'],
  CalloutTap: ['callouttap'],
  ControlTap: ['controltap'],
  RegionChange: ['regionchange'],
  Messag: ['message'],
  PlusClick: ['plusclick'],
  TabClick: ['tabclick'],
  CardClick: ['cardclick'],
  GridItemClick: ['griditemclick'],
  ModalClick: ['ModalClick'],
  ModalClose: ['ModalClose'],
  TapMain: ['tapmain'],
  TapSub: ['tapsub'],
  CloseTap: ['closetap'],
  ButtonClick: ['buttonclick'],
  RightItemClick: ['rightitemclick'],
  Select: ['select'],
  MonthChange: ['monthchange']
}

export const findEventType = createFindEventTypeFn(eventTypeMap)

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

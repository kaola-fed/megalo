export const ROOT_DATA_VAR = '$root'
export const HOLDER_VAR = 'h'
export const SLOT_HOLDER_VAR = 's'
export const SCOPE_ID_VAR = 'd'
export const FOR_TAIL_VAR = '_t'
export const VM_ID_VAR = 'c'
export const VM_ID_PREFIX = 'cp'

export const VM_ID_SEP = 'v'
export const VM_ID_SEP_REG = /v/

export const LIST_TAIL_SEPS = {
  swan: '_',
  wechat: '-',
  alipay: '-'
}
export const LIST_TAIL_SEP_REG = /(\-|_)/

export const HOLDER_TYPE_VARS = {
  text: 't',
  vtext: 'vt',
  if: '_if',
  for: 'li',
  class: 'cl',
  rootClass: 'rcl',
  style: 'st',
  value: 'value',
  vhtml: 'html',
  vshow: 'vs',
  slot: 'slot'
}

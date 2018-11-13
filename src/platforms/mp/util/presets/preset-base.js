import { alterAttrName } from './helper'

export const basePrest = {
  visitors: {
    a (el) {
      alterAttrName(el, 'href', 'url')
    }
  }
}

/* @flow */

import Vue from 'core/index'
import { patch } from './patch'
// import config from 'core/config'
import { extend } from 'shared/util'
import { initMP } from 'mp/runtime/lifecycle/index'
import platformDirectives from './directives/index'
import { mountComponent } from 'core/instance/lifecycle'
import { createTextVNode, beforeCreateElement } from 'mp/runtime/vdom/index'
import {
  updateMPData,
  initVMToMP,
  afterRenderSlot,
  renderIf,
  afterRenderList
} from 'mp/runtime/instance/index'
import {
  aop,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement,
  getMPPlatform
} from 'mp/util/index'

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)

// install platform patch function
Vue.prototype.__patch__ = patch
Vue.prototype._v = createTextVNode
Vue.prototype._ri = renderIf
Vue.prototype.$updateMPData = updateMPData

Vue.prototype._l = aop(Vue.prototype._l, {
  after: afterRenderList
})

const oInit = Vue.prototype._init
Vue.prototype._init = function (options = {}) {
  if (!Vue.prototype._mpPlatform) {
    Vue.prototype._mpPlatform = getMPPlatform()
  }

  let { $mp } = options
  const { parent = {}, mpType = '' } = options
  $mp = $mp || parent.$mp
  if (!$mp && mpType) {
    initMP(this, options)
  } else if ($mp) {
    delete options.$mp
    this.$mp = $mp
    oInit.call(this, options)

    this._t = aop(this._t, {
      after: afterRenderSlot
    })

    this._c = aop(this._c, {
      before: beforeCreateElement
    })

    return this
  } else {
    oInit.call(this, options)
    return this
  }
}

// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  if (this.$mp) {
    const vm = mountComponent(this, undefined, undefined)
    initVMToMP(vm)
    return vm
  }
}

export default Vue

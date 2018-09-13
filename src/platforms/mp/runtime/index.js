/* @flow */

import Vue from 'core/index'
// import config from 'core/config'
import {
  extend
  // noop
} from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'

import { initMP } from 'mp/runtime/lifecycle/index'
import { updateMPData, initVMToMP, afterRenderSlot, renderIf, afterRenderList } from 'mp/runtime/instance/index'
import { createTextVNode, beforeCreateElement } from 'mp/runtime/vdom/index'
import { aop } from 'mp/util/index'

import {
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from 'mp/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
// import platformComponents from './components/index'

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
// extend(Vue.options.components, platformComponents)

// install platform patch function
Vue.prototype.__patch__ = patch
Vue.prototype._v = createTextVNode
Vue.prototype._ri = renderIf
Vue.prototype.$updateMPData = updateMPData

Vue.prototype._l = aop(Vue.prototype._l, {
  argsCount: 4,
  after: afterRenderList
})

const oInit = Vue.prototype._init
Vue.prototype._init = function (options) {
  let { $mp } = options
  const { parent = {}} = options
  $mp = $mp || parent.$mp
  if (!$mp) {
    initMP(this, options)
  } else {
    delete options.$mp
    this.$mp = $mp
    oInit.call(this, options)

    this._t = aop(this._t, {
      argsCount: 4,
      after: afterRenderSlot
    })

    this._c = aop(this._c, {
      argsCount: 6,
      before: beforeCreateElement
    })

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

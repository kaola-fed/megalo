/* @flow */

// import config from 'core/config'
// import { cached } from 'core/util/index'

import Vue from 'mp/runtime/index'
import { compileToFunctions } from 'mp/compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from 'mp/util/compat'

// const idToTemplate = cached(id => {
//   const el = query(id)
//   return el && el.innerHTML
// })

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  const options = this.$options
  // resolve template/el and convert to render function

  if (options && !options.render) {
    const template = options.template
    if (template) {
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments,
        imports: {
          test: { name: 'test' },
          test2: { name: 'test2' },
          test3: { name: 'test3' },
          child: { name: 'child' }
        },
        transformAssetUrls: {
          img: 'src'
        }
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns
    }
  }
  return mount.call(this, el, hydrating)
}

Vue.compile = compileToFunctions

export default Vue

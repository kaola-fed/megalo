import { createUpdateFn } from './update'

export * from './events'
export * from './update'
export * from './helper'
export * from './render-helpers/render-slot'
export * from './render-helpers/render-if'
export * from './render-helpers/render-list'

export function initRootVM (mpVM, opt = {}) {
  const { options } = opt
  let { Component } = opt
  if (typeof options === 'function') {
    Component = options
  }

  const _options = Object.assign({}, options, {
    mpVM,
    $mp: {
      page: mpVM,
      status: 'load',
      options: mpVM && mpVM.options,
      update: createUpdateFn(mpVM)
    }
  })

  const rootVM = new Component(_options)
  return rootVM
}

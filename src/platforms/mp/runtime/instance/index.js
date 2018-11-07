import { createUpdateFn } from './update'

export * from './events'
export * from './update'
export * from './helper'
export * from './render-helpers/render-slot'
export * from './render-helpers/render-if'
export * from './render-helpers/render-list'

export function initRootVM (mpVM, opt = {}) {
  const { options, Component, platform } = opt
  const mpVMOptions = mpVM && mpVM.options || {}
  const $mp = {
    platform,
    page: mpVM,
    status: 'load',
    query: mpVMOptions,
    options: mpVMOptions,
    _update: createUpdateFn(mpVM)
  }

  Object.assign(options, { $mp })

  const rootVM = new Component(options)

  return rootVM
}

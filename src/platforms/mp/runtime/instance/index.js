import { createUpdateFn } from './update'

export * from './events'
export * from './update'
export * from './helper'
export * from './render-helpers/render-slot'
export * from './render-helpers/render-if'
export * from './render-helpers/render-list'

export function initRootVM (mpVM, opt = {}) {
  const { options, Component, platform } = opt
  const { mpType } = options
  const mpVMOptions = mpVM && mpVM.options || {}
  const { update, instantUpdate } = createUpdateFn(mpVM)
  const $mp = {
    platform,
    status: 'load',
    query: mpVMOptions,
    options: mpVMOptions,
    _update: update,
    _instantUpdate: instantUpdate
  }

  if (mpType === 'app') {
    Object.assign($mp, { app: mpVM })
  } else {
    Object.assign($mp, { page: mpVM })
  }

  Object.assign(options, { $mp })

  const rootVM = new Component(options)

  return rootVM
}

import { createUpdateFn } from './update'

export * from './events'
export * from './update'
export * from './helper'
export * from './render-helpers/render-slot'
export * from './render-helpers/render-if'
export * from './render-helpers/render-list'

let app = null

export function initRootVM (mpVM, opt = {}, query = {}) {
  const { options, Component, platform } = opt
  const { mpType } = options
  const mpVMOptions = query
  const { update, instantUpdate, isEqualToBuffer } = createUpdateFn(mpVM)
  const $mp = {
    platform,
    status: 'load',
    query: mpVMOptions,
    options: mpVMOptions,
    _update: update,
    _instantUpdate: instantUpdate,
    _isEqualToBuffer: isEqualToBuffer
  }

  if (mpType === 'app') {
    app = mpVM
    Object.assign($mp, { app })
  } else {
    Object.assign($mp, {
      page: mpVM,
      app
    })
  }

  Object.assign(options, { $mp })

  const rootVM = new Component(options)

  return rootVM
}

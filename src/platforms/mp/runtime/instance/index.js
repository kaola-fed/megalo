import { createUpdateFn } from './update'

export * from './events'
export * from './update'
export * from './helper'
export * from './render-helpers/render-slot'
export * from './render-helpers/render-if'
export * from './render-helpers/render-list'

export function initRootVM (mpVM, opt = {}) {
  const { options } = opt
  const { Component } = opt
  const $mp = {
    page: mpVM,
    status: 'load',
    options: mpVM && mpVM.options,
    update: createUpdateFn(mpVM)
  }

  Object.assign(options, { $mp })

  const rootVM = new Component(options)

  return rootVM
}

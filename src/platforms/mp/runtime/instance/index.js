import { createUpdateFn } from './update'

export * from './events'
export * from './update'
export * from './helper'

export function initRootVM (mpVM, opt = {}) {
  const { Component, options } = opt

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

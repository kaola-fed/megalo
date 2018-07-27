import { Buffer } from 'mp/util/buffer'
import { throttle } from 'mp/util/throttle'

export * from './events'
export * from './update'
export * from './helper'

function isEmptyObj (obj = {}) {
  return Object.keys(obj).length === 0
}

export function initRootVM (mpVM, opt = {}) {
  const { Component, options } = opt
  const buffer = new Buffer()
  const throttleSetData = throttle(function () {
    const data = buffer.pop()

    if (!isEmptyObj(data)) {
      // console.log('setData', data)
      mpVM.setData(data)
    }
  }, 50, { leadingDelay: 0 })

  const _options = Object.assign({}, options, {
    mpVM,
    $mp: {
      page: mpVM,
      status: 'load',
      options: mpVM && mpVM.options,
      update (data) {
        buffer.push(data)
        throttleSetData()
      }
    }

  })

  const rootVM = new Component(_options)
  return rootVM
}

import page from './page'
import app from './app'

export {
  app,
  page
}

export function initMP (vm, options) {
  const { mpType = 'page' } = options
  const { _mpPlatform } = vm

  /* istanbul ignore else */
  if (mpType === 'app') {
    app.init({
      Component: vm.constructor,
      options,
      platform: _mpPlatform
    })
  } else if (mpType === 'page') {
    page.init({
      Component: vm.constructor,
      options,
      platform: _mpPlatform
    })
  }
}

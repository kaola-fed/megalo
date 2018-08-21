import page from './page'
import app from './app'

export {
  app,
  page
}

export function initMP (vm, options) {
  const { mpType } = options

  /* istanbul ignore else */
  if (mpType === 'app') {
    app.init({
      Component: vm.constructor,
      options
    })
  } else if (mpType === 'page') {
    page.init({
      Component: vm.constructor,
      options
    })
  }
}

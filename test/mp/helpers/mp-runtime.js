class MPBase {
  constructor (options) {
    this.data = {}
    Object.assign(this, options)
  }

  _init () {

  }

  _callHook (type, ...args) {
    const hook = this[type]
    if (type === 'onLoad') {
      this._onLoad(...args)
    }

    if (typeof hook === 'function') {
      return hook.call(this, ...args)
    }
  }

  _onLoad (options) {
    Object.assign(this, { options })
  }
}

class MPApp extends MPBase {
}

class MPPage extends MPBase {
  setData (data) {
    const paths = Object.keys(data)
    paths.forEach(path => {
      const val = data[path]
      const keys = path.split('.')
      let current = this.data
      keys.forEach((k, i) => {
        if (i === keys.length - 1) {
          current[k] = val
        } else if (!current[k]) {
          current[k] = {}
        }
        current = current[k]
      })
    })
  }
  _init () {
    this._callHook('onLoad', { query: { id: 100 }})
    setTimeout(() => {
      this._callHook('onReady')
    }, 100)
  }
  _show () {
    this._callHook('onShow')
  }
  _hide () {
    this._callHook('onHide')
  }
  _triggerEvent (el = {}, type) {
    const { dataset = {
      hid: '0',
      cid: '0'
    }, detail } = el

    Object.assign(el, {
      dataset
    })

    const $event = {
      type,
      currentTarget: el,
      target: el.target || el,
      detail
    }
    this._pe($event)
  }
}

let pageOptions = {}

export function Page (options) {
  pageOptions = options
}

Page.createInstance = function () {
  const instance = new MPPage(pageOptions)
  return instance
}

let appOptions = {}

export function App (options) {
  appOptions = options
}

App.createInstance = function () {
  const instance = new MPApp(appOptions)
  return instance
}

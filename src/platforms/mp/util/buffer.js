export class Buffer {
  constructor () {
    this.buff = {}
  }

  push (data) {
    Object.assign(this.buff, data)
  }

  pop () {
    const data = Object.assign({}, this.buff)
    this.buff = {}
    return data
  }
  shouldUpdateBuffer(key, value) {
    if (!this.has(key)) {
      return false
    }
    return !this.isEqual(key, value)
  }

  isEqual (key, value) {
    return this.buff[key] !== undefined && this.buff[key] === value
  }
  has (key) {
    return this.buff.hasOwnProperty(key)
  }
}

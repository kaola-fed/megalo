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
}

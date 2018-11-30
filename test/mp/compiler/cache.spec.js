
import { compileToTemplate } from 'mp/compiler'

describe('cache', () => {
  it('should use cache', () => {
    const template = '<div>test</div>'
    const compiled1 = compileToTemplate(template, {
      realResourcePath: './test.vue',
      md5: 1000
    })
    const compiled2 = compileToTemplate(template, {
      realResourcePath: './test.vue',
      md5: 1000
    })

    expect(compiled1).toEqual(compiled2)
  })

  it('should use update cache', () => {
    const template1 = '<div>test</div>'
    const template2 = '<div>test2</div>'
    const compiled1 = compileToTemplate(template1, {
      realResourcePath: './test.vue',
      md5: 1000
    })
    const compiled2 = compileToTemplate(template2, {
      realResourcePath: './test.vue',
      md5: 1002
    })

    expect(compiled1).not.toEqual(compiled2)
  })
})

const { compile, generateWXML } = require('../../../packages/megalo-template-compiler')

function assertCodegen (template, assertTemplate, options, parmas = {}) {
  // const { errors = [], mpErrors = [], slots = {}} = parmas
  const compiled = compile(template, {})
  const output = generateWXML(compiled.ast, options)
  // expect(output.compiled.mpErrors).toEqual(mpErrors)
  // expect(output.compiled.errors).toEqual(errors)

  // expect(JSON.stringify(output.slots)).toEqual(JSON.stringify(slots))
  expect(output).toEqual(assertTemplate)
  // expect(output.code.replace(/\n/g, '')).toMatch(strToRegExp(assertTemplate))
}

describe('base tag', () => {
  it('div', () => {
    assertCodegen(
      `<div></div>`,
      `<view class="_div"></view>`,
      { }
    )
  })
})

/* @flow */

import { baseOptions } from './options'
import { createCompiler } from './create-compiler'
import { compileToTemplate as doCompileToTemplate } from './codegen/compile-to-template'

const { compile, compileToFunctions } = createCompiler(baseOptions)

function compileToTemplate (template, options) {
  const compiled = compile(template, options)
  const result = doCompileToTemplate(compiled.ast, options)
  return result
}

export { compile, compileToFunctions, compileToTemplate }

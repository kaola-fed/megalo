/* @flow */

import { baseOptions } from './options'
import { createCompiler } from './create-compiler'
import { compileToTemplate } from './codegen/compile-to-template'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions, compileToTemplate }

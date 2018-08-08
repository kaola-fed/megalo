/* @flow */

import { baseOptions } from './options'
import { createCompiler } from './create-compiler'
import { generateTemplate } from './codegen/generate-template'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions, generateTemplate }

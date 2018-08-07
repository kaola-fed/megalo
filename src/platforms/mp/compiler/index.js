/* @flow */

import { baseOptions } from './options'
import { createCompiler } from './create-compiler'
import { generateWXML } from './codegen/compile-wxml'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions, generateWXML }

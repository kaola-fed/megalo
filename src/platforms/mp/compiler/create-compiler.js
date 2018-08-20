/* @flow */

import { parse } from 'compiler/parser/index'
import { optimize } from 'compiler/optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from 'compiler/create-compiler'
import { mpify } from './mpify-ast'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  const ast = parse(template.trim(), options)
  optimize(ast, options)
  mpify(ast)
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})

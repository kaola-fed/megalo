/* @flow */

import { parse } from 'compiler/parser/index'
import { optimize } from 'compiler/optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from 'compiler/create-compiler'
import { mpify } from './mpify/pre'

const templateCache = {}

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  const { realResourcePath, md5 } = options
  const templateTrimed = template.trim()

  const cache = templateCache[realResourcePath]
  if (md5 && cache && cache.md5 === md5) {
    return cache.data
  }

  const ast = parse(templateTrimed, options)
  optimize(ast, options)
  mpify(ast, options)
  const code = generate(ast, options)
  const data = {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }

  if (md5 && realResourcePath) {
    templateCache[realResourcePath] = {
      data,
      md5
    }
  }

  return data
})

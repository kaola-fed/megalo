/* @flow */

import * as nodeOps from 'mp/runtime/node-ops'
import { createPatchFunction } from 'mp/runtime/vdom/index'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'mp/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

export const patch: Function = createPatchFunction({ nodeOps, modules })

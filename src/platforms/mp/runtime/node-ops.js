/* @flow */
import { updateVnodeToMP } from './instance/index'
import { HOLDER_TYPE_VARS } from 'mp/util/index'

export function createElement (tagName: string, vnode: VNode): Element {
  return {
    on: {

    }
  }
}

export /* istanbul ignore next */ function createElementNS (namespace: string, tagName: string): Element {
  return {}
}

export function createTextNode (text: string, vnode: VNode): Text {
  updateVnodeToMP(vnode, HOLDER_TYPE_VARS.text, text)
  return {
    text
  }
}

export function createComment (text: string): Comment {
  return {
    text
  }
}

export function insertBefore (parentNode: Node, newNode: Node, referenceNode: Node) {
}

export function removeChild (node: Node, child: Node) {
}

export function appendChild (node: Node, child: Node) {
}

export function parentNode (node: Node): ?Node {
  return {}
}

export function nextSibling (node: Node): ?Node {
  return {}
}

export /* istanbul ignore next */ function tagName (node: Element): string {
  return '#'
}

export function setTextContent (node: Node, text: string, vnode: VNode) {
  updateVnodeToMP(vnode, HOLDER_TYPE_VARS.text, text)
  return {}
}

export /* istanbul ignore next */ function setStyleScope (node: Element, scopeId: string, vnode: VNode) {
  return {}
}

export /* istanbul ignore next */ function setAttribute (node: Element, scopeId: string, v: string, vnode: VNode) {
  return {}
}

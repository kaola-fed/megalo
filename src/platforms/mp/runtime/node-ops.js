/* @flow */
import { updateVnodeToMP } from './instance/index'

export function createElement (tagName: string, vnode: VNode): Element {
  return {
    on: {

    }
  }
}

export function createElementNS (namespace: string, tagName: string): Element {
  return {
    on: {

    }
  }
}

export function createTextNode (text: string, vnode: VNode): Text {
  updateVnodeToMP(vnode, 't', text)
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

export function tagName (node: Element): string {
  return '#'
}

export function setTextContent (node: Node, text: string, vnode: VNode) {
  updateVnodeToMP(vnode, 't', text)
  return {}
}

export function setStyleScope (node: Element, scopeId: string, vnode: VNode) {
  // console.log('setStyleScope', vnode)
  return {}
}

export function setAttribute (node: Element, scopeId: string, v: string, vnode: VNode) {
  // console.log('setAttribute', vnode)
  return {}
}

/* @flow */

export function createElement (tagName: string, vnode: VNode): Element {
  return {}
}

export function createElementNS (namespace: string, tagName: string): Element {
  return {}
}

export function createTextNode (text: string, vnode: VNode): Text {
  const { context } = vnode
  context && context.$updateMPData('t', text, vnode)
  return {}
}

export function createComment (text: string): Comment {
  return {}
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
  const { context } = vnode
  context.$updateMPData('t', text, vnode)
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

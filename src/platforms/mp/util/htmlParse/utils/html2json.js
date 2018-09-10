/**
 * html2Json 改造来自: https://github.com/Jxck/html2json
 *
 */
import * as wxDiscode from './wxDiscode'
import HTMLParser from './htmlparser'
const __placeImgeUrlHttps = 'https'
const __emojisReg = ''
const __emojisBaseSrc = ''
const __emojis = {}
// let wxDiscode = require('./wxDiscode.js');
// let HTMLParser = require('./htmlparser.js');
// Empty Elements - HTML 5
// let empty = makeMap('area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr')
// Block Elements - HTML 5
const block = makeMap('br,a,code,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video')

// Inline Elements - HTML 5
const inline = makeMap('abbr,acronym,applet,b,basefont,bdo,big,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,let')

// Elements that you can, intentionally, leave open
// (and which close themselves)
const closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr')

// Attributes that have their values filled in disabled="disabled"
// let fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected')

// Special Elements (can contain anything)
// let special = makeMap('wxxxcode-style,script,style,view,scroll-view,block')

function makeMap (str) {
  const obj = {}
  const items = str.split(',')
  for (let i = 0; i < items.length; i++) { obj[items[i]] = true }
  return obj
}

// function q (v) {
//   return '"' + v + '"'
// }

function removeDOCTYPE (html) {
  return html
    .replace(/<\?xml.*\?>\n/, '')
    .replace(/<.*!doctype.*\>\n/, '')
    .replace(/<.*!DOCTYPE.*\>\n/, '')
}

function trimHtml (html) {
  return html
    .replace(/\r?\n+/g, '')
    .replace(/<!--.*?-->/ig, '')
    .replace(/\/\*.*?\*\//ig, '')
    .replace(/[ ]+</ig, '<')
}

function html2json (html, bindName) {
  // 处理字符串
  html = removeDOCTYPE(html)
  html = trimHtml(html)
  html = wxDiscode.strDiscode(html)
  // 生成node节点
  const bufArray = []
  const results = {
    node: bindName,
    nodes: [],
    images: [],
    imageUrls: []
  }
  let index = 0
  HTMLParser(html, {
    start: function (tag, attrs, unary) {
      // debug(tag, attrs, unary);
      // node for this element
      const node = {
        node: 'element',
        tag: tag
      }

      if (bufArray.length === 0) {
        node.index = index.toString()
        index += 1
      } else {
        const parent = bufArray[0]
        if (parent.nodes === undefined) {
          parent.nodes = []
        }
        node.index = parent.index + '.' + parent.nodes.length
      }

      if (block[tag]) {
        node.tagType = 'block'
      } else if (inline[tag]) {
        node.tagType = 'inline'
      } else if (closeSelf[tag]) {
        node.tagType = 'closeSelf'
      }

      if (attrs.length !== 0) {
        node.attr = attrs.reduce(function (pre, attr) {
          const name = attr.name
          let value = attr.value
          if (name === 'class') {
            // console.dir(value);

            //  value = value.join("")
            node.classStr = value
          }
          // has multi attibutes
          // make it array of attribute
          if (name === 'style') {
            // console.dir(value);
            //  value = value.join("")
            node.styleStr = value
          }
          if (value.match(/ /)) {
            value = value.split(' ')
          }

          // if attr already exists
          // merge it
          if (pre[name]) {
            if (Array.isArray(pre[name])) {
              // already array, push to last
              pre[name].push(value)
            } else {
              // single value, make it array
              pre[name] = [pre[name], value]
            }
          } else {
            // not exist, put it
            pre[name] = value
          }

          return pre
        }, {})
      }

      // 对img添加额外数据
      if (node.tag === 'img') {
        node.imgIndex = results.images.length
        let imgUrl = node.attr.src
        if (imgUrl[0] === '') {
          imgUrl.splice(0, 1)
        }
        imgUrl = wxDiscode.urlToHttpUrl(imgUrl, __placeImgeUrlHttps)
        node.attr.src = imgUrl
        node.from = bindName
        // node.bindtap = test;
        results.images.push(node)
        results.imageUrls.push(imgUrl)
      }

      // 处理font标签样式属性
      if (node.tag === 'font') {
        const fontSize = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '-webkit-xxx-large']
        const styleAttrs = {
          'color': 'color',
          'face': 'font-family',
          'size': 'font-size'
        }
        if (!node.attr.style) node.attr.style = []
        if (!node.styleStr) node.styleStr = ''
        for (const key in styleAttrs) {
          if (node.attr[key]) {
            const value = key === 'size' ? fontSize[node.attr[key] - 1] : node.attr[key]
            node.attr.style.push(styleAttrs[key])
            node.attr.style.push(value)
            node.styleStr += styleAttrs[key] + ': ' + value + ';'
          }
        }
      }

      // 临时记录source资源
      if (node.tag === 'source') {
        results.source = node.attr.src
      }

      if (unary) {
        // if this tag doesn't have end tag
        // like <img src="hoge.png"/>
        // add to parents
        const parent = bufArray[0] || results
        if (parent.nodes === undefined) {
          parent.nodes = []
        }
        parent.nodes.push(node)
      } else {
        bufArray.unshift(node)
      }
    },
    end: function (tag) {
      // debug(tag);
      // merge into parent tag
      const node = bufArray.shift()
      if (node.tag !== tag) console.error('invalid state: mismatch end tag')

      // 当有缓存source资源时于于video补上src资源
      if (node.tag === 'video' && results.source) {
        node.attr.src = results.source
        delete results.source
      }

      if (bufArray.length === 0) {
        results.nodes.push(node)
      } else {
        const parent = bufArray[0]
        if (parent.nodes === undefined) {
          parent.nodes = []
        }
        parent.nodes.push(node)
      }
    },
    chars: function (text) {
      // debug(text);
      const node = {
        node: 'text',
        text: text,
        textArray: transEmojiStr(text)
      }

      if (bufArray.length === 0) {
        node.index = index.toString()
        index += 1
        results.nodes.push(node)
      } else {
        const parent = bufArray[0]
        if (parent.nodes === undefined) {
          parent.nodes = []
        }
        node.index = parent.index + '.' + parent.nodes.length
        parent.nodes.push(node)
      }
    },
    comment: function (text) {
      // debug(text);
      // let node = {
      //     node: 'comment',
      //     text: text,
      // };
      // let parent = bufArray[0];
      // if (parent.nodes === undefined) {
      //     parent.nodes = [];
      // }
      // parent.nodes.push(node);
    }
  })
  return results
};

function transEmojiStr (str) {
  // let eReg = new RegExp("["+__reg+' '+"]");
//   str = str.replace(/\[([^\[\]]+)\]/g,':$1:')

  const emojiObjs = []
  // 如果正则表达式为空
  if (__emojisReg.length === 0 || !__emojis) {
    const emojiObj = {}
    emojiObj.node = 'text'
    emojiObj.text = str
    array = [emojiObj]
    return array
  }
  // 这个地方需要调整
  str = str.replace(/\[([^\[\]]+)\]/g, ':$1:')
  const eReg = new RegExp('[:]')
  let array = str.split(eReg)
  for (let i = 0; i < array.length; i++) {
    const ele = array[i]
    const emojiObj = {}
    if (__emojis[ele]) {
      emojiObj.node = 'element'
      emojiObj.tag = 'emoji'
      emojiObj.text = __emojis[ele]
      emojiObj.baseSrc = __emojisBaseSrc
    } else {
      emojiObj.node = 'text'
      emojiObj.text = ele
    }
    emojiObjs.push(emojiObj)
  }

  return emojiObjs
}

export default html2json


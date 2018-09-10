/**
 *
 * htmlParser改造自: https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
 *
 */
// Regular Expressions for parsing tags and attributes
const startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/
const endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/
const attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g

// Empty Elements - HTML 5
const empty = makeMap('area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr')

// Block Elements - HTML 5
const block = makeMap('a,address,code,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video')

// Inline Elements - HTML 5
const inline = makeMap('abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,let')

// Elements that you can, intentionally, leave open
// (and which close themselves)
const closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr')

// Attributes that have their values filled in disabled="disabled"
const fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected')

// Special Elements (can contain anything)
const special = makeMap('wxxxcode-style,script,style,view,scroll-view,block')

function HTMLParser (html, handler) {
  let index
  let chars
  let match
  const stack = []
  let last = html
  stack.last = function () {
    return this[this.length - 1]
  }
  // console.log('要处理的html是', html)
  while (html) {
    chars = true
    // console.log('stack.last是', stack.last());
    // Make sure we're not in a script or style element
    if (!stack.last() || !special[stack.last()]) {
      // Comment
      if (html.indexOf('<!--') === 0) {
        index = html.indexOf('-->')

        if (index >= 0) {
          if (handler.comment) { handler.comment(html.substring(4, index)) }
          html = html.substring(index + 3)
          chars = false
        }

        // end tag
      } else if (html.indexOf('</') === 0) {
        match = html.match(endTag)

        if (match) {
          html = html.substring(match[0].length)
          match[0].replace(endTag, parseEndTag) // /这句话干嘛用的？
          // console.log('替换完成后的match[0]是', match[0]);
          chars = false
        }

        // start tag
      } else if (html.indexOf('<') === 0) {
        match = html.match(startTag)
        // console.log('match的是', match);
        if (match) {
          html = html.substring(match[0].length)
          // console.log('replace前的是', match[0])
          match[0].replace(startTag, parseStartTag)
          // console.log('replace后的是', match[0])
          chars = false
        }
      }

      if (chars) {
        index = html.indexOf('<')
        let text = ''
        while (index === 0) {
          text += '<'
          html = html.substring(1)
          index = html.indexOf('<')
        }
        text += index < 0 ? html : html.substring(0, index)
        html = index < 0 ? '' : html.substring(index)

        if (handler.chars) { handler.chars(text) }
      }
    } else {
      html = html.replace(new RegExp('([\\s\\S]*?)<\/' + stack.last() + '[^>]*>'), function (all, text) {
        text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, '$1$2')
        if (handler.chars) { handler.chars(text) }

        return ''
      })
      // console.log('先执行了这一步,html是', html);

      parseEndTag('', stack.last())
    }

    if (html === last) {
      throw new Error(`parse error${html}`)
    }
    last = html
  }

  // Clean up any remaining tags
  parseEndTag()

  function parseStartTag (tag, tagName, rest, unary) {
    tagName = tagName.toLowerCase()

    if (block[tagName]) {
      while (stack.last() && inline[stack.last()]) {
        parseEndTag('', stack.last())
      }
    }

    if (closeSelf[tagName] && stack.last() === tagName) {
      parseEndTag('', tagName)
    }

    unary = empty[tagName] || !!unary

    if (!unary) { stack.push(tagName) }

    if (handler.start) {
      const attrs = []
      // console.log('rest是', rest);
      rest.replace(attr, function (match, name) {
        // console.log('match是', match);
        // console.log('name是', name);
        // console.log('arguments是',arguments.length)
        const value = arguments[2] ? arguments[2]
          : arguments[3] ? arguments[3]
            : arguments[4] ? arguments[4]
              : fillAttrs[name] ? name : ''
        // console.log('value是', value);
        attrs.push({
          name: name,
          value: value,
          escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') // "
        })
      })

      if (handler.start) {
        handler.start(tagName, attrs, unary)
      }
    }
  }

  function parseEndTag (tag, tagName) {
    // If no tag name is provided, clean shop
    let pos = 0
    if (!tagName) pos = 0
    // Find the closest opened tag of the same type
    else {
      tagName = tagName.toLowerCase()
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos] === tagName) { break }
      }
    }
    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (handler.end) { handler.end(stack[i]) }
      }

      // Remove the open elements from the stack
      stack.length = pos
    }
  }
};

function makeMap (str) {
  const obj = {}
  const items = str.split(',')
  for (let i = 0; i < items.length; i++) { obj[items[i]] = true }
  return obj
}

// module.exports = HTMLParser;
export default HTMLParser

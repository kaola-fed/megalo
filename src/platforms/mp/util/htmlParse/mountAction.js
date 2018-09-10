
// 图片点击事件
function maxParseImgTap (e) {
  console.log('触发了点击事件！！！', e.currentTarget)
}
// / a 跳转事件
function maxParseTagATap (e) {
  const href = e.currentTarget.dataset.src
  console.log(href)
}
// / 默认事件
function defaultEvent (e) {
  console.log('no specific event!')
}
// ///eventMap增加事件
function addEvent2EventMap (eventMap, opt) {
  if (opt.filter) {
    if (opt.filter.startsWith('#')) {
      const id = opt.filter.slice(1)
      console.log('在这里, id是', id)
      console.log('opt.events是', opt.events)
      if (!eventMap['id'][id]) {
        eventMap['id'][id] = {}
        // eventMap['id'][id] = Object.assign(eventMap['id'][id], opt.events);
      }
      eventMap['id'][id] = Object.assign(eventMap['id'][id], opt.events)
      console.log('map是', eventMap['id'])
    } else if (opt.filter.startsWith('.')) {
      const className = opt.filter.slice(1)
      if (!eventMap['class'][className]) {
        eventMap['class'][className] = {}
        // eventMap['class'][className] = Object.assign(eventMap['class'][className], opt.events);
      }
      eventMap['class'][className] = Object.assign(eventMap['class'][className], opt.events)
    }
  } else if (!opt.filter) {
    eventMap['base'] = Object.assign(eventMap['base'], opt.events)
    console.log('eventMap是', eventMap)
  }
}
function findClassInRule (ruleClass, classStr) {
  let res = ''
  if (!classStr) { return res }
  const classArray = classStr.split(' ')
  const length = classArray.length
  for (let i = length - 1; i >= 0; i--) {
    const className = classArray[i].slice(1)
    if (ruleClass[className]) {
      res = className
      break
    }
  }
  return res
}
// ///返回默认方法
function defaultEventName (e) {
  // console.log('这是默认方法', e)
  switch (e.type) {
    case 'tap' :
      if (e.currentTarget.dataset.tag === 'img') {
        maxParseImgTap(e)
      } else if (e.currentTarget.dataset.tag === 'a') {
        // console.log('走到了这里')
        maxParseTagATap(e)
      }
      break
    default: defaultEvent(e)
  }
}
// //生成挂载代理事件
function generateAgentFunc (optionArray) {
  const rule = {}
  if (Array.isArray(optionArray)) {
    optionArray.forEach(opt => {
      if (!rule[opt.tag]) {
        rule[opt.tag] = {
          base: {},
          class: {},
          id: {}
        }
        addEvent2EventMap(rule[opt.tag], opt)
      } else {
        addEvent2EventMap(rule[opt.tag], opt)
      }
    })
  }
  return function (e) {
    const dataset = e.currentTarget.dataset
    if (dataset && rule[dataset.tag]) {
      if (rule[dataset.tag]['id'][dataset.id]) {
        rule[dataset.tag]['id'][dataset.id][e.type](e)
      } else if (findClassInRule(rule[dataset.tag]['class'], dataset.class)) {
        const className = findClassInRule(rule[dataset.tag]['class'], dataset.class)
        rule[dataset.tag]['class'][className][e.type](e)
      } else if (typeof rule[dataset.tag]['base'][e.type] === 'function') {
        rule[dataset.tag]['base'][e.type](e)
      } else {
        defaultEventName(e)
      }
    } else {
      return defaultEventName(e)
    }
  }
}
// ///事件挂载函数
function mountAction (wx, optionArray) {
  // mountDefaultAction(wx);  ////挂载默认事件
  // registerEvent2Page(wx, optionArray);  ////在page上注册所有的事件
  const agentFunc = generateAgentFunc(optionArray)
  wx.agentFunc = agentFunc  // //注册代理事件
}
// module.exports = {
//     mountAction: mountAction
// }
export default mountAction

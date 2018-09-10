
/**
 * utils函数引入
 **/
import html2json from './utils/html2json'
/**
 * 配置及公有属性
 **/
// var realWindowWidth = 0;
// var realWindowHeight = 0;
// wx.getSystemInfo({
//   success: function (res) {
//     realWindowWidth = res.windowWidth
//     realWindowHeight = res.windowHeight
//   }
// })

/**
 * 主函数入口区
 **/
function maxParse ({ type = 'html', data = '<div class="color:red;">数据不能为空</div>' }) {
  var transData = {}// 存放转化后的数据
  let res = {}  // 返回的数据
  if (type === 'html') {
    transData = html2json(data, 'root')
  }
  res = transData
  return res
}
// module.exports = {
//   maxParse: maxParse
// }
export default maxParse


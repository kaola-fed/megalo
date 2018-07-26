/**
 * 频率控制 返回函数连续调用时，func 执行频率限定为 次 / wait
 *
 * @param  {function}   func      传入函数
 * @param  {number}     wait      表示时间窗口的间隔
 * @param  {object}     [options] 如果想忽略开始边界上的调用，传入{leading: false}。
 * @param  {boolean}    [options.leading=true] 如果想忽略开始边界上的调用，传入{leading: false}。
 * @param  {number|boolean}    [options.leadingDelay=false] 开始边界上的调用延时，传入{leadingDelay: 0}。
 * @param  {boolean}    [options.trailing=true] 如果想忽略结尾边界上的调用，传入{trailing: false}
 *
 * @return {Function}
 *
 * @example
 * const throttleCallback = throttle(callback, 100);
 *
 */
export function throttle (func, wait, options = {}) {
  let context, args, result
  let timeout = null
  const leadingDelay = options.leadingDelay === undefined ? false : options.leadingDelay
  // 上次执行时间点
  let previous = 0
  // 延迟执行函数
  const later = function () {
    // 若设定了开始边界不执行选项，上次执行时间始终为0
    previous = options.leading === false ? 0 : (+new Date())
    timeout = null
    // $flow-disable-line
    result = func.apply(context, args)
    if (!timeout) {
      context = args = null
    }
  }
  return function () {
    const now = (+new Date())
    // 首次执行时，如果设定了开始边界不执行选项，将上次执行时间设定为当前时间。
    if (!previous && options.leading === false) {
      previous = now
    }
    // 延迟执行时间间隔
    const remaining = wait - (now - previous)
    context = this
        args = arguments; // eslint-disable-line
    // 延迟时间间隔remaining小于等于0，表示上次执行至此所间隔时间已经超过一个时间窗口
    // remaining大于时间窗口wait，表示客户端系统时间被调整过
    if (remaining <= 0 || remaining > wait) {
      clearTimeout(timeout)
      timeout = null
      previous = now
      if (leadingDelay === false) {
        result = func.apply(context, args)
      } else {
        setTimeout(() => {
          result = func.apply(context, args)
        }, leadingDelay)
      }
      if (!timeout) {
        context = args = null
      }
      // 如果延迟执行不存在，且没有设定结尾边界不执行选项
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
};

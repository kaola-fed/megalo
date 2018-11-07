export function getMPPlatform () {
  let platform = ''
  try {
    /* eslint-disable */
    if (!platform && wx) {
      platform = 'wechat'
    }
    /* eslint-enable */
  } catch (e) {}
  try {
    /* eslint-disable */
    if (!platform && my) {
      platform = 'alipay'
    }
    /* eslint-enable */
  } catch (e) {}
  try {
    /* eslint-disable */
    if (!platform && swan) {
      platform = 'swan'
    }
    /* eslint-enable */
  } catch (e) {}
  return platform || 'unknown'
}

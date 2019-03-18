export function getMPPlatform () {
  let platform = ''
  /* eslint-disable */
  if (!platform) {
    platform = (
      typeof tt !== 'undefined' ? 'toutiao' :
      typeof swan !== 'undefined' ? 'swan' :
      typeof my !== 'undefined' ? 'alipay' :
      typeof wx !== 'undefined' ? 'wechat' :
      'unknown'
    )
  }
  return platform
}
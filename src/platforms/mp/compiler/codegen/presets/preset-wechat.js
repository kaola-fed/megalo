const prefix = `wx:`

export default {
  prefix,
  ext: `wxml`,
  directives: {
    if: `${prefix}if`,
    elseif: `${prefix}elif`,
    else: `${prefix}else`,
    for: `${prefix}for`,
    forItem: `${prefix}for-item`,
    forIndex: `${prefix}for-index`,
    key: `${prefix}key`,
    on: `bind`,
    onstop: `bindcatch`
  }
}

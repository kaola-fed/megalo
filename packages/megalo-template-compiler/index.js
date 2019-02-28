debugger
let megaloVersion
try {
  megaloVersion = require('megalo/package.json').version
} catch (e) {
  megaloVersion = require('../../package.json').version
}

let packageName = require('./package.json').name
let packageVersion = require('./package.json').version

console.log(`using ${packageName}@${packageVersion}`)
console.log(`using megalo@${megaloVersion}`)

if (megaloVersion && megaloVersion !== packageVersion) {
  throw new Error(
    '\n\nMegalo packages version mismatch:\n\n' +
    '- megalo@' + megaloVersion + '\n' +
    '- ' + packageName + '@' + packageVersion + '\n\n' +
    'This may cause things to work incorrectly. Make sure to use the same version for both.\n'
  )
}

module.exports = require('./build')

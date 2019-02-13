var base = require('./karma.base.config.js')

process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function (config) {
  var options = Object.assign(base, {
    browsers: ['ChromeHeadless'],
    // reporters: ['mocha', 'coverage'],
    reporters: ['mocha', 'coverage'],
    coverageReporter: {
      reporters: [
        { type: 'lcov', dir: '../../coverage', subdir: '.' },
        { type: 'text-summary', dir: '../../coverage', subdir: '.' }
      ]
    },
    logLevel: config.LOG_DEBUG,
    singleRun: true,
    plugins: base.plugins.concat([
      'karma-coverage',
      'karma-chrome-launcher'
    ])
  })

  // add babel-plugin-istanbul for code instrumentation
  options.webpack.module.rules[0].options = {
    plugins: [['istanbul', {
      exclude: [
        'test/',
        'src/sfc/deindent.js',
        'src/core',
        'src/compiler',
        'src/platforms/weex/',
        'src/platforms/web/',
        'src/platforms/mp/compiler/util.js',
        'src/web/compiler/util.js',
        'src/shared'
      ]
    }]]
  }

  config.set(options)
}

var base = require('./karma.base.config.js')

module.exports = function (config) {
  config.set(Object.assign(base, {
    browsers: ['PhantomJS'],
    reporters: ['jasmine-diff', 'progress'],
    plugins: base.plugins.concat([
      'karma-phantomjs-launcher',
      'karma-jasmine-diff-reporter'
    ]),
    jasmineDiffReporter: {
      pretty: true,
      multiline: true
    }
  }))
}

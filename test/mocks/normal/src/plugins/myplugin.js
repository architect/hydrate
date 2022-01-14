let { join } = require('path')

module.exports = {
  set: {
    customLambdas: function () {
      return {
        name: 'a-custom-lambda',
        src: join('src', 'myplugin', 'newlambda'),
      }
    }
  }
}

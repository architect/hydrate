let { join } = require('path')

module.exports = {
  set: {
    customLambdas: function () {
      return {
        name: 'a-custom-lambda',
        src: join('src', 'myplugin', 'newlambda'),
      }
    }
  },
  hydrate: {
    copy: async ({ copy }) => {
      await copy({
        source: join('src', '1.md')
      })
      await copy({
        source: join('src', '2.md'),
        target: 'plugin-file-2.md',
      })
      await copy([
        {
          source: join('src', '3.md'),
          target: join('plugin-folder-1', 'plugin-file-3.md'),
        },
        {
          source: join('src', '4.md'),
          target: join('plugin-folder-2', 'subfolder', 'plugin-file-4.md'),
        }
      ])
    }
  }
}

let { join } = require('path')

module.exports = {
  pluginFunctions: function myPluginFunctions ({ arc, inventory }) {
    if (!arc['myplugin']) return []
    let lambdae = arc['myplugin']
    if (!lambdae || (Array.isArray(lambdae) && lambdae.length === 0)) return [];
    const cwd = inventory.inv._project.src;
    return lambdae.map(lambda => {
      return {
        src: join(cwd, 'src', 'myplugin', lambda),
        body: `exports.handler = async function (event) {
  console.log(event);
}`
      };
    });
  },
}

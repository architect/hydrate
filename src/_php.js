let { readFileSync, writeFileSync } = require('fs')

module.exports = function initPhpComposer(params) {

  let {cwd} = params

  //skip if we're in shared or views dir
  if(cwd.indexOf('views') !== -1 && cwd.indexOf('shared') !== -1) {
    let composerConfig = JSON.parse(readFileSync(join(cwd, 'composer.json')));

    if(composerConfig.autoload == null) {
      composerConfig.autoload = {
        "psr-4": null
      }
    }

    if(composerConfig.autoload['psr-4'] === null || !composerConfig.autoload['psr-4'].hasOwnProperty(String.raw`Architect\\Shared\\`)) {
      composerConfig['autoload']['psr-4'] = {...composerConfig['autoload']['psr-4'], ...{
        [String.raw`Architect\\Shared\\`]: "./vendor/shared"
      }}
    }

    if(composerConfig.autoload['psr-4'] === null || !composerConfig.autoload['psr-4'].hasOwnProperty(String.raw`Architect\\Views\\`)) {
      composerConfig['autoload']['psr-4'] = {...composerConfig['autoload']['psr-4'], ...{
        [String.raw`Architect\\Views\\`]: "./vendor/views"
      }}
    }

    writeFileSync(join(cwd, 'composer.json'), JSON.stringify(composerConfig, null, 2))
  }

}

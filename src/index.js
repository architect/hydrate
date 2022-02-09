let hydrate = require('./hydrate')
let shared = require('./shared')

module.exports = {
  install: hydrate.bind({}, true),
  update: hydrate.bind({}, false),
  shared,
}

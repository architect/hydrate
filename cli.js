#!/usr/bin/env node
let hydrate = require('.')

async function cmd(/*opts*/) {
  // TODO parse opts here..
  return hydrate()
}

module.exports = cmd

// allow direct invoke
if (require.main === module) {
  (async function() {
    await cmd(process.argv)
  })();
}

const { test } = require('node:test')
const assert = require('node:assert')
let { join } = require('path')
let { readFileSync } = require('fs')
let {
  reset,
  checkFolderCreation,
  rubyFunctions,
  nodeFunctions,
  mockTmp,
} = require('../_shared')
let hydrate = require('../../..')
process.env.CI = true // Suppresses tape issues with progress indicator

test(`[Default (file copying)] update() bumps installed dependencies to newer versions`, async () => {
  await new Promise((resolve) => {
    reset(function () {
      // TODO: pip requires manual locking (via two requirements.txt files) so
      // we dont test update w/ python
      hydrate.update(undefined, function (err) {
        if (err) assert.fail(err)
        let pkgLock = JSON.parse(readFileSync(join(mockTmp, nodeFunctions[0], 'package-lock.json')))
        let newVersion = [ 2, 3 ].includes(pkgLock.lockfileVersion)
          ? pkgLock.packages['node_modules/tiny-json-http'].version
          : pkgLock.dependencies['tiny-json-http'].version
        assert.notStrictEqual(newVersion, '7.0.2', `get-index tiny-json-http bumped to ${newVersion} from 7.0.2`)

        let yarnLock = readFileSync(join(mockTmp, nodeFunctions[2], 'yarn.lock'), 'utf-8')
        let newYarn = yarnLock.split('\n').filter(t => t.includes('  version "'))[0].split('  version "')[1].replace('"', '')
        assert.notStrictEqual(newYarn, '7.0.2', `put-on_your_boots tiny-json-http bumped to ${newVersion} from 7.0.2`)

        let gemfileLock = readFileSync(join(mockTmp, rubyFunctions[0], 'Gemfile.lock'), 'utf-8')
        let newGem = gemfileLock.split('\n').filter(t => t.includes('a (0'))[0].split('(')[1].split(')')[0]
        assert.notStrictEqual(newGem, '0.2.1', `delete-badness_in_life 'a' gem bumped to ${newGem} from 0.2.1`)
        checkFolderCreation(assert)
        resolve()
      })
    })
  })
})

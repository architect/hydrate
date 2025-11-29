const { test } = require('node:test')
const assert = require('node:assert')
let { join } = require('path')
let { unlinkSync, writeFileSync } = require('fs')
let { reset } = require('./_shared')
let hydrate = require('../../')
let { execSync } = require('child_process')

let {
  pythonFunctions,
  rubyFunctions,
  nodeFunctions,
} = require('./_shared')

let npmVer = execSync('npm --version').toString()

test('Corrupt package-lock.json fails hydrate.install', async () => {
  await new Promise((resolve) => {
    reset(function () {
      // Make a funky package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
      let basepath = nodeFunctions[0]
      hydrate.install({ basepath }, function done (err) {
        if (err) assert.ok(true, `Successfully errored: ${err}`)
        else assert.fail('Hydration did not fail')
        resolve()
      })
    })
  })
})

test('Corrupt package-lock.json may or may not fail hydrate.update (depending on npm version)', async () => {
  await new Promise((resolve) => {
    reset(function () {
      // Make a funky package-lock file
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
      let basepath = nodeFunctions[0]
      hydrate.update({ basepath }, function done (err) {
        if (Number(npmVer.split('.')[0]) >= 7) {
          if (err) assert.fail(err)
          else assert.ok(true, 'Hydration did not fail in npm 7.x')
        }
        else {
          if (err) assert.ok(true, `Successfully errored: ${err}`)
          else assert.fail('Hydration did not fail')
        }
        resolve()
      })
    })
  })
})

test('Corrupt Gemfile fails hydrate.install', async () => {
  await new Promise((resolve) => {
    reset(function () {
      let corruptPackage = 'ohayo gozaimasu!'
      unlinkSync(join(rubyFunctions[0], 'Gemfile.lock'))
      writeFileSync(join(rubyFunctions[0], 'Gemfile'), corruptPackage)
      let basepath = rubyFunctions[0]
      hydrate.install({ basepath }, function done (err) {
        if (err) assert.ok(true, `Successfully errored: ${err}`)
        else assert.fail('Hydration did not fail')
        resolve()
      })
    })
  })
})

test('Corrupt Gemfile fails hydrate.update', async () => {
  await new Promise((resolve) => {
    reset(function () {
      let corruptPackage = 'ohayo gozaimasu!'
      unlinkSync(join(rubyFunctions[0], 'Gemfile.lock'))
      writeFileSync(join(rubyFunctions[0], 'Gemfile'), corruptPackage)
      let basepath = rubyFunctions[0]
      hydrate.update({ basepath }, function done (err) {
        if (err) assert.ok(true, `Successfully errored: ${err}`)
        else assert.fail('Hydration did not fail')
        resolve()
      })
    })
  })
})

test('Corrupt requirements.txt fails hydrate.install', async () => {
  await new Promise((resolve) => {
    reset(function () {
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
      let basepath = pythonFunctions[0]
      hydrate.install({ basepath, installing: true }, function done (err) {
        if (err) assert.ok(true, `Successfully errored: ${err}`)
        else assert.fail('Hydration did not fail')
        resolve()
      })
    })
  })
})

test('Corrupt requirements.txt fails hydrate.update', async () => {
  await new Promise((resolve) => {
    reset(function () {
      let corruptPackage = 'ohayo gozaimasu!'
      writeFileSync(join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
      let basepath = pythonFunctions[0]
      hydrate.update({ basepath, installing: false }, function done (err) {
        if (err) assert.ok(true, `Successfully errored: ${err}`)
        else assert.fail('Hydration did not fail')
        resolve()
      })
    })
  })
})

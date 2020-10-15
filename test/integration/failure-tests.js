let test = require('tape')
let { join } = require('path')
let { unlinkSync, writeFileSync } = require('fs')
let { reset } = require('./_shared')
let hydrate = require('../../')

let {
  pythonFunctions,
  rubyFunctions,
  nodeFunctions,
} = require('./_shared')

test('Corrupt package-lock.json fails hydrate.install', t => {
  t.plan(1)
  reset(t, function () {
    // Make missing the package-lock file
    let corruptPackage = 'ohayo gozaimasu!'
    writeFileSync(join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
    let basepath = nodeFunctions[0]
    hydrate.install({ basepath }, function done (err) {
      console.log(`noop log to help reset tap-spec lol`)
      if (err) t.pass(`Successfully errored: ${err}`)
      else t.fail('Hydration did not fail')
    })
  })
})

test('Corrupt package-lock.json fails hydrate.update', t => {
  t.plan(1)
  reset(t, function () {
    // Make missing the package-lock file
    let corruptPackage = 'ohayo gozaimasu!'
    writeFileSync(join(nodeFunctions[0], 'package-lock.json'), corruptPackage)
    hydrate.update(nodeFunctions[0], function done (err) {
      console.log(`noop log to help reset tap-spec lol`)
      if (err) t.pass(`Successfully errored: ${err}`)
      else t.fail('Hydration did not fail')
    })
  })
})

test('Corrupt Gemfile fails hydrate.install', t => {
  t.plan(1)
  reset(t, function () {
    let corruptPackage = 'ohayo gozaimasu!'
    unlinkSync(join(rubyFunctions[0], 'Gemfile.lock'))
    writeFileSync(join(rubyFunctions[0], 'Gemfile'), corruptPackage)
    let basepath = rubyFunctions[0]
    hydrate.install({ basepath }, function done (err) {
      console.log(`noop log to help reset tap-spec lol`)
      if (err) t.pass(`Successfully errored: ${err}`)
      else t.fail('Hydration did not fail')
    })
  })
})

test('Corrupt Gemfile fails hydrate.update', t => {
  t.plan(1)
  reset(t, function () {
    let corruptPackage = 'ohayo gozaimasu!'
    unlinkSync(join(rubyFunctions[0], 'Gemfile.lock'))
    writeFileSync(join(rubyFunctions[0], 'Gemfile'), corruptPackage)
    let basepath = rubyFunctions[0]
    hydrate.update({ basepath }, function done (err) {
      console.log(`noop log to help reset tap-spec lol`)
      if (err) t.pass(`Successfully errored: ${err}`)
      else t.fail('Hydration did not fail')
    })
  })
})

test('Corrupt requirements.txt fails hydrate.install', t => {
  t.plan(1)
  reset(t, function () {
    let corruptPackage = 'ohayo gozaimasu!'
    writeFileSync(join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
    let basepath = pythonFunctions[0]
    hydrate.install({ basepath }, function done (err) {
      console.log(`noop log to help reset tap-spec lol`)
      if (err) t.pass(`Successfully errored: ${err}`)
      else t.fail('Hydration did not fail')
    })
  })
})

test('Corrupt requirements.txt fails hydrate.update', t => {
  t.plan(1)
  reset(t, function () {
    let corruptPackage = 'ohayo gozaimasu!'
    writeFileSync(join(pythonFunctions[0], 'requirements.txt'), corruptPackage)
    hydrate.update(pythonFunctions[0], function done (err) {
      console.log(`noop log to help reset tap-spec lol`)
      if (err) t.pass(`Successfully errored: ${err}`)
      else t.fail('Hydration did not fail')
    })
  })
})

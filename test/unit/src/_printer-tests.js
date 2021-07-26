let test = require('tape')
let print = require('../../../src/_printer')
let { updater } = require('@architect/utils')

test('Set up env', t => {
  t.plan(1)
  t.ok(print, 'Printer loaded')
})

test('Error on missing params', t => {
  t.plan(3)
  let name = 'Testing err'
  let startMsg = 'Start test'
  let stdout = 'some info\nmore info'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name)
  let start = update.start(startMsg)
  print({ stdout, start, done, update }, (err, result) => {
    if (err) t.pass(err)
    if (result) t.fail('Got unexpected result')
  })
  print({ stdout, cmd, start, done }, (err, result) => {
    if (err) t.pass(err)
    if (result) t.fail('Got unexpected result')
  })
  print({ stdout, cmd, update }, (err, result) => {
    if (err) t.pass(err)
    if (result) t.fail('Got unexpected result')
  })
  update.cancel()
})

test('Basic stdout', t => {
  t.plan(6)
  // Messages
  let name = 'Testing stdout'
  let startMsg = 'Start test'
  let stdout = 'some info\nmore info'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name)
  let start = update.start(startMsg)

  print({ stdout, cmd, start, done, update }, err => {
    if (err) t.fail(err)
    else {
      let got = update.get()
      update.reset()
      t.match(got, new RegExp(name), `Contents include: ${name}`)
      t.match(got, new RegExp(startMsg), `Contents include: ${startMsg}`)
      stdout.split('\n').forEach(o => t.match(got, new RegExp(o), `Contents include: ${o}`))
      t.match(got, new RegExp(cmd), `Contents include: ${cmd}`)
      t.match(got, new RegExp(done), `Contents include: ${done}`)
    }
  })
})

test('Basic stderr', t => {
  t.plan(6)
  // Messages
  let name = 'Testing stderr'
  let startMsg = 'Start test'
  let stderr = 'some warnings\nmore warnings'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name)
  let start = update.start(startMsg)

  print({ stderr, cmd, start, done, update }, err => {
    if (err) t.fail(err)
    else {
      let got = update.get()
      update.reset()
      t.match(got, new RegExp(name), `Contents include: ${name}`)
      t.match(got, new RegExp(startMsg), `Contents include: ${startMsg}`)
      stderr.split('\n').forEach(o => t.match(got, new RegExp(o), `Contents include: ${o}`))
      t.match(got, new RegExp(cmd), `Contents include: ${cmd}`)
      t.match(got, new RegExp(done), `Contents include: ${done}`)
    }
  })
})

test('Basic err (with some stdout)', t => {
  t.plan(6)
  // Messages
  let name = 'Testing err'
  let startMsg = 'Start test asdfasdfasfs'
  let stdout = 'some info\nmore info'
  let err = Error('some errorings\nmore errorings')
  let errLine = err.message
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name)
  let start = update.start(startMsg)

  print({ stdout, err, cmd, start, done, update }, err => {
    if (!err) t.fail('No error present')
    else {
      let got = update.get()
      update.reset()
      t.match(got, new RegExp(name), `Contents include: ${name}`)
      t.match(got, new RegExp(startMsg), `Contents include: ${startMsg}`)
      errLine.split('\n').forEach(o => t.match(got, new RegExp(o), `Contents include: ${o}`))
      t.match(got, new RegExp(cmd), `Contents include: ${cmd}`)
      t.match(got, new RegExp(done), `Contents do not include: ${done}`)
    }
  })
})

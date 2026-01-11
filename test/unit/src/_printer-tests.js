const { test } = require('node:test')
const assert = require('node:assert')
const print = require('../../../src/_printer')
const { updater } = require('@architect/utils')

test('Set up env', async () => {
  assert.ok(print, 'Printer loaded')
})

test('Error on missing params', async () => {
  let name = 'Testing err'
  let startMsg = 'Start test'
  let stdout = 'some info\nmore info'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name)
  let start = update.start(startMsg)

  await new Promise((resolve) => {
    print({ stdout, start, done, update }, (err, result) => {
      if (err) assert.ok(true, err)
      if (result) assert.fail('Got unexpected result')
      resolve()
    })
  })

  await new Promise((resolve) => {
    print({ stdout, cmd, start, done }, (err, result) => {
      if (err) assert.ok(true, err)
      if (result) assert.fail('Got unexpected result')
      resolve()
    })
  })

  await new Promise((resolve) => {
    print({ stdout, cmd, update }, (err, result) => {
      if (err) assert.ok(true, err)
      if (result) assert.fail('Got unexpected result')
      resolve()
    })
  })

  update.cancel()
})

test('Basic stdout', async () => {
  // Messages
  let name = 'Testing stdout'
  let startMsg = 'Start test'
  let stdout = 'some info\nmore info'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name)
  let start = update.start(startMsg)

  await new Promise((resolve) => {
    print({ stdout, cmd, start, done, update }, err => {
      if (err) assert.fail(err)
      else {
        let got = update.get()
        update.reset()
        assert.match(got, new RegExp(name), `Contents include: ${name}`)
        assert.match(got, new RegExp(startMsg), `Contents include: ${startMsg}`)
        stdout.split('\n').forEach(o => assert.match(got, new RegExp(o), `Contents include: ${o}`))
        assert.match(got, new RegExp(cmd), `Contents include: ${cmd}`)
        assert.match(got, new RegExp(done), `Contents include: ${done}`)
      }
      resolve()
    })
  })
})

test('Basic stderr', async () => {
  // Messages
  let name = 'Testing stderr'
  let startMsg = 'Start test'
  let stderr = 'some warnings\nmore warnings'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name)
  let start = update.start(startMsg)

  await new Promise((resolve) => {
    print({ stderr, cmd, start, done, update }, err => {
      if (err) assert.fail(err)
      else {
        let got = update.get()
        update.reset()
        assert.match(got, new RegExp(name), `Contents include: ${name}`)
        assert.match(got, new RegExp(startMsg), `Contents include: ${startMsg}`)
        stderr.split('\n').forEach(o => assert.match(got, new RegExp(o), `Contents include: ${o}`))
        assert.match(got, new RegExp(cmd), `Contents include: ${cmd}`)
        assert.match(got, new RegExp(done), `Contents include: ${done}`)
      }
      resolve()
    })
  })
})

test('Basic err (with some stdout)', async () => {
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

  await new Promise((resolve) => {
    print({ stdout, err, cmd, start, done, update }, err => {
      if (!err) assert.fail('No error present')
      else {
        let got = update.get()
        update.reset()
        assert.match(got, new RegExp(name), `Contents include: ${name}`)
        assert.match(got, new RegExp(startMsg), `Contents include: ${startMsg}`)
        errLine.split('\n').forEach(o => assert.match(got, new RegExp(o), `Contents include: ${o}`))
        assert.match(got, new RegExp(cmd), `Contents include: ${cmd}`)
        assert.match(got, new RegExp(done), `Contents do not include: ${done}`)
      }
      resolve()
    })
  })
})

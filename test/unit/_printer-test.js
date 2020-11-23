let test = require('tape')
let print = require('../../src/_printer')
let stripAnsi = require('strip-ansi')
let { updater } = require('@architect/utils')
// process.env.CI = true

test('Set up env', t => {
  t.plan(1)
  t.ok(print, 'Printer loaded')
})

test('Error on missing params', t => {
  let name = 'Testing err'
  let startMsg = 'Start test'
  let stdout = 'some info\nmore info'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name, { quiet: true })
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
  t.end()
})

test('Basic stdout', t => {
  // Messages
  let name = 'Testing stdout'
  let startMsg = 'Start test'
  let stdout = 'some info\nmore info'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name, { quiet: true })
  let start = update.start(startMsg)

  print({ stdout, cmd, start, done, update }, (err, result) => {
    if (err) t.fail(err)
    else {
      let term = stripAnsi(result.term.stdout)
      let raw = result.raw.stdout
      console.log(term)
      t.equal(term, raw, 'Term + raw output contents match')
      t.ok(term.includes(name), `Contents include: ${name}`)
      t.ok(term.includes(startMsg), `Contents include: ${startMsg}`)
      stdout.split('\n').forEach(o => t.ok(term.includes(o), `Contents include: ${o}`))
      t.ok(term.includes(cmd), `Contents include: ${cmd}`)
      t.ok(term.includes(done), `Contents include: ${done}`)
      t.end()
    }
  })
})

test('Basic stderr', t => {
  // Messages
  let name = 'Testing stderr'
  let startMsg = 'Start test'
  let stderr = 'some warnings\nmore warnings'
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name, { quiet: true })
  let start = update.start(startMsg)

  print({ stderr, cmd, start, done, update }, (err, result) => {
    if (err) t.fail(err)
    else {
      let termStdout = stripAnsi(result.term.stdout)
      let rawStdout = result.raw.stdout
      let termStderr = stripAnsi(result.term.stderr)
      let rawStderr = result.raw.stderr
      console.log(termStdout, termStderr)
      t.equal(termStdout, rawStdout, 'Term + raw stdout contents match')
      t.equal(termStderr, rawStderr, 'Term + raw stderr contents match')
      t.ok(termStdout.includes(name), `Contents include: ${name}`)
      t.ok(termStdout.includes(startMsg), `Contents include: ${startMsg}`)
      stderr.split('\n').forEach(o => t.ok(termStderr.includes(o), `Contents include: ${o}`))
      t.ok(termStderr.includes(cmd), `Contents include: ${cmd}`)
      t.ok(termStdout.includes(done), `Contents include: ${done}`)
      t.end()
    }
  })
})

test('Basic err', t => {
  // Messages
  let name = 'Testing err'
  let startMsg = 'Start test'
  let err = Error('some errorings\nmore errorings')
  let errLine = err.message
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name, { quiet: true })
  let start = update.start(startMsg)

  print({ err, cmd, start, done, update }, (err, result) => {
    if (!err) t.fail('No error present')
    else {
      let termStdout = stripAnsi(result.term.stdout)
      let rawStdout = result.raw.stdout
      let termErr = stripAnsi(result.term.err)
      let rawErr = result.raw.err.message
      console.log(termStdout, termErr)
      t.equal(termStdout, rawStdout, 'Term + raw stdout contents match')
      t.equal(termErr, rawErr, 'Term + raw err contents match')
      t.equal(result.raw.err.code, 1, 'Error code set to 1 (by default if not present)')
      t.notOk(result.raw.err.signal, 'No error signal present')
      t.ok(termStdout.includes(name), `Contents include: ${name}`)
      t.ok(termStdout.includes(startMsg), `Contents include: ${startMsg}`)
      errLine.split('\n').forEach(o => t.ok(termErr.includes(o), `Contents include: ${o}`))
      t.notOk(termErr.includes(cmd), `Contents include: ${cmd}`)
      t.notOk(termStdout.includes(done), `Contents do not include: ${done}`)
      t.end()
    }
  })
})

test('Basic err with code', t => {
  // Messages
  let name = 'Testing err'
  let startMsg = 'Start test'
  let err = Error('some errorings\nmore errorings')
  err.code = 2
  err.signal = 'SIGINT'
  let errLine = err.message
  let cmd = 'cmd'
  let done = 'Finish test'
  let update = updater(name, { quiet: true })
  let start = update.start(startMsg)

  print({ err, cmd, start, done, update }, (err, result) => {
    if (!err) t.fail('No error present')
    else {
      let termStdout = stripAnsi(result.term.stdout)
      let rawStdout = result.raw.stdout
      let termErr = stripAnsi(result.term.err)
      let rawErr = result.raw.err.message
      console.log(termStdout, termErr)
      t.equal(termStdout, rawStdout, 'Term + raw stdout contents match')
      t.equal(termErr, rawErr, 'Term + raw err contents match')
      t.equal(result.raw.err.code, 2, 'Error code set to 2 (manually)')
      t.equal(result.raw.err.signal, 'SIGINT', 'Error signal present')
      t.ok(termStdout.includes(name), `Contents include: ${name}`)
      t.ok(termStdout.includes(startMsg), `Contents include: ${startMsg}`)
      errLine.split('\n').forEach(o => t.ok(termErr.includes(o), `Contents include: ${o}`))
      t.notOk(termErr.includes(cmd), `Contents include: ${cmd}`)
      t.notOk(termStdout.includes(done), `Contents do not include: ${done}`)
      t.end()
    }
  })
})

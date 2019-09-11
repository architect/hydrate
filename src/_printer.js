let chalk = require('chalk')
let stripAnsi = require('strip-ansi')
let denoise = require('./_denoise')

function start (params) {
  let {cwd, action, update} = params
  let relativePath = cwd !== '.' ? cwd : 'project root'
  let info = chalk.cyan(action, relativePath)
  return update.start(info)
}

// Prints and passes along the result (in both raw and terminal (ANSI) formats)
function done (params, callback) {
  let {err, stdout, stderr, cmd, start, update, verbose} = params
  let result = {
    raw: {},
    term: {
      stdout: ''
    }
  }
  let command = chalk.cyan.dim(`${cmd}:`)
  let format = input => {
    let output = input.split('\n').map(l => `${command} ${l.trim()}`)
    if (start) output.unshift('') // Pass null message not double print start
    return update.status(...output)
  }

  if (err) {
    result.raw.err = err
    result.term.err = update.error(err)
  }
  if (stdout && stdout.length > 0) {
    stdout = verbose
      ? stdout
      : denoise(stdout)
    result.term.stdout = stdout
      ? format(stdout.trim())
      : '' // Necessary, or de-noised lines result in empty lines
    result.raw.stdout = stripAnsi(result.term.stdout.trim())
  }
  // Always prepend start, if present
  if (start) {
    result.raw.stdout = stripAnsi(start).trim() + result.raw.stdout
    result.term.stdout = start + result.term.stdout
  }
  // Check for existence of error before printing stderr
  // If present, it's almost certainly the same as in err and would double print/return
  if (stderr && stderr.length > 0 && !err) {
    stderr = verbose
      ? stderr
      : denoise(stderr)
    result.term.stderr = stderr
      ? format(stderr.trim())
      : '' // Necessary, or de-noised lines result in empty lines
    result.raw.stderr = stripAnsi(result.term.stderr.trim())
  }

  if (err) callback(Error('hydration_error'), result)
  else callback(null, result)
}

module.exports = {
  start,
  done
}
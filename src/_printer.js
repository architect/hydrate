let chalk = require('chalk')
let stripAnsi = require('strip-ansi')
let denoise = require('./_denoise')

/**
 * Prints result and passes along the result
 * - Returns both raw and terminal (ANSI) formats
 * - Diff tools may do weird things; e.g. may only receive stderr, but no err, and exit 0
 */
module.exports = function print (params, callback) {
  let { err, stdout, stderr, cmd, start, done, update, verbose } = params

  if (stdout && !cmd)
    callback(ReferenceError('Must specify command to print'))
  else if (!update)
    callback(ReferenceError('Must pass an updater'))
  else if (!err && !done)
    callback(ReferenceError('Must pass err or done'))
  else {
    // Set up result structure
    let result = {
      raw: {
        stdout: ''
      },
      term: {
        stdout: ''
      }
    }

    // Assemble multi-line output with corresponding commands
    let format = input => {
      let command = chalk.cyan.dim(`${cmd}:`)
      let output = input.split('\n').map(l => `${command} ${l.trim()}`)
      if (start) output.unshift('') // Pass null message not double print start
      return update.status(...output)
    }

    /**
     * Error handling
     */
    if (err) {
      let error = update.error(err)
      result.raw.err = {
        message: stripAnsi(error),
        code: err.code || 1
      }
      if (err.signal) result.raw.err.signal = err.signal
      result.term.err = error
      done = null // Prevent prepending to stdout in an error state
    }
    if (!err) {
      done = update.done(done)
    }

    /**
     * stdout
     */
    if (stdout && stdout.length > 0) {
      stdout = verbose
        ? stdout
        : denoise(stdout)
      result.term.stdout = stdout
        ? format(stdout)
        : '' // Necessary, or de-noised lines result in empty lines
      result.raw.stdout = stripAnsi(result.term.stdout)
    }

    // Prepend start + done, if present
    let prepStdout = output => `${start ? start + '\n' : ''}${done ? done : ''}${output}`
    result.raw.stdout = stripAnsi(prepStdout(result.raw.stdout))
    result.term.stdout = prepStdout(result.term.stdout)

    /**
     * stderr
     * - Check for existence of error before printing stderr
     * - If present, it's almost certainly the same as in err and would double print/return
     */
    if (stderr && stderr.length > 0 && !err) {
      stderr = verbose
        ? stderr
        : denoise(stderr)
      result.term.stderr = stderr
        ? format(stderr)
        : '' // Necessary, or de-noised lines result in empty lines
      result.raw.stderr = stripAnsi(result.term.stderr)
    }

    if (err) callback(err, result)
    else callback(null, result)
  }
}

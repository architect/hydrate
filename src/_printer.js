let chalk = require('chalk')
let denoise = require('./_denoise')

/**
 * Prints result and passes along the result
 * - Returns both raw and terminal (ANSI) formats
 * - Diff tools may do weird things; e.g. may only receive stderr, but no err, and exit 0
 */
module.exports = function print (params, callback) {
  let { err, stdout, stderr, cmd, start, done, update, verbose } = params

  if (stdout && !cmd) {
    callback(ReferenceError('Must specify command to print'))
  }
  else if (!update) {
    callback(ReferenceError('Must pass an updater'))
  }
  else if (!done || (err && !done)) {
    callback(ReferenceError('Must pass err or done'))
  }
  else {
    // Assemble multi-line output with corresponding commands
    let print = input => {
      let command = chalk.cyan.dim(`${cmd}:`)
      let output = input.split('\n').map(l => `${command} ${l.trim()}`)
      if (start) output.unshift('') // Pass null message not double print start
      update.status(...output)
    }

    /**
     * Present step's done state before term output
     */
    if (err) update.status(done)
    else update.done(done)

    /**
     * stdout
     */
    if (stdout && stdout.length > 0) {
      stdout = verbose
        ? stdout
        : denoise(stdout)
      print(stdout)
    }

    /**
     * stderr
     * - Check for existence of error before printing stderr
     * - If present, it's almost certainly the same as in err and would double print
     */
    if (stderr && stderr.length > 0 && !err) {
      stderr = verbose
        ? stderr
        : denoise(stderr)
      print(stderr)
    }

    /**
     * Finally, present the error
     */
    if (err) update.error(err)

    // Errors ere (presumably) already been printed by the logger by this point
    // Passing along a keyed error prevents double-printing errors
    if (err) callback(Error('hydration_error'))
    else callback()
  }
}

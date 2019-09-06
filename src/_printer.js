let chalk = require('chalk')
let chars = require('@architect/utils').chars
let denoise = require('./_denoise')

function start (params) {
  let {cwd, action, quiet} = params
  let status = chalk.grey('Hydrate')
  let relativePath = cwd !== '.' ? cwd : 'project root'
  let hydrationPath = chalk.cyan(action, relativePath)
  let info = `${chars.start} ${status} ${hydrationPath}`
  if (!quiet) console.log(info)
  return info
}

// Prints and passes along the result (in both raw and terminal (ANSI) formats)
function done (params, callback) {
  let {err, stdout, stderr, cmd, start, quiet, verbose} = params
  let result = {
    raw: {},
    term: {
      start,
      stdout: ''
    }
  }
  let command = chalk.cyan.dim(`${cmd}:`)
  let format = input => input.split('\n').map(l => `  ${chalk.grey('|')} ${command} ${l}`).join('\n')

  if (err) {
    result.raw.err = err
    result.term.err = format(chalk.red.bold(err.message.trim()))
    if (!quiet) console.error(err)
  }
  if (stdout && stdout.length > 0) {
    stdout = verbose
      ? stdout
      : denoise(stdout)
    result.raw.stdout = stdout
    result.term.stdout += stdout
      ? format(chalk.grey(stdout.trim()))
      : '' // Necessary, or de-noised lines result in empty lines
    if (!quiet && result.term.stdout) console.log(result.term.stdout)
  }
  if (stderr && stderr.length > 0) {
    stderr = verbose
      ? stderr
      : denoise(stderr)
    result.raw.stderr = stderr
    result.term.stderr = stderr
      ? format(chalk.yellow.dim(stderr.trim()))
      : '' // Necessary, or de-noised lines result in empty lines
    if (!quiet && result.term.stderr) console.log(result.term.stderr)
  }

  if (err) callback(Error('hydration_error'), result)
  else callback(null, result)
}

module.exports = {
  start,
  done
}
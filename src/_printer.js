let chalk = require('chalk')

function start (params) {
  let {cwd, cmd, quiet} = params
  let indicator = chalk.green.dim('⚬')
  let status = chalk.grey('Hydrating dependencies:')
  let path = chalk.cyan(cwd.replace(process.cwd(), ''))
  let command = chalk.cyan.dim(`[${cmd}]`)
  if (!quiet) console.log(`${indicator} ${status} ${path} ${command}`)
}

// Prints and passes along the result
function done (params, callback) {
  let {err, stdout, stderr, quiet} = params
  let print = input => console.log(input.split('\n').map(l => `  ${chalk.grey('|')} ${l}`).join('\n'))
  if (err && !quiet) {
    print(chalk.red.bold(err.message.trim()))
  }
  if (stdout && stdout.length > 0 && !quiet) {
    print(chalk.grey(stdout.trim()))
  }
  if (stderr && stderr.length > 0 && !quiet) {
    print(chalk.yellow.dim(stderr.trim()))
  }
  if (err) callback(Error('hydration_error'), {err, stdout, stderr})
  else callback(null, {err, stdout, stderr})
}

module.exports = {
  start,
  done
}
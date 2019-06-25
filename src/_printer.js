let chalk = require('chalk')

function start (cwd, cmd) {
  let indicator = chalk.green.dim('⚬')
  let status = chalk.grey('Hydrating dependencies:')
  let path = chalk.cyan(cwd.replace(process.cwd(), '').substr(1))
  let command = chalk.cyan.dim(`[${cmd}]`)
  console.log(`${indicator} ${status} ${path} ${command}`)
}

function done (err, stdout, stderr, callback) {
  let format = input => input.trim().split('\n').map(l => `  | ${l}`).join('\n')
  if (err) {
    console.log(chalk.red.bold(format(err.message)))
  }
  if (stdout && stdout.length > 0) {
    console.log(chalk.grey(format(stdout)))
  }
  if (stderr && stderr.length > 0) {
    console.log(chalk.yellow.dim(format(stderr)))
  }
  if (err) callback(Error('hydration_error'))
  else callback()
}

module.exports = {
  start,
  done
}
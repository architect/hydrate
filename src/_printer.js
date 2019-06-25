let chalk = require('chalk')

function start (cwd, cmd) {
  let indicator = chalk.green.dim('⚬')
  let status = chalk.grey('Hydrating dependencies:')
  let path = chalk.cyan(cwd.replace(process.cwd(), '').substr(1))
  let command = chalk.cyan.dim(`[${cmd}]`)
  console.log(`${indicator} ${status} ${path} ${command}`)
}

function done (err, stdout, stderr, callback) {
  let print = input => console.log(input.split('\n').map(l => `  ${chalk.grey('|')} ${l}`).join('\n'))
  if (err) {
    print(chalk.red.bold(err.message.trim()))
  }
  if (stdout && stdout.length > 0) {
    print(chalk.grey(stdout.trim()))
  }
  if (stderr && stderr.length > 0) {
    print(chalk.yellow.dim(stderr.trim()))
  }
  if (err) callback(Error('hydration_error'))
  else callback()
}

module.exports = {
  start,
  done
}
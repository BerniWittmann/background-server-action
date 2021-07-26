const core = require('@actions/core');
const exec = require('@actions/exec');
const io = require('@actions/io');
const os = require('os')
const debug = require('debug')('background-server-action');
const cliParser = require('argument-vector')();
const quote = require('quote');

const { ping } = require('./src/ping')

const isWindows = () => os.platform() === 'win32'
const isUrl = (s) => /^https?:\/\//.test(s)


/**
 * Parses input command, finds the tool and
 * the runs the command.
 */
 const execCommand = (
  fullCommand,
  waitToFinish = true,
  label = 'executing'
) => {
  console.log('%s command "%s"', label, fullCommand)

  const args = cliParser.parse(fullCommand)
  debug(`parsed command: ${args.join(' ')}`)

  return io.which(args[0], true).then((toolPath) => {
    debug(`found command "${toolPath}"`)
    debug(`with arguments ${args.slice(1).join(' ')}`)

    const toolArguments = args.slice(1)
    const argsString = toolArguments.join(' ')
    debug(`running ${quote(toolPath)} ${argsString}`)
    debug(`waiting for the command to finish? ${waitToFinish}`)

    const promise = exec.exec(
      quote(toolPath),
      toolArguments,
      {}
    )
    if (waitToFinish) {
      return promise
    }
  })
}


// most @actions toolkit packages have async methods
async function run() {
  let command
  if (isWindows()) {
    // allow custom Windows command command
    command =
      core.getInput('command-windows') || core.getInput('command')
  } else {
    command = core.getInput('command')
  }
  if (!command) {
    return
  }
  // allow commands to be separated using commas or newlines
  const separateCommands = command
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  debug(
  `Separated ${
    separateCommands.length
  } main commands ${separateCommands.join(', ')}`
  )

  return separateCommands.map((command) => {
    return execCommand(
      command,
      true,
      `run command "${command}"`
    )
  })
}

const buildAppMaybe = () => {
  const buildApp = core.getInput('build')
  if (!buildApp) {
    return
  }

  debug(`building application using "${buildApp}"`)

  return execCommand(buildApp, true, 'build app')
}

const startServersMaybe = () => {
  let startCommand

  if (isWindows()) {
    // allow custom Windows start command
    startCommand =
      core.getInput('start-windows') || core.getInput('start')
  } else {
    startCommand = core.getInput('start')
  }
  if (!startCommand) {
    debug('No start command found')
    return Promise.resolve()
  }

  // allow commands to be separated using commas or newlines
  const separateStartCommands = startCommand
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  debug(
    `Separated ${
      separateStartCommands.length
    } start commands ${separateStartCommands.join(', ')}`
  )

  return separateStartCommands.map((startCommand) => {
    return execCommand(
      startCommand,
      false,
      `start server "${startCommand}"`
    )
  })
}

/**
 * Pings give URL(s) until the timeout expires.
 * @param {string} waitOn A single URL or comma-separated URLs
 * @param {Number?} waitOnTimeout in seconds
 */
 const waitOnUrl = (waitOn, waitOnTimeout = 60) => {
  console.log(
    'waiting on "%s" with timeout of %s seconds',
    waitOn,
    waitOnTimeout
  )

  const waitTimeoutMs = waitOnTimeout * 1000

  const waitUrls = waitOn
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  debug(`Waiting for urls ${waitUrls.join(', ')}`)

  // run every wait promise after the previous has finished
  // to avoid "noise" of debug messages
  return waitUrls.reduce((prevPromise, url) => {
    return prevPromise.then(() => {
      debug(`Waiting for url ${url}`)
      return ping(url, waitTimeoutMs)
    })
  }, Promise.resolve())
}

const waitOnMaybe = () => {
  const waitOn = core.getInput('wait-on')
  if (!waitOn) {
    return
  }

  const waitOnTimeout = core.getInput('wait-on-timeout') || '60'
  const timeoutSeconds = parseFloat(waitOnTimeout)

  if (isUrl(waitOn)) {
    return waitOnUrl(waitOn, timeoutSeconds)
  }

  console.log('Waiting using command "%s"', waitOn)
  return execCommand(waitOn, true)
}

buildAppMaybe()
  .then(startServersMaybe)
  .then(waitOnMaybe)
  .then(run)
  .then(() => {
    debug('all done, exiting')
    // force exit to avoid waiting for child processes,
    // like the server we have started
    // see https://github.com/actions/toolkit/issues/216
    process.exit(0)
  })
  .catch((error) => {
    // final catch - when anything goes wrong, throw an error
    // and exit the action with non-zero code
    debug(error.message)
    debug(error.stack)

    core.setFailed(error.message)
    process.exit(1)
  })

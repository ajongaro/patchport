#!/usr/bin/env node

import { Command } from 'commander'
import { patchport } from './patchport/main'
import { GitHelpers } from './utils/gitHelpers'
import { displaySplashScreen } from './utils/helperFunctions'

const program = new Command()

program
  .version('1.0.0')
  .description('CLI for managing backports and patches at Gambyt')
  .option('-c, --commit <commitId>', 'Commit ID to cherry-pick')
  .option('-o, --origin <branch>', 'Origin branch where commit exists')

program.parse(process.argv)

const options = program.opts()

async function run() {
  displaySplashScreen()

  await GitHelpers.checkForUncommittedChanges()

  const isAuthenticated = await GitHelpers.checkGhAuthStatus()
  if (!isAuthenticated) {
    await GitHelpers.promptGhAuthLogin()
  }

  let commitId = options.commit
  let originBranch = options.origin

  if (!originBranch) {
    originBranch = await GitHelpers.promptForOriginBranch()
    if (!originBranch) {
      console.error('No origin branch selected. Exiting.')
      process.exit(1)
    }
  }

  if (!commitId) {
    // Switch to the origin branch before displaying the git log
    const switched = await GitHelpers.switchToBranch(originBranch)
    if (!switched) {
      console.error(`Failed to switch to branch ${originBranch}. Exiting.`)
      process.exit(1)
    }

    // No commit ID provided, display git log for selection
    commitId = await GitHelpers.selectCommitFromLog(originBranch)
    if (!commitId) {
      console.error('No commit selected. Exiting.')
      process.exit(1)
    }
  }

  // TODO: Add deployment apps
  await patchport(commitId, originBranch)
}

run()

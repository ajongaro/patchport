#!/usr/bin/env node

import { Command } from 'commander'
import { patchport } from './patchport/main'
import { GitHelpers } from './utils/gitHelpers'
import simpleGit, { SimpleGit } from 'simple-git'

const program = new Command()

program
  .version('1.0.0')
  .description('CLI tool for managing backports and patches')
  .option('-c, --commit <commitId>', 'Commit ID to cherry-pick')
  .option('-o, --origin <branch>', 'Origin branch to use')

program.parse(process.argv)

const options = program.opts()

async function run() {
  let commitId = options.commit
  let originBranch = options.origin

  const git: SimpleGit = simpleGit()

  // Store the current branch
  const status = await git.status()
  const currentBranch = status.current

  if (!originBranch) {
    // Prompt for the origin branch
    originBranch = await GitHelpers.promptForOriginBranch()
    if (!originBranch) {
      console.error('No origin branch selected. Exiting.')
      process.exit(1)
    }
  }

  if (!commitId) {
    // Switch to the origin branch before displaying the git log
    const switched = await switchToBranch(originBranch)
    if (!switched) {
      console.error(`Failed to switch to branch ${originBranch}. Exiting.`)
      process.exit(1)
    }

    // No commit ID provided, display git log for selection
    commitId = await GitHelpers.selectCommitFromLog()
    if (!commitId) {
      console.error('No commit selected. Exiting.')
      process.exit(1)
    }
  }

  // Call the 'patchport' function with the commit ID and origin branch
  await patchport(commitId, originBranch)
}

run()

// Helper function to switch to the origin branch
async function switchToBranch(branchName: string): Promise<boolean> {
  const git: SimpleGit = simpleGit()
  try {
    await git.checkout(branchName)
    return true
  } catch (error) {
    console.error(`Error: Could not switch to branch '${branchName}'.`)
    console.error(error)
    return false
  }
}

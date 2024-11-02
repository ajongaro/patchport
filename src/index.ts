#!/usr/bin/env node

import { Command } from 'commander'
import { patchport } from './patchport/main'
import { selectCommitFromLog } from './utils/selectCommit'

const program = new Command()

program
  .version('1.0.0')
  .description('CLI tool for managing backports and patches')
  .option('-c, --commit <commitId>', 'Commit ID to cherry-pick')

program.parse(process.argv)

const options = program.opts()

async function run() {
  let commitId = options.commit

  if (!commitId) {
    // No commit ID provided, display git log for selection
    commitId = await selectCommitFromLog()
    if (!commitId) {
      console.error('No commit selected. Exiting.')
      process.exit(1)
    }
  }

  patchport(commitId)
}

run()

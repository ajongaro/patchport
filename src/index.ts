#!/usr/bin/env node

import { main } from './main'

// Extract the commit ID from the command-line arguments
const [, , commitId] = process.argv

if (!commitId) {
  console.error('Please provide a commit ID as an argument.')
  process.exit(1)
}

main(commitId)

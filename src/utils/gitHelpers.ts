import simpleGit, { SimpleGit } from 'simple-git'
import inquirer from 'inquirer'
import { execShellCommand } from './helperFunctions'
import { VALID_BRANCHES } from '../constants'

const checkGhAuthStatus = async (): Promise<boolean> => {
  try {
    await execShellCommand('gh auth status')
    return true
  } catch (error) {
    // The command failed, likely due to not being authenticated
    return false
  }
}

async function promptForOriginBranch(): Promise<string | null> {
  const { originBranch } = await inquirer.prompt([
    {
      type: 'list',
      name: 'originBranch',
      message: 'Select the origin branch:',
      choices: VALID_BRANCHES,
    },
  ])

  return originBranch || null
}

export async function selectCommitFromLog(): Promise<string | null> {
  const git: SimpleGit = simpleGit()

  try {
    // Fetch the latest commits from the current branch
    const log = await git.log({ maxCount: 20 })

    if (log.all.length === 0) {
      console.error('No commits found in the current branch.')
      return null
    }

    // Prepare choices for inquirer prompt
    const choices = log.all.map((commit) => ({
      name: `${commit.hash.substring(0, 7)} - ${commit.message}`,
      value: commit.hash,
    }))

    // Prompt the user to select a commit
    const { selectedCommit } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCommit',
        message: 'Select a commit to cherry-pick:',
        choices: choices,
      },
    ])

    return selectedCommit
  } catch (error) {
    console.error('Failed to retrieve git log.')
    console.error(error)
    return null
  }
}

export const GitHelpers = {
  checkGhAuthStatus,
  promptForOriginBranch,
  selectCommitFromLog,
}

import chalk from 'chalk'
import inquirer from 'inquirer'
import { VALID_BRANCHES, ValidBranchName } from '../constants'
import simpleGit, { SimpleGit } from 'simple-git'
import { execShellCommand } from './helperFunctions'

// gh
const checkGhAuthStatus = async (): Promise<boolean> => {
  try {
    await execShellCommand('gh auth status')
    return true
  } catch (error) {
    return false
  }
}

const promptGhAuthLogin = async (): Promise<void> => {
  console.log(chalk.yellow('You are not authenticated with GitHub CLI.'))
  const { shouldLogin } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldLogin',
      message: 'Would you like to authenticate now?',
      default: true,
    },
  ])

  if (shouldLogin) {
    try {
      await execShellCommand('gh', ['auth', 'login'], { interactive: true })
      console.log(chalk.green('Authentication successful!'))
    } catch (error) {
      console.error(chalk.red('Authentication failed. Please try again.'))
      console.error(error)
      process.exit(1)
    }
  } else {
    console.log(chalk.red('Authentication is required to proceed. Exiting...'))
    process.exit(1)
  }
}

// git
async function promptForOriginBranch(): Promise<ValidBranchName> {
  console.log('')
  const { originBranch } = await inquirer.prompt([
    {
      type: 'list',
      name: 'originBranch',
      message: 'Select the origin branch where work exists:',
      choices: VALID_BRANCHES,
    },
  ])

  return originBranch
}

export async function selectCommitFromLog(
  branchName: string
): Promise<string | null> {
  console.log('')
  const git: SimpleGit = simpleGit()
  try {
    await git.pull('origin', branchName)
    const log = await git.log({ maxCount: 30 })

    if (log.all.length === 0) {
      console.error('No commits found in the current branch.')
      return null
    }

    const choices = log.all.map((commit) => ({
      name: `${commit.hash.substring(0, 7)} - ${commit.message}`,
      value: commit.hash,
    }))

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

async function checkForUncommittedChanges() {
  const git: SimpleGit = simpleGit()
  const status = await git.status()
  if (status.files.length > 0) {
    console.error(
      chalk.red(
        'You have uncommitted changes. Please commit or stash them before running this tool.'
      )
    )
    process.exit(1)
  }
}

export const GitHelpers = {
  checkGhAuthStatus,
  checkForUncommittedChanges,
  promptGhAuthLogin,
  promptForOriginBranch,
  selectCommitFromLog,
  switchToBranch,
}

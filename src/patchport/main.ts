import chalk from 'chalk'
import inquirer from 'inquirer'
import simpleGit, { SimpleGit } from 'simple-git'
import {
  getDescriptionFromTitle,
  toKebabCase,
  bumpNpmVersionPatch,
  execShellCommand,
  generateActionType,
  isValidBranch,
} from '../utils/helperFunctions'
import { BranchConfig, VALID_BRANCHES, ValidBranchName } from '../constants'

export const patchport = async (
  commitId: string,
  originBranch: ValidBranchName
) => {
  const git: SimpleGit = simpleGit()

  let commitTitle: string
  try {
    commitTitle = await git.raw(['log', '--format=%s', '-n', '1', commitId])
  } catch (error) {
    console.error(
      chalk.red(
        'Failed to get commit title. Please ensure the commit ID is correct.'
      )
    )
    process.exit(1)
  }

  let descriptionForPR = getDescriptionFromTitle(commitTitle)

  console.log('\nThis commit will be cherry-picked:')
  console.log(commitTitle.trim())

  // Confirm or edit the description
  console.log('')
  const { validTitle } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'validTitle',
      message: `Correct description between the arrows?\n-> ${descriptionForPR} <-`,
      default: true,
    },
  ])

  if (!validTitle) {
    const { newDescription } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newDescription',
        message: 'Copy or write the description (should match commit above):',
      },
    ])
    descriptionForPR = newDescription
  }

  console.log('')
  const { destinationBranches } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'destinationBranches',
      message: 'Destination Branches',
      choices: VALID_BRANCHES.filter((x) => x !== originBranch),
    },
  ])

  console.log(chalk.yellow('\nFinal confirmation:'))
  const { doIt } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'doIt',
      message: `${originBranch} -> ${destinationBranches.join(' ')}`,
      default: false,
    },
  ])

  if (!doIt) {
    console.log(
      chalk.red('\nAborting... select destination branches with space bar')
    )
    process.exit(1)
  }

  for (const branch of destinationBranches) {
    if (!isValidBranch(branch, originBranch)) {
      chalk.red(`\nSkipping invalid branch: ${originBranch} -> ${branch}!`)
      continue
    }

    const { action, capAction } = generateActionType(originBranch, branch)
    const newBranchName = `${action}/from-${originBranch}-to-${branch}/${toKebabCase(descriptionForPR)}`
    const gitBranchName = BranchConfig[branch].gitName

    console.log(
      chalk.cyan(
        `\nCreating ${action} for ${BranchConfig[originBranch].capName} -> ${BranchConfig[branch].capName}...`
      )
    )

    // Checkout branch, pull, create new branch
    try {
      await git.checkout(gitBranchName)
      await git.pull('origin', gitBranchName)
      await git.checkoutLocalBranch(newBranchName)
    } catch (error) {
      console.error(chalk.red(`Failed to prepare branch ${newBranchName}.`))
      process.exit(1)
    }

    // Cherry-pick the commit
    try {
      await git.raw(['cherry-pick', commitId])
    } catch (error) {
      console.error(
        // TODO: Manually resolve commits and pick back up
        chalk.red('Cherry-pick failed, please resolve conflicts manually.')
      )
      process.exit(1)
    }

    await bumpNpmVersionPatch(git, gitBranchName)

    try {
      await git.push('origin', newBranchName)
    } catch (error) {
      console.error(chalk.red(`Failed to push branch ${newBranchName}.`))
      process.exit(1)
    }

    const prTitle = `${capAction} | ${BranchConfig[originBranch].capName} to ${BranchConfig[branch].capName} | ${commitTitle.trim()}`
    const prBody = `${capAction} PR automatically generated by PatchPort™`

    try {
      const prCommand = `gh pr create --title "${prTitle}" --body "${prBody}" --base "${gitBranchName}" --head "${newBranchName}" --label "${capAction}"`
      await execShellCommand(prCommand)
    } catch (error) {
      console.error(chalk.red('Failed to create pull request using gh CLI.'))
      console.error(error)
    }
  }

  try {
    await git.checkout(BranchConfig['qa'].gitName)
  } catch (error) {
    console.error(chalk.red('Failed to checkout to qa branch.'))
  }

  console.log(
    chalk.green('\nAll done! Go check your repository pull requests on GitHub.')
  )
  process.exit(0)
}

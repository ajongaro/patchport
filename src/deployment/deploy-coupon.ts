import simpleGit, { SimpleGit } from 'simple-git'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { execShellCommand } from '../utils/helperFunctions'

const DATE = new Date().toISOString().split('T')[0]

export async function deployCoupon(inputEnv: string) {
  const DEPLOY_ENV = inputEnv.toUpperCase()

  console.log(`Setting up deployment to ${DEPLOY_ENV} for Coupon`)

  switch (DEPLOY_ENV) {
    case 'QA':
      await setupBranch('develop', 'qa', 'qa')
      break
    case 'UAT':
      await setupBranch('qa', 'uat', 'uat')
      break
    case 'PROD':
      await setupBranch('uat', 'prod', 'master')
      break
    default:
      console.error('Invalid Environment. Please specify qa, uat, or prod.')
      process.exit(1)
  }
}

async function setupBranch(
  originBranch: string,
  targetEnv: string,
  mergeBranch: string
) {
  const git: SimpleGit = simpleGit()
  const DEPLOY_ENV = targetEnv.toUpperCase()

  console.log(`Getting latest from destination branch: ${mergeBranch} ...`)
  try {
    await git.checkout(mergeBranch)
    await git.pull('origin', mergeBranch)
  } catch (error) {
    console.error(`Failed to checkout and pull ${mergeBranch}.`, error)
    process.exit(1)
  }

  console.log(`Getting latest from origin branch: ${originBranch} ...`)
  try {
    await git.checkout(originBranch)
    await git.pull('origin', originBranch)
  } catch (error) {
    console.error(`Failed to checkout and pull ${originBranch}.`, error)
    process.exit(1)
  }

  const BRANCH = `release/${targetEnv}/${DATE}`
  console.log(`Creating new release branch: ${BRANCH}`)

  try {
    await git.checkoutBranch(BRANCH, originBranch)
  } catch (error) {
    console.error(`Failed to create branch ${BRANCH}.`, error)
    process.exit(1)
  }

  try {
    await git.merge([
      mergeBranch,
      '--strategy=ours',
      `--message=Merging ${mergeBranch} into ${BRANCH} for deployment`,
    ])
  } catch (error) {
    console.error(`Failed to merge ${mergeBranch} into ${BRANCH}.`, error)
    process.exit(1)
  }

  const { shouldPush } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldPush',
      message: `Ready to push to ${BRANCH} and create PR?`,
      default: false,
    },
  ])

  if (shouldPush) {
    try {
      await git.push(['--set-upstream', 'origin', BRANCH])
      const prTitle = `${DEPLOY_ENV} Deployment ${DATE}`
      const prBody = 'Auto Generated Deployment PR'
      const prCommand = `gh pr create --title "${prTitle}" --base "${mergeBranch}" --label "${DEPLOY_ENV} Release" --label "Do Not Merge" --body "${prBody}"`
      await execShellCommand(prCommand)
      console.log(chalk.green('Pull request created successfully!'))
    } catch (error) {
      console.error('Failed to push branch or create pull request.', error)
      process.exit(1)
    }
  } else {
    console.log('Push cancelled by user.')
  }
}

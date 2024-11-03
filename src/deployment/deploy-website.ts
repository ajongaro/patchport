import simpleGit, { SimpleGit } from 'simple-git'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { execShellCommand } from '../utils/helperFunctions'

const DATE = new Date().toISOString().split('T')[0]

export async function deploy(inputEnv: string) {
  const DEPLOY_ENV = inputEnv.toUpperCase()

  console.log(`Setting up deployment to ${DEPLOY_ENV}`)

  switch (DEPLOY_ENV) {
    case 'QA':
      await setupBranch('develop', 'qa', 'qa')
      break
    case 'UAT':
      await setupBranch('qa', 'uat', 'uat')
      await bumpVersion('qa')
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
  baseBranch: string,
  targetEnv: string,
  mergeBranch: string
) {
  const git: SimpleGit = simpleGit()
  console.log(`Setting up ${targetEnv} RC Branch...`)

  try {
    await git.checkout(baseBranch)
    await git.pull('origin', baseBranch)
  } catch (error) {
    console.error(`Failed to checkout and pull ${baseBranch}.`, error)
    process.exit(1)
  }

  const BRANCH = `release/${targetEnv}/${DATE}`
  console.log(`Creating branch: ${BRANCH}`)

  try {
    await git.checkoutLocalBranch(BRANCH)
  } catch (error) {
    console.error(`Failed to create branch ${BRANCH}.`, error)
    process.exit(1)
  }

  try {
    await git.mergeFromTo(mergeBranch, BRANCH, [
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
      const prTitle = `${targetEnv.toUpperCase()} Deployment ${DATE}`
      const prBody = 'Auto Generated Deployment PR'
      const prCommand = `gh pr create --title "${prTitle}" --base "${mergeBranch}" --label "${targetEnv.toUpperCase()} Release" --label "Do Not Merge" --body "${prBody}"`
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

async function bumpVersion(branch: string) {
  const git: SimpleGit = simpleGit()
  console.log(`Bumping ${branch} minor version...`)

  try {
    await git.checkout(branch)
    await git.pull('origin', branch)
  } catch (error) {
    console.error(`Failed to checkout and pull ${branch}.`, error)
    process.exit(1)
  }

  try {
    await execShellCommand('npm version minor --git-tag-version=false')
  } catch (error) {
    console.error('Failed to bump npm version.', error)
    process.exit(1)
  }

  const diff = await git.diff()
  console.log('Diff for version bump commit:')
  console.log(diff)

  const { shouldCommit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldCommit',
      message: `Ready to commit and push version bump on branch ${branch}?`,
      default: false,
    },
  ])

  if (shouldCommit) {
    try {
      await git.add('./package.json')
      await git.commit('Bump minor version')
      await git.push('origin', branch)
      console.log(chalk.green('Version bump committed and pushed.'))
    } catch (error) {
      console.error('Failed to commit and push version bump.', error)
      process.exit(1)
    }
  } else {
    console.log('Commit cancelled by user.')
  }
}

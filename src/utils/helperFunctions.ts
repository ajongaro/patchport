import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { SimpleGit } from 'simple-git'
import { exec } from 'child_process'
import { VALID_BRANCHES, ValidBranchName } from '../constants'
import inquirer from 'inquirer'

export const displaySplashScreen = () => {
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log(
    chalk.blue('     ____        __       __    ____             __ ')
  )
  console.log(
    chalk.blue('    / __ \\____ _/ /______/ /_  / __ \\____  _____/ /_')
  )
  console.log(
    chalk.blue('   / /_/ / __ `/ __/ ___/ __ \\/ /_/ / __ \\/ ___/ __/')
  )
  console.log(
    chalk.yellow('  / ____/ /_/ / /_/ /__/ / / / ____/ /_/ / /  / /_  ')
  )
  console.log(
    chalk.yellow(' /_/    \\__,_/\\__/\\___/_/ /_/_/    \\____/_/   \\__/  ')
  )
  console.log('')
  console.log('╚══════════════════════════════════════════════════════╝\n')
}

export const getDescriptionFromTitle = (title: string): string => {
  const parts = title.split('|')
  if (parts.length >= 3) {
    return parts[2].split('(')[0].trim()
  }
  return title
}

export const toKebabCase = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type ActionType =
  | { action: 'backport'; capAction: 'Backport' }
  | { action: 'patch'; capAction: 'Patch' }

export const generateActionType = (
  origin: ValidBranchName,
  destination: ValidBranchName
): ActionType => {
  const originIndex = VALID_BRANCHES.indexOf(origin)
  const destinationIndex = VALID_BRANCHES.indexOf(destination)

  if (originIndex > destinationIndex) {
    return { action: 'backport', capAction: 'Backport' }
  }
  return { action: 'patch', capAction: 'Patch' }
}

export function isValidBranch(
  branch: string,
  originBranch: ValidBranchName
): branch is ValidBranchName {
  return branch !== originBranch && VALID_BRANCHES.includes(branch)
}

export const getActiveVersion = (): string => {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  return packageJson.version
}

export const bumpNpmVersionPatch = async (git: SimpleGit, branch: string) => {
  const previousVersion = getActiveVersion()
  console.log(`Current ${branch} npm version: ${previousVersion}`)
  console.log('Bumping patch version...')

  // Execute npm version patch without git tag
  await new Promise<void>((resolve, reject) => {
    const { exec } = require('child_process')
    exec('npm version patch --no-git-tag-version', (error: any) => {
      if (error) reject(error)
      else resolve()
    })
  })

  const newVersion = getActiveVersion()
  console.log(
    chalk.yellow(
      `Version for ${branch} will go from ${previousVersion} -> ${newVersion}!`
    )
  )

  await git.add('package.json')
  await git.commit(`Version bump ${previousVersion} -> ${newVersion}`)
}

export const execShellCommand = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else if (stderr) {
        reject(stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}

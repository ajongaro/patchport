import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { SimpleGit } from 'simple-git'
import { exec, spawn } from 'child_process'
import { VALID_BRANCHES, ValidBranchName } from '../constants'

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

export const execShellCommand = (
  cmd: string,
  args: string[] = [],
  options: { interactive?: boolean } = {}
): Promise<string | void> => {
  if (options.interactive) {
    // Use spawn for interactive commands
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: 'inherit' })

      child.on('error', (error) => {
        reject(error)
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Command failed with exit code ${code}`))
        }
      })
    })
  } else {
    // Use exec for non-interactive commands
    return new Promise((resolve, reject) => {
      exec([cmd, ...args].join(' '), (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message)
        } else {
          resolve(stdout)
        }
      })
    })
  }
}

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { SimpleGit } from 'simple-git'
import { exec } from 'child_process'
import { Branch, VALID_BRANCHES, ValidBranchName } from '../constants'

export const displayTitle = () => {
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
  console.log('╚══════════════════════════════════════════════════════╝')
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

export const capitalize = (input: string): string => {
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
}

// use object?
export const caseEnv = (input: string): string => {
  const envs: { [key: string]: string } = {
    develop: 'Develop',
    qa: 'QA',
    uat: 'UAT',
    prod: 'Prod',
  }
  return envs[input.toLowerCase()] || input
}

export const isPatchOrBackport = (
  origin: ValidBranchName,
  destination: ValidBranchName
): string => {
  const originIndex = VALID_BRANCHES.indexOf(origin)
  const destinationIndex = VALID_BRANCHES.indexOf(destination)

  if (originIndex > destinationIndex) {
    return 'backport'
  }
  return 'patch'
}

export const validateBranches = (
  origin: ValidBranchName,
  destination: ValidBranchName
): boolean => {
  const isValidOrigin = VALID_BRANCHES.includes(origin)
  const isValidDestination = VALID_BRANCHES.includes(destination)

  return isValidOrigin && isValidDestination && origin !== destination
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

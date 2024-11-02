export type Branch = {
  name: ValidBranchName
  capName: ValidCapName
  gitName: ValidGitName
}

export type ValidBranchName = 'develop' | 'qa' | 'uat' | 'prod'
type ValidCapName = 'Develop' | 'QA' | 'UAT' | 'Prod'
type ValidGitName = 'develop' | 'qa' | 'uat' | 'master'

export const VALID_BRANCHES: ValidBranchName[] = [
  'develop',
  'qa',
  'uat',
  'prod',
]

export const BranchConfig: Record<ValidBranchName, Branch> = {
  develop: {
    name: 'develop',
    capName: 'Develop',
    gitName: 'develop',
  },
  qa: {
    name: 'qa',
    capName: 'QA',
    gitName: 'qa',
  },
  uat: {
    name: 'uat',
    capName: 'UAT',
    gitName: 'uat',
  },
  prod: {
    name: 'prod',
    capName: 'Prod',
    gitName: 'master', // Assuming 'prod' corresponds to 'master' in git
  },
}

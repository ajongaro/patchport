import { execShellCommand } from '../main'

export const checkGhAuthStatus = async (): Promise<boolean> => {
  try {
    await execShellCommand('gh auth status')
    return true
  } catch (error) {
    // The command failed, likely due to not being authenticated
    return false
  }
}

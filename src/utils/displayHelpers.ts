import ora from 'ora'

export async function runWithSpinner<T>(fn: () => Promise<T>): Promise<T> {
  const spinner = ora({
    text: 'Awaiting input...',
    spinner: {
      interval: 80,
      frames: [
        '|       ',
        ' |      ',
        '  |     ',
        '   |    ',
        '    |   ',
        '     |  ',
        '      | ',
        '       |',
        '      | ',
        '     |  ',
        '    |   ',
        '   |    ',
        '  |     ',
        ' |      ',
      ],
    },
  }).start()
  try {
    const result = await fn()
    spinner.succeed('Done')
    return result
  } catch (error) {
    spinner.fail('An error occurred')
    throw error
  }
}

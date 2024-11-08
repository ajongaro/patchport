# PatchPort

PatchPort is a command-line tool designed to simplify the process of cherry-picking commits across branches in a Git repository. It automates the creation of new branches, cherry-picks commits, and generates pull requests, making it easier for developers to manage their code changes.

## Features

- **Cherry-Pick Commits**: Easily cherry-pick commits from one branch to multiple destination branches.
- **Branch Management**: Automatically creates new branches based on the specified commit and destination branches.
- **Pull Request Generation**: Automatically generates pull requests using the GitHub CLI for the newly created branches.
- **Interactive Prompts**: User-friendly prompts to confirm commit descriptions and destination branches.
- **Error Handling**: Robust error handling to ensure smooth operation and informative feedback.

## Upcoming Features

- **Multiple Cherry-Picks**: Add multiple commits to move in a single PR across destination branches.
- **Summarize Work**: LLM API call to summarize work included in patch, or at minimum, combine branch descriptions.
- **Generalized ENVs**: A more flexible interface for environment names that can be used across codebases.
- **General Deployment**: Create all or specific deployment releases for multiple codebases.

## Installation

To install PatchPort, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/patchport.git
   cd patchport
   ```

2. **Install Dependencies**:
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   npm link
   ```

3. **Install GitHub CLI**:
   Make sure you have the GitHub CLI installed on your machine. You can find installation instructions [here](https://cli.github.com/).

4. **Configure Git**:
   Ensure your Git is configured with your user information:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## Usage

To use PatchPort, run the following command in your terminal:

```bash
patchport --commit <commitId> --origin <branch>
```

or, simply run `patchport` and select your options.

### Parameters

- `-c --commit <commitId>`: The ID of the commit you want to cherry-pick.
- `-o --origin <branch>`: The branch from which the commit will be cherry-picked.

### Example

```bash
patchport --commit abc123 --origin main
```

This command will cherry-pick the commit with ID `abc123` from the `main` branch to the selected destination branches.

## Contributing

I mean, submit a PR if you really want to.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Chalk](https://github.com/chalk/chalk) for colorful terminal output.
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) for interactive command-line prompts.
- [Simple Git](https://github.com/steveukx/git-js) for simplified Git commands.

# Contributing to Anvil

Thank you for your interest in contributing to Anvil! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed and what behavior you expected
- Include screenshots if applicable
- Include your environment details (OS, Node.js version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful
- List some examples of how the feature would be used
- Specify if you're willing to implement the feature

### Contributing Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add or update tests as necessary
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/anvil.git
   cd anvil
   ```

2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Start the development environment:
   ```bash
   npm run dev:full
   ```

This will start both the server (port 3000) and client development server.

### Project Structure

```
anvil/
├── server.js              # Express server
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── contexts/       # React contexts
├── templates/              # Document templates
├── examples/               # Example documents
└── config.json            # Factory configuration
```

## Pull Request Process

1. **All pull requests require approval** from the project maintainer (Darcy Davidson) before merging
2. Ensure your PR description clearly describes the problem and solution
3. Include the relevant issue number if applicable
4. Update the README.md with details of changes if needed
5. Ensure all tests pass and add new tests for new functionality
6. Follow the coding standards outlined below
7. Update documentation as necessary

### PR Requirements

- [ ] Code follows the project's coding standards
- [ ] Tests are included for new functionality
- [ ] All existing tests pass
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages are clear and descriptive
- [ ] No merge conflicts with main branch

## Coding Standards

### JavaScript/JSX

- Use modern ES6+ syntax
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Use async/await for asynchronous operations

### React Components

- Use functional components with hooks
- Keep components focused on a single responsibility
- Use proper prop types or TypeScript definitions
- Handle loading and error states appropriately
- Follow React best practices for performance

### CSS

- Use CSS modules when possible
- Follow BEM naming convention for CSS classes
- Keep styles organized and maintainable
- Ensure responsive design principles

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Testing

### Running Tests

```bash
# Run client tests
cd client && npm test

# Run tests in watch mode
cd client && npm run test:watch
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write component tests for React components
- Ensure good test coverage for new features
- Follow the existing test patterns and structure

## Issue Reporting

### Before Submitting an Issue

- Check the existing issues to avoid duplicates
- Try to reproduce the issue with the latest version
- Gather all relevant information about your environment

### Issue Template

Please use the following template when reporting issues:

```
**Bug Report / Feature Request**

**Description:**
A clear and concise description of the issue or feature request.

**Steps to Reproduce:** (for bugs)
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:** (for bugs)
What actually happened.

**Environment:**
- OS: [e.g., Windows 10, macOS 12.0]
- Browser: [e.g., Chrome 96, Firefox 94]
- Node.js Version: [e.g., 16.14.0]
- Anvil Version: [e.g., 7.4.1]

**Additional Context:**
Add any other context, screenshots, or relevant information.
```

## Questions?

If you have questions about contributing, please feel free to:

- Open an issue with the `question` label
- Contact the maintainer through GitHub

Thank you for contributing to Anvil!
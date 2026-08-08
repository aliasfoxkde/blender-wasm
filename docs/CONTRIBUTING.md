# Contributing to Blender Web Edition

## Welcome!

We're excited that you're interested in contributing to Blender Web Edition. This document provides guidelines and instructions for contributing.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/blender-wasm.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests: `pnpm test:run`
7. Run linting: `pnpm lint`
8. Commit: `git commit -m 'feat: add your feature'`
9. Push: `git push origin feature/your-feature-name`
10. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/aliasfoxkde/blender-wasm.git
cd blender-wasm

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Common Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm test:run     # Run tests once
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript checks
```

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Write unit tests for new modules
- Keep functions small and focused
- Document complex logic with comments

## Commit Messages

We follow the Conventional Commits specification:

```
feat(scope): add new feature
fix(scope): fix a bug
docs(scope): update documentation
style(scope): formatting changes
refactor(scope): code refactoring
test(scope): add or update tests
chore(scope): maintenance tasks
```

Examples:
- `feat(ai): add scene graph API`
- `fix(storage): handle OPFS quota exceeded`
- `docs(readme): update installation instructions`

## Pull Request Process

1. **Open an issue first** for significant changes
2. **Keep PRs focused** - one feature or fix per PR
3. **Update documentation** if needed
4. **Add tests** for new functionality
5. **Ensure all checks pass** (lint, typecheck, tests)

### PR Template

```markdown
## Description
Brief description of the change

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how the change was tested

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No linting errors
```

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Error messages or logs

### Feature Requests

Include:
- Clear description of the feature
- Use case / motivation
- Possible implementation approach
- Any relevant references

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0-or-later license.

## Questions?

- Open an issue for questions
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

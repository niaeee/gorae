# CLAUDE.md - AI Assistant Guide for gorae

**Last Updated**: 2025-11-17
**Repository**: niaeee/gorae

## Table of Contents
- [Repository Overview](#repository-overview)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Git Workflow](#git-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Practices](#documentation-practices)
- [Common Tasks](#common-tasks)
- [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Repository Overview

### Purpose
The gorae repository is currently in its initial setup phase. This document serves as the primary guide for AI assistants to understand the codebase structure, development workflows, and conventions.

### Technology Stack
*To be determined as the project evolves*

### Key Goals
- Maintain clean, readable, and maintainable code
- Follow consistent coding conventions across the codebase
- Implement comprehensive testing for all features
- Provide clear documentation for all major components

---

## Project Structure

### Recommended Directory Layout

```
gorae/
├── .github/                 # GitHub workflows, issue templates, PR templates
├── docs/                    # Documentation files
├── src/                     # Source code
│   ├── components/          # Reusable components (if applicable)
│   ├── services/            # Business logic and services
│   ├── utils/               # Utility functions and helpers
│   ├── types/               # Type definitions (if TypeScript)
│   └── tests/               # Test files
├── scripts/                 # Build and utility scripts
├── config/                  # Configuration files
├── tests/                   # Integration and E2E tests
├── .gitignore              # Git ignore patterns
├── README.md               # Project overview and setup instructions
├── CLAUDE.md               # This file - AI assistant guide
├── CONTRIBUTING.md         # Contribution guidelines
└── package.json            # Dependencies (if Node.js project)
```

**Note**: The actual structure should be adapted based on the project's technology stack and requirements.

---

## Development Workflow

### Setting Up the Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gorae
   ```

2. **Install dependencies**
   ```bash
   # Add installation commands based on project type
   # e.g., npm install, pip install -r requirements.txt, etc.
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env` (if applicable)
   - Configure necessary environment variables
   - Never commit sensitive credentials

### Branch Strategy

- **Main branch**: Stable, production-ready code
- **Feature branches**: `feature/<feature-name>` or `claude/<session-id>`
- **Bug fixes**: `fix/<bug-description>`
- **Hot fixes**: `hotfix/<issue>`

### Development Process

1. Create or checkout feature branch
2. Make incremental changes with clear commits
3. Write tests for new functionality
4. Ensure all tests pass before committing
5. Update documentation as needed
6. Create pull request with detailed description

---

## Code Conventions

### General Principles

1. **Readability First**: Code should be self-documenting
2. **DRY (Don't Repeat Yourself)**: Extract common patterns into reusable functions
3. **SOLID Principles**: Follow object-oriented design principles
4. **Security**: Never introduce vulnerabilities (SQL injection, XSS, command injection, etc.)

### Naming Conventions

- **Variables**: Use descriptive names (e.g., `userProfile` not `up`)
- **Functions**: Verb-based names describing actions (e.g., `getUserById`, `calculateTotal`)
- **Classes**: PascalCase for class names (e.g., `UserService`, `DatabaseConnection`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `API_BASE_URL`)

### Code Style

- **Indentation**: Consistent spacing (2 or 4 spaces, no tabs unless project standard)
- **Line Length**: Maximum 80-120 characters per line
- **Comments**:
  - Use comments to explain "why", not "what"
  - Keep comments up-to-date with code changes
  - Add JSDoc/docstrings for public APIs

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Log errors appropriately
- Don't swallow exceptions without handling

---

## Git Workflow

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example**:
```
feat(auth): add JWT token authentication

Implement JWT-based authentication system with refresh tokens.
Includes middleware for protected routes and token validation.

Closes #123
```

### Branch Naming

- Feature branches: `feature/user-authentication`
- Claude AI branches: `claude/claude-md-<session-id>`
- Bug fixes: `fix/login-validation-error`

### Push Strategy

Always use:
```bash
git push -u origin <branch-name>
```

For Claude AI branches, ensure branch name starts with `claude/` and ends with matching session ID.

---

## Testing Guidelines

### Test Coverage

- Aim for minimum 80% code coverage
- All new features must include tests
- Critical paths require comprehensive test coverage

### Test Types

1. **Unit Tests**: Test individual functions/components in isolation
2. **Integration Tests**: Test interactions between components
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Test system performance under load (if applicable)

### Test Organization

```
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── components/
├── integration/
└── e2e/
```

### Running Tests

```bash
# Run all tests
npm test  # or pytest, go test, etc.

# Run specific test suite
npm test -- --grep "authentication"

# Run with coverage
npm test -- --coverage
```

---

## Documentation Practices

### Code Documentation

- **Functions**: Document parameters, return values, and side effects
- **Classes**: Document purpose, properties, and usage examples
- **Complex Logic**: Add inline comments explaining the approach

### README.md Requirements

1. Project description and purpose
2. Installation instructions
3. Usage examples
4. Configuration options
5. API documentation (if applicable)
6. Contributing guidelines
7. License information

### API Documentation

- Use OpenAPI/Swagger for REST APIs
- Include request/response examples
- Document error codes and messages
- Provide authentication requirements

---

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/<feature-name>`
2. Plan implementation using TodoWrite for complex features
3. Write tests first (TDD approach recommended)
4. Implement feature incrementally
5. Ensure all tests pass
6. Update documentation
7. Commit with descriptive message
8. Push and create pull request

### Fixing a Bug

1. Create bug fix branch: `git checkout -b fix/<bug-description>`
2. Write failing test that reproduces the bug
3. Fix the bug
4. Ensure test passes
5. Check for similar issues elsewhere
6. Commit and push

### Refactoring Code

1. Ensure current tests pass
2. Make incremental refactoring changes
3. Run tests after each change
4. Update tests if necessary
5. Document reasons for refactoring in commit message

---

## AI Assistant Guidelines

### Code Analysis Approach

1. **Explore First**: Use Task tool with Explore agent for codebase exploration
2. **Read Strategically**: Read relevant files in parallel when possible
3. **Search Efficiently**: Use Grep for content search, Glob for file patterns
4. **Understand Context**: Review related files to understand dependencies

### Task Management

1. **Use TodoWrite**: For complex multi-step tasks, create todo list
2. **Update Progress**: Mark tasks as in_progress before starting, completed when done
3. **One at a Time**: Only one task should be in_progress at any time
4. **Break Down**: Split large tasks into smaller, manageable subtasks

### Security Considerations

Always check for and prevent:
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- Insecure Deserialization
- Insufficient Authentication/Authorization
- Sensitive Data Exposure
- XML External Entities (XXE)
- Broken Access Control
- Security Misconfiguration

### Code Quality Checklist

Before completing any task, verify:
- [ ] Code follows project conventions
- [ ] No security vulnerabilities introduced
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No hardcoded credentials or secrets
- [ ] Error handling implemented
- [ ] Edge cases considered
- [ ] Code is readable and maintainable

### Communication Style

- Be concise and technical
- Output text directly, not through echo/bash commands
- Use GitHub-flavored markdown for formatting
- Reference code with `file_path:line_number` format
- Avoid unnecessary emojis unless requested

### Best Practices

1. **Parallel Operations**: Use parallel tool calls when operations are independent
2. **Sequential Operations**: Use sequential calls when operations depend on each other
3. **Speculative Reading**: Read multiple potentially relevant files in parallel
4. **Avoid Assumptions**: Don't guess values for required parameters
5. **Tool Selection**: Use specialized tools (Read, Edit, Write) over bash commands
6. **Context Awareness**: Maintain working directory, avoid unnecessary `cd` commands

---

## Additional Resources

### External Documentation
- Project-specific documentation links (to be added)
- Technology stack documentation (to be added)
- API references (to be added)

### Contact Information
- Repository Owner: niaeee
- Issue Tracker: GitHub Issues

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-17 | Initial CLAUDE.md creation for new repository |

---

**Note**: This document should be updated as the project evolves. All contributors and AI assistants should keep this file current with any changes to project structure, conventions, or workflows.

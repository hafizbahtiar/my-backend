# Contributing to Template Backend Hono

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/template-backend-hono.git
   cd template-backend-hono
   ```

3. **Install dependencies**
   ```bash
   bun install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in the required values
3. Generate JWT secret: `bun run generate:secret`

### Running the Development Server

```bash
bun run dev
```

The server will run on `http://localhost:7000`

## Making Changes

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Add JSDoc comments for public functions
- Keep functions small and focused

### Testing

- Add tests for new features
- Ensure all existing tests pass
- Run `bun run test` before committing

### Committing Changes

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(auth): add password reset functionality

- Implement password reset request endpoint
- Add email verification flow
- Update documentation

Closes #123
```

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Update tests** to reflect your changes
3. **Ensure CI passes** (linting, type-checking, tests)
4. **Create a pull request** with a clear description
5. **Link related issues** using "Closes #issue-number"

### PR Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings

## Project Structure

```
src/
├── config/       # Configuration files
├── models/       # Mongoose models (7)
├── middleware/   # Hono middleware (auth, rate-limit, security, monitoring, static-files)
├── services/     # Business logic (8 services)
├── routes/       # API routes (41 endpoints)
├── templates/    # Email templates
├── utils/        # Utility functions (password, jwt, errors, storage, logger)
└── server.ts     # Entry point

doc/              # Documentation (11 comprehensive guides)
load-tests/       # k6 load testing scripts
.github/          # GitHub Actions (CI/CD workflows)
scripts/          # Utility scripts (JWT secret generation)
```

## Development Guidelines

### Security

- Never commit sensitive data (secrets, credentials)
- Use environment variables for configuration
- Follow security best practices
- Validate all user input

### Performance

- Optimize database queries
- Use appropriate indexes
- Implement caching where needed
- Monitor API response times

### Error Handling

- Use custom error classes
- Provide meaningful error messages
- Log errors appropriately
- Return appropriate HTTP status codes

## Getting Help

- Read the [documentation](doc/)
- Check existing [issues](https://github.com/your-username/template-backend-hono/issues)
- Open a new [issue](https://github.com/your-username/template-backend-hono/issues/new) for questions

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's guidelines

## Recognition

Contributors will be acknowledged in:
- README.md
- Release notes
- Project documentation

Thank you for contributing! 🎉


# CI/CD Guide

**Tech Stack:** Bun + Hono + GitHub Actions  
**Date:** 2025

---

## Overview

This project includes a comprehensive CI/CD pipeline using GitHub Actions for automated testing, linting, security auditing, and build verification.

---

## 🚀 CI/CD Pipeline

### Main Workflow (`.github/workflows/ci.yml`)

The main CI pipeline runs automatically on:
- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop` branches

#### Workflow Jobs

1. **Lint and Type Check** ✅
   - Runs TypeScript compilation check (`tsc --noEmit`)
   - Verifies code formatting (if Prettier is configured)
   - Ensures no type errors

2. **Tests** 🧪
   - Runs all tests using `bun test`
   - Skips if no tests are configured (graceful degradation)

3. **Security Audit** 🔒
   - Runs `bun pm audit` to check for vulnerable dependencies
   - Identifies security vulnerabilities in dependencies

4. **Build** 🏗️
   - Verifies the project builds successfully
   - Checks for build artifacts
   - **Note:** Bun doesn't require a build step, but this verifies the environment

### Release Workflow (`.github/workflows/release.yml`)

Automatically creates GitHub releases when you push a tag:

```bash
# Create a release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

The workflow will:
- Run tests
- Generate release notes from git commits
- Create a GitHub release with the notes

---

## 📋 Available Scripts

### Development
```bash
bun run dev          # Start development server with hot reload
bun run start        # Start production server
```

### Code Quality
```bash
bun run lint         # Run TypeScript type checking
bun run type-check   # Alias for lint
```

### Testing
```bash
bun run test         # Run all tests
```

### Build
```bash
bun run build        # Build check (Bun doesn't require build)
```

### Secrets
```bash
bun run generate:secret         # Generate JWT secret (.env)
bun run generate:secret:prod    # Generate for production
bun run generate:secret:dev     # Generate for development
bun run generate:secret:test    # Generate for testing
```

---

## 🔧 Configuration

### GitHub Actions Variables

No secret variables are required for the CI pipeline to run. The pipeline is designed to work without any configuration.

### Environment Variables for Deployment

If you want to add a deployment step, you'll need to configure:

1. **Repository Secrets** (Settings → Secrets and variables → Actions):
   - `DEPLOY_API_KEY` - API key for your deployment platform
   - `DEPLOY_URL` - Deployment endpoint
   - Any other platform-specific credentials

2. **Uncomment the deployment step** in `.github/workflows/ci.yml`:
   ```yaml
   deploy:
     name: Deploy to Production
     runs-on: ubuntu-latest
     needs: [lint-and-type-check, test, build]
     if: github.ref == 'refs/heads/main'
     steps:
       - name: Deploy
         run: |
           echo "Add your deployment steps here"
   ```

---

## 🎯 Branch Strategy

### Recommended Workflow

1. **Feature branches** → `feature/feature-name`
2. **Bug fixes** → `fix/bug-description`
3. **Hotfixes** → `hotfix/issue-description`

### Branch Protection

Recommended settings for `main` branch:
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Requear branches to be up to date
- ✅ Include administrators
- ✅ Required status checks:
  - Lint and Type Check
  - Run Tests
  - Security Audit
  - Build

---

## 📝 Pull Request Template

Use the provided PR template (`.github/PULL_REQUEST_TEMPLATE.md`) to ensure consistent PR descriptions.

### PR Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings

---

## 🐛 Issue Templates

### Bug Report

Use `.github/ISSUE_TEMPLATE/bug_report.md` when reporting bugs.

**Include:**
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error messages
- Screenshots if applicable

### Feature Request

Use `.github/ISSUE_TEMPLATE/feature_request.md` for suggesting features.

**Include:**
- Feature description
- Motivation
- Proposed solution
- Use cases
- Alternatives considered

---

## 🔒 Security

### Automated Security Checks

1. **Dependency Auditing**
   - Automatic scanning with `bun pm audit`
   - Identifies known vulnerabilities

2. **Secret Detection**
   - Never commit `.env` files
   - Use GitHub Secrets for sensitive data
   - Review PRs for exposed secrets

3. **Code Security**
   - Type checking prevents many security issues
   - Linting catches common mistakes

### Best Practices

- ✅ Review all dependency updates
- ✅ Use specific dependency versions
- ✅ Regularly update dependencies
- ✅ Monitor security advisories
- ✅ Use environment variables for secrets
- ✅ Never commit credentials

---

## 🚢 Deployment (Optional)

### Deployment Platforms

The CI/CD pipeline is ready for deployment to any platform:

#### Railway
```bash
railway up
```

#### Render
```bash
render deploy
```

#### Vercel
```bash
vercel deploy --prod
```

#### Self-Hosted
```bash
git pull origin main
bun install
bun run start
pm2 start ecosystem.config.js   # API + Worker (my-backend, my-backend-worker)
```

---

## 📊 Monitoring

### CI/CD Metrics

Track your pipeline health:
- **Success Rate**: How often builds succeed
- **Build Time**: Duration of CI runs
- **Test Coverage**: Percentage of code covered by tests
- **Security Issues**: Count of vulnerabilities found

### GitHub Insights

View pipeline analytics in your repository:
- **Actions** tab → **Insights**
- Track workflow runs and duration
- Identify bottlenecks

---

## 🔧 Troubleshooting

### Build Failures

**TypeScript errors:**
```bash
# Run locally to see errors
bun run lint
```

**Test failures:**
```bash
# Run tests locally
bun test
```

**Missing dependencies:**
```bash
# Reinstall dependencies
bun install
```

### Common Issues

1. **"Package not found"**
   - Ensure `package.json` has all dependencies
   - Run `bun install` locally

2. **"Type errors"**
   - Check TypeScript version compatibility
   - Update type definitions if needed

3. **"Tests failing"**
   - Run tests locally to reproduce
   - Check for environment-specific issues

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Bun Documentation](https://bun.sh/docs)
- [Hono Documentation](https://hono.dev/)
- [Contributing Guide](../CONTRIBUTING.md)

---

## ✅ CI/CD Checklist

- [x] Automated testing on PRs
- [x] Type checking
- [x] Security auditing
- [x] Build verification
- [x] Pull request templates
- [x] Issue templates
- [x] Contributing guide
- [ ] Deployment automation (optional)
- [ ] Test coverage reporting (optional)
- [ ] Performance monitoring (optional)

---

*Last Updated: 2025*


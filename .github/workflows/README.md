# GitHub Workflows

This directory contains GitHub Actions workflows for automating releases and publishing.

## Workflows

### 1. Manual Release (`manual-release.yml`)

**Purpose:** Manually trigger a release with version bump selection and npm tag options.

**How to use:**
1. Go to the Actions tab in GitHub
2. Select "Manual Release" workflow
3. Click "Run workflow"
4. Select options:
   - **Version bump type:** `patch`, `minor`, or `major`
   - **NPM dist-tag:** `latest`, `beta`, `alpha`, `next`, or `canary`
   - **Pre-release:** Check if this is a pre-release

**What it does:**
1. Runs tests and typecheck
2. Builds the package
3. Bumps version in package.json
4. Creates a git tag
5. Pushes changes to main
6. Publishes to npm with specified tag
7. Creates a GitHub release

**Version bump examples:**
- `patch`: 0.0.1 → 0.0.2
- `minor`: 0.0.1 → 0.1.0
- `major`: 0.0.1 → 1.0.0

**NPM tag examples:**
```bash
# Latest (default, recommended for stable releases)
npm install @atomic-ehr/core
# or
npm install @atomic-ehr/core@latest

# Beta (for beta testing)
npm install @atomic-ehr/core@beta

# Canary (for development/testing)
npm install @atomic-ehr/core@canary
```

### 2. Publish to npm (`publish.yml`)

**Purpose:** Automatically publish when a version tag is pushed.

**How to use:**
```bash
# Create and push a tag manually
git tag v0.1.0
git push origin v0.1.0
```

**What it does:**
1. Triggered by pushing tags like `v*`
2. Runs tests and typecheck
3. Builds the package
4. Publishes to npm
5. Creates a GitHub release

### 3. Canary Release (`canary-release.yml`)

**Purpose:** Automatically publish canary versions on every push to main.

**What it does:**
- Creates canary versions (e.g., `0.0.1-canary.20241001123045`)
- Publishes with `@canary` tag
- Useful for testing unreleased changes

## Setup Requirements

### Secrets

You need to configure these secrets in your GitHub repository:

1. **NPM_TOKEN**
   - Go to npmjs.com → Access Tokens → Generate New Token
   - Select "Automation" type
   - Copy the token
   - Go to GitHub repo → Settings → Secrets → New repository secret
   - Name: `NPM_TOKEN`
   - Value: Your npm token

2. **GITHUB_TOKEN**
   - Automatically provided by GitHub Actions
   - No setup required

### Permissions

The workflows require these permissions:
- `contents: write` - To push tags and create releases
- `id-token: write` - For npm provenance

These are configured in the workflow files.

## Release Workflow Recommendations

### Stable Release (Production)
```
Workflow: Manual Release
Version: patch/minor/major (as appropriate)
NPM Tag: latest
Pre-release: false
```

### Beta Release
```
Workflow: Manual Release
Version: patch
NPM Tag: beta
Pre-release: true
```

### Alpha/Testing Release
```
Workflow: Manual Release
Version: patch
NPM Tag: alpha or canary
Pre-release: true
```

### Development/Canary (Automatic)
```
Workflow: Canary Release (automatic on push to main)
NPM Tag: canary
```

## Version Numbering Strategy

Following Semantic Versioning (semver):

- **Major (X.0.0)**: Breaking changes
  - Changes to public API that aren't backward compatible
  - Removal of deprecated features
  - Major architectural changes

- **Minor (0.X.0)**: New features
  - New functionality that's backward compatible
  - New service methods via declaration merging
  - New type utilities

- **Patch (0.0.X)**: Bug fixes
  - Bug fixes
  - Documentation updates
  - Internal refactoring

## Examples

### Release a new patch version
```
1. Go to Actions → Manual Release → Run workflow
2. Select "patch" for version bump
3. Select "latest" for npm tag
4. Uncheck "pre-release"
5. Run
```

Result: `0.0.1` → `0.0.2` published as `@latest`

### Release a beta version
```
1. Go to Actions → Manual Release → Run workflow
2. Select "patch" for version bump
3. Select "beta" for npm tag
4. Check "pre-release"
5. Run
```

Result: `0.0.2` → `0.0.3-beta.0` published as `@beta`

### Manual tag and publish
```bash
# Update version in package.json
npm version minor

# Push tag
git push origin v0.1.0

# publish.yml workflow triggers automatically
```

## Troubleshooting

### "npm ERR! 403 Forbidden"
- Check that NPM_TOKEN secret is set correctly
- Verify the token has "Automation" permissions
- Ensure package name in package.json is correct

### "Permission denied to github-actions[bot]"
- Check that workflow has `contents: write` permission
- Verify branch protection rules allow bot commits

### Tests fail during workflow
- Run tests locally first: `bun test`
- Check typecheck: `bun run typecheck`
- Review workflow logs in Actions tab

## Best Practices

1. **Always run tests locally first**
   ```bash
   bun test
   bun run typecheck
   bun run build
   ```

2. **Use semantic versioning**
   - Breaking changes = major
   - New features = minor
   - Bug fixes = patch

3. **Test beta/alpha releases before latest**
   - Release as @beta first
   - Test in production-like environment
   - Promote to @latest when stable

4. **Update CHANGELOG.md**
   - Document changes before releasing
   - Reference issues and PRs

5. **Use canary for testing**
   - Automatic on every push
   - Test breaking changes
   - Validate before official release

## Support

For issues with workflows:
- Check the Actions tab for detailed logs
- Review this README
- Open an issue in the repository

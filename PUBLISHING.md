# 📦 Publishing Guide for SUNAPI Node.js SDK

## Prerequisites

1. **npm account**: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Make sure you have npm installed
3. **GitHub repository** (optional but recommended)

## Step-by-Step Publishing Process

### 1. Verify Your Setup

```bash
# Check npm is logged in
npm whoami

# If not logged in
npm login
```

### 2. Pre-publish Checklist

```bash
# Make sure everything builds correctly
npm run build

# Run all tests
npm test

# Check for any linting issues
npm run lint

# Verify the package contents
npm pack --dry-run
```

### 3. Choose Your Package Name

Since `sunapi-node` might be taken, you have several options:

- `@your-username/sunapi-node` (scoped package)
- `samsung-sunapi` 
- `sunapi-sdk`
- `samsung-sunapi-client`
- `wisenet-sunapi`

### 4. Update Package Name (if needed)

If the name is taken, update `package.json`:

```json
{
  "name": "@jacobross/sunapi-node",
  // ... rest of config
}
```

### 5. Publish Commands

```bash
# For public packages
npm publish

# For scoped packages (make them public)
npm publish --access public

# For testing first (publishes to a test registry)
npm publish --dry-run
```

### 6. Version Management

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Then publish
npm publish
```

## Alternative: GitHub Packages

You can also publish to GitHub Packages:

### 1. Update package.json for GitHub

```json
{
  "name": "@jacobross/sunapi-node",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

### 2. Create `.npmrc` file

```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@jacobross:registry=https://npm.pkg.github.com
```

### 3. Publish to GitHub

```bash
npm publish
```

## Recommended Approach

I recommend starting with a **scoped package** on npm:

1. Use `@jacobross/sunapi-node` as the package name
2. This ensures uniqueness and avoids naming conflicts
3. Users can install with: `npm install @jacobross/sunapi-node`

## Post-Publishing Steps

1. **Tag the release** on GitHub
2. **Create release notes** with changelog
3. **Update documentation** with installation instructions
4. **Share on social media** or relevant communities

## Troubleshooting

- **403 Forbidden**: Package name might be taken or you need to login
- **402 Payment Required**: Trying to publish private package without paid plan
- **EPUBLISHCONFLICT**: Version already exists, bump version number

## Maintenance

- Use semantic versioning (semver)
- Keep a CHANGELOG.md
- Test thoroughly before each release
- Consider using GitHub Actions for automated publishing

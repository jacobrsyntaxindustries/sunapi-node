#!/bin/bash

# Quick Publishing Script for SUNAPI Node.js SDK
# Run this after you've created your npm account and logged in

echo "🚀 Publishing SUNAPI Node.js SDK to npm"
echo "========================================"

echo "Step 1: Checking if logged into npm..."
if npm whoami > /dev/null 2>&1; then
    echo "✅ Logged in as: $(npm whoami)"
else
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

echo "Step 2: Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "Step 3: Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed"
    exit 1
fi

echo "Step 4: Checking package contents..."
npm pack --dry-run

echo "Step 5: Ready to publish!"
echo "Run one of these commands:"
echo ""
echo "For public package:"
echo "  npm publish"
echo ""
echo "For scoped package (if name conflicts):"
echo "  npm publish --access public"
echo ""
echo "For test run first:"
echo "  npm publish --dry-run"

echo ""
echo "📋 Post-publish checklist:"
echo "  1. Create GitHub repository"
echo "  2. Push code to GitHub"
echo "  3. Create release tag"
echo "  4. Update documentation"
echo "  5. Share with community"

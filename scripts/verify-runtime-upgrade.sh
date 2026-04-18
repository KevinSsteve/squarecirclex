#!/bin/bash

# Verify Node.js Runtime Upgrade Script
# This script verifies that all Node.js Lambda functions are using nodejs20.x

echo "🔍 Verifying Node.js Runtime Upgrade..."
echo ""

# Check template.yaml for nodejs18.x (should find none)
echo "Checking for nodejs18.x in template.yaml..."
if grep -q "nodejs18" template.yaml; then
    echo "❌ ERROR: Found nodejs18.x in template.yaml"
    grep -n "nodejs18" template.yaml
    exit 1
else
    echo "✅ No nodejs18.x found in template.yaml"
fi

echo ""

# Check template.yaml for nodejs20.x (should find all)
echo "Checking for nodejs20.x in template.yaml..."
NODEJS20_COUNT=$(grep -c "nodejs20" template.yaml)
if [ "$NODEJS20_COUNT" -ge 8 ]; then
    echo "✅ Found $NODEJS20_COUNT occurrences of nodejs20.x"
else
    echo "❌ ERROR: Expected at least 8 occurrences of nodejs20.x, found $NODEJS20_COUNT"
    exit 1
fi

echo ""

# List all Node.js functions with their runtime
echo "Node.js Lambda Functions:"
echo "------------------------"
grep -B2 "Runtime: nodejs" template.yaml | grep -E "(Handler:|Runtime:)" | paste - - | sed 's/Handler://' | sed 's/Runtime:/→/'

echo ""

# Check Lambda layer
echo "Lambda Layer Configuration:"
echo "--------------------------"
grep -A2 "SharedNodeJSLayer:" template.yaml | grep -E "(CompatibleRuntimes:|nodejs)"

echo ""

# Verify no engine restrictions in package.json files
echo "Checking package.json files for engine restrictions..."
if find . -name "package.json" -type f -exec grep -l "engines" {} \; | grep -q .; then
    echo "⚠️  WARNING: Found engine restrictions in package.json files:"
    find . -name "package.json" -type f -exec grep -l "engines" {} \;
else
    echo "✅ No engine restrictions found in package.json files"
fi

echo ""
echo "✅ Runtime upgrade verification complete!"
echo ""
echo "Next steps:"
echo "1. Run 'sam build' to build with new runtime"
echo "2. Run tests to verify compatibility"
echo "3. Deploy to development environment"
echo "4. Verify functionality"
echo "5. Deploy to production"


#!/bin/bash

# Production build script for deployment
echo "🚀 Starting production build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type check
echo "🔍 Running type check..."
npm run check

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build complete! Ready for deployment."
echo "📁 Build output is in: dist/public"

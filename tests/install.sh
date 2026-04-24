#!/bin/bash
# Installation script for the test suite

echo "Installing test suite dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node --version)"

# Install dependencies
npm install

echo ""
echo "Installation complete!"
echo ""
echo "To run the tests:"
echo "  npm run test          - Run all tests"
echo "  npm run test:health   - Run health checks"
echo "  npm run test:business - Run business scenarios"
echo ""

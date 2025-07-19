#!/bin/bash
# Step 3: Run tests and build

set -e
source "$(dirname "$0")/utils.sh"

info "=== STEP 3: TEST AND BUILD ==="

# Run tests
info "Running tests..."
if cargo test --all; then
    success "Tests passed"
else
    error "Tests failed! Fix tests before continuing."
fi

# Build release
info "Building release..."
if cargo build --release -p jump-start; then
    success "Build successful"
else
    error "Build failed! Fix build errors before continuing."
fi

success "Tests and build complete"
echo
info "Next step: 04-commit-and-tag.sh <version>"
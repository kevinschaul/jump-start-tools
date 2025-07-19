#!/bin/bash
# Simple release orchestrator - runs all steps or starts from a specific step

set -e
source "$(dirname "$0")/utils.sh"

# Usage function
usage() {
    echo "Usage: $0 <version> [start-step]"
    echo "  version: Version to release (e.g., 0.1.2)"
    echo "  start-step: Step to start from (1-5, default: 1)"
    echo ""
    echo "Steps:"
    echo "  1. Prepare (validate, show changes)"
    echo "  2. Update version (Cargo.toml, CHANGELOG.md)"
    echo "  3. Test and build"
    echo "  4. Commit and tag"
    echo "  5. Publish (crates.io, GitHub release)"
    echo ""
    echo "Examples:"
    echo "  $0 0.1.2          # Full release"
    echo "  $0 0.1.2 3        # Start from test and build"
    echo "  $0 0.1.2 5        # Just publish (if git tag already exists)"
    exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
    usage
fi

VERSION="$1"
START_STEP="${2:-1}"

# Validate start step
if [[ ! "$START_STEP" =~ ^[1-5]$ ]]; then
    error "Start step must be 1, 2, 3, 4, or 5"
fi

info "Starting release process for version $VERSION from step $START_STEP"
echo

# Step 1: Prepare
if [ "$START_STEP" -le 1 ]; then
    if ! "$(dirname "$0")/01-prepare.sh" "$VERSION"; then
        error "Step 1 (prepare) failed"
    fi
    echo
fi

# Step 2: Update version
if [ "$START_STEP" -le 2 ]; then
    if ! "$(dirname "$0")/02-update-version.sh" "$VERSION"; then
        error "Step 2 (update version) failed"
    fi
    echo
fi

# Step 3: Test and build
if [ "$START_STEP" -le 3 ]; then
    if ! "$(dirname "$0")/03-test-and-build.sh"; then
        error "Step 3 (test and build) failed"
    fi
    echo
fi

# Step 4: Commit and tag
if [ "$START_STEP" -le 4 ]; then
    if ! "$(dirname "$0")/04-commit-and-tag.sh" "$VERSION"; then
        error "Step 4 (commit and tag) failed"
    fi
    echo
fi

# Step 5: Publish
if [ "$START_STEP" -le 5 ]; then
    if ! "$(dirname "$0")/05-publish.sh"; then
        error "Step 5 (publish) failed"
    fi
    echo
fi

success "🎉 Complete release process finished successfully!"
#!/bin/bash
# Step 1: Prepare release - validate and show what will be released

set -e
source "$(dirname "$0")/utils.sh"

VERSION="$1"
if [ -z "$VERSION" ]; then
    error "Usage: $0 <version>"
fi

info "=== STEP 1: PREPARE RELEASE ==="

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    warn "You have uncommitted changes:"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current version
CURRENT_VERSION=$(grep '^version = ' cli/Cargo.toml | sed 's/version = "//' | sed 's/"//')
info "Current version: $CURRENT_VERSION"
info "New version will be: $VERSION"

# Check if there are unreleased changes in CHANGELOG.md
info "Checking for unreleased changes in CHANGELOG.md..."

if ! grep -q "## \[Unreleased\]" CHANGELOG.md; then
    error "No [Unreleased] section found in CHANGELOG.md. Please add your changes there first."
fi

# Check if there are actual changes (not just the placeholder)
UNRELEASED_CONTENT=$(awk '/## \[Unreleased\]/{flag=1; next} /^## /{flag=0} flag' CHANGELOG.md | grep -v "^\s*$" | grep -v "Add new stuff here")

if [ -z "$UNRELEASED_CONTENT" ]; then
    warn "No changes found in [Unreleased] section."
    echo "Please add your changes to the [Unreleased] section in CHANGELOG.md"
    echo "Current unreleased section:"
    awk '/## \[Unreleased\]/{flag=1} /^## \[/{if(flag && !/Unreleased/) exit} flag' CHANGELOG.md
    echo
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo
info "Changes to be released:"
echo "$UNRELEASED_CONTENT"
echo

success "✓ Preparation complete - ready for release $VERSION"
echo
info "Next steps:"
echo "  scripts/02-update-version.sh $VERSION"
echo "  scripts/03-test-and-build.sh"
echo "  scripts/04-commit-and-tag.sh $VERSION"
echo "  scripts/05-publish.sh"
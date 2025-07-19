#!/bin/bash
# Step 2: Update version numbers and changelog

set -e
source "$(dirname "$0")/utils.sh"

VERSION="$1"
if [ -z "$VERSION" ]; then
    error "Usage: $0 <version>"
fi

info "=== STEP 2: UPDATE VERSION ==="

# Get current version
CURRENT_VERSION=$(grep '^version = ' cli/Cargo.toml | sed 's/version = "//' | sed 's/"//')

# Update version in Cargo.toml
info "Updating version in cli/Cargo.toml: $CURRENT_VERSION → $VERSION"
sed -i.bak "s/version = \"$CURRENT_VERSION\"/version = \"$VERSION\"/" cli/Cargo.toml
rm cli/Cargo.toml.bak
success "Version updated in Cargo.toml"

# Update CHANGELOG.md for non-alpha releases only
if [[ "$VERSION" != *"alpha"* && "$VERSION" != *"beta"* && "$VERSION" != *"rc"* ]]; then
    info "Updating CHANGELOG.md for stable release..."
    # Update unreleased section with version and date, moving content to new version
    DATE=$(date +%Y-%m-%d)
    
    # Create a temporary file with the new structure
    awk -v version="$VERSION" -v date="$DATE" '
    /^## Unreleased/ {
        print "## Unreleased"
        print ""
        print "## " version " (" date ")"
        next
    }
    /^## / && found_unreleased {
        found_unreleased = 0
    }
    /^## Unreleased/ {
        found_unreleased = 1
        next
    }
    { print }
    ' CHANGELOG.md > CHANGELOG.md.tmp
    
    mv CHANGELOG.md.tmp CHANGELOG.md
    success "CHANGELOG.md updated with version $VERSION"
else
    info "Skipping CHANGELOG.md update for pre-release version"
fi

info "Files updated:"
echo "  - cli/Cargo.toml"
echo "  - CHANGELOG.md"
echo
success "Version update complete"
echo
info "Next step: 03-test-and-build.sh"
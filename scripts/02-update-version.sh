#!/bin/bash
# Step 2: Update version numbers and changelog

set -e
source "$(dirname "$0")/../lib/colors.sh"

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

# Update CHANGELOG.md using the update script
info "Updating CHANGELOG.md..."
if "$(dirname "$0")/../update-changelog.sh" "$VERSION"; then
    success "CHANGELOG.md updated with version $VERSION"
else
    error "Failed to update CHANGELOG.md"
fi

info "Files updated:"
echo "  - cli/Cargo.toml"
echo "  - CHANGELOG.md"
echo
success "✓ Version update complete"
echo
info "Next step: scripts/release-steps/03-test-and-build.sh"
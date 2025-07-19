#!/bin/bash
# Step 5: Publish to crates.io and create GitHub release

set -e
source "$(dirname "$0")/utils.sh"

info "=== STEP 5: PUBLISH ==="

# Get version from Cargo.toml
VERSION=$(grep '^version = ' cli/Cargo.toml | sed 's/version = "//' | sed 's/"//')
info "Publishing version: $VERSION"

# Publish to crates.io
info "Publishing to crates.io..."
read -p "Publish to crates.io now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if cargo publish -p jump-start; then
        success "Published to crates.io!"
    else
        error "Failed to publish to crates.io. You can retry this step later with: scripts/05-publish.sh"
    fi
else
    warn "Skipped crates.io publishing. To publish later, run:"
    echo "  cargo publish -p jump-start"
fi

# Create GitHub release (if gh CLI is available)
if command -v gh >/dev/null 2>&1; then
    info "Creating GitHub release..."
    
    # Extract changelog for this release
    awk "/^## \[$VERSION\]/{flag=1; next} /^## \[/{flag=0} flag" CHANGELOG.md > /tmp/release_notes.md
    
    if gh release create "v$VERSION" --title "v$VERSION" --notes-file /tmp/release_notes.md; then
        success "GitHub release created!"
        info "View at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases/tag/v$VERSION"
    else
        warn "Failed to create GitHub release. You can create it manually at:"
        echo "  https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases/new?tag=v$VERSION"
    fi
else
    warn "GitHub CLI not found. To create a GitHub release, install 'gh' or create it manually at:"
    echo "  https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases/new?tag=v$VERSION"
fi

success "✓ Release v$VERSION complete! 🎉"
echo
info "Summary:"
echo "  • Version: $VERSION"
echo "  • Git tag: v$VERSION pushed"
echo "  • Crates.io: $(if [[ $REPLY =~ ^[Yy]$ ]]; then echo "Published"; else echo "Skipped"; fi)"
echo "  • GitHub release: $(if command -v gh >/dev/null 2>&1; then echo "Created"; else echo "Manual step needed"; fi)"
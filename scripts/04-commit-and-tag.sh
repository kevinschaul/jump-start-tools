#!/bin/bash
# Step 4: Commit changes and create git tag

set -e
source "$(dirname "$0")/utils.sh"

VERSION="$1"
if [ -z "$VERSION" ]; then
    error "Usage: $0 <version>"
fi

info "=== STEP 4: COMMIT AND TAG ==="

# Check what will be committed
info "Files to be committed:"
git --no-pager diff --name-only HEAD

if [[ -z $(git diff --name-only HEAD) ]]; then
    warn "No changes to commit"
else
    # Show the changes
    echo
    info "Changes to be committed:"
    git --no-pager diff --stat HEAD
    echo
fi

# Commit changes
info "Committing changes..."
git add .
git commit -m "release: v$VERSION" || warn "Nothing to commit"
success "Changes committed"

# Create and push tag
info "Creating and pushing tag v$VERSION..."
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"
success "Tag created and pushed"

success "Git operations complete"
echo
info "Next step: 05-publish.sh"

#!/usr/bin/env bash
# scripts/release-homebrew.sh
# Usage: ./scripts/release-homebrew.sh <version>
# Example: ./scripts/release-homebrew.sh 1.6.0
#
# This script:
#   1. Builds a GitHub release tag
#   2. Computes the SHA256 of the source tarball
#   3. Updates the formula in homebrew/Formula/brain-break.rb

set -euo pipefail

VERSION="${1-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.6.0"
  exit 1
fi

OWNER="georgiosnikitas"
REPO="brain-break"
TAG="v${VERSION}"
TARBALL_URL="https://github.com/${OWNER}/${REPO}/archive/refs/tags/${TAG}.tar.gz"
FORMULA="homebrew/Formula/brain-break.rb"

echo "==> Fetching tarball and computing SHA256 for ${TAG}..."
SHA256=$(curl -sL "${TARBALL_URL}" | shasum -a 256 | awk '{print $1}')

if [[ -z "$SHA256" ]]; then
  echo "ERROR: Could not compute SHA256. Is the tag '${TAG}' pushed to GitHub?"
  exit 1
fi

echo "==> SHA256: ${SHA256}"
echo "==> Updating ${FORMULA}..."

# Update the url line
sed -i '' "s|url \"https://github.com/${OWNER}/${REPO}/archive/refs/tags/v[^\"]*\"|url \"${TARBALL_URL}\"|" "${FORMULA}"

# Update the sha256 line (handles both placeholder and previous hash)
sed -i '' "s|sha256 \"[^\"]*\"|sha256 \"${SHA256}\"|" "${FORMULA}"

echo "==> Done. Formula updated:"
grep -E "^\s*(url|sha256)" "${FORMULA}"

echo ""
echo "Next steps:"
echo "  1. cd into your homebrew-${REPO} repo"
echo "  2. Copy the updated formula: cp ../${REPO}/${FORMULA} Formula/brain-break.rb"
echo "  3. git add Formula/brain-break.rb && git commit -m \"brain-break ${VERSION}\" && git push"
echo "  4. Test: brew upgrade brain-break"

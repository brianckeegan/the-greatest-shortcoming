#!/usr/bin/env bash
# Fetch the gart framework (https://github.com/igr/gart, BSD-2-Clause) at a pinned commit
# into ./vendor/gart. gart isn't published to Maven, so these sketches build it from source
# through a Gradle composite build (see settings.gradle.kts). vendor/ is gitignored: the
# framework is a build input, not part of this repo.
set -euo pipefail
cd "$(dirname "$0")"

GART_COMMIT=8cd8548e9116dcdc75fc020c18d76a84dd8f1ac1

if [ ! -d vendor/gart/.git ]; then
  git clone https://github.com/igr/gart.git vendor/gart
fi
git -C vendor/gart fetch --depth 1 origin "$GART_COMMIT" 2>/dev/null || git -C vendor/gart fetch origin
git -C vendor/gart checkout -q "$GART_COMMIT"
echo "gart pinned at $(git -C vendor/gart log -1 --format='%h %cd')"

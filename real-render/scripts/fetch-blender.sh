#!/usr/bin/env bash
# fetch-blender.sh
# Clones the pinned Blender source commit (no LFS smudge).
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/../build.config.env"

BLENDER_DIR="${ROOT}/blender"

if [ ! -d "${BLENDER_DIR}" ]; then
    echo "Cloning Blender from ${BLENDER_REMOTE}..."
    git clone --bare "${BLENDER_REMOTE}" "${BLENDER_DIR}"
fi

cd "${BLENDER_DIR}"

echo "Fetching and checking out ref: ${BLENDER_REF}"
git fetch --force origin "${BLENDER_REF}"
git checkout --force "${BLENDER_REF}"

COMMIT_SHA="$(git rev-parse HEAD)"
echo "Blender commit SHA: ${COMMIT_SHA}"
echo "BLENDER_REF=${BLENDER_REF}" > "${ROOT}/.blender_ref"

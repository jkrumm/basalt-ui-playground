#!/usr/bin/env bash
# Reset a RALPH group to pending so it can be re-run after a manual fix.
# Usage: ./scripts/ralph-reset.sh <group-id>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/ralph.sh" --reset "${1:?'Usage: ralph-reset.sh <group-id>'}"

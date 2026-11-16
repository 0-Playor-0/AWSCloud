#!/usr/bin/env bash
# Source this: sets REGION from samconfig.toml, the single place the deploy region is configured.
REGION="$(sed -nE 's/^region = "([a-z0-9-]+)".*/\1/p' "$(dirname "${BASH_SOURCE[0]}")/../samconfig.toml" | head -1)"
[[ -n "$REGION" ]] || { echo "region not found in samconfig.toml" >&2; exit 1; }
export REGION AWS_REGION="$REGION" AWS_DEFAULT_REGION="$REGION"

#!/usr/bin/env bash
set -euo pipefail

# OpenWrt scans packages below a feed root, not a Makefile at the root itself.
# Archive the committed source so SDK output always belongs to the built SHA.
tide_feed_root="${1:?Usage: prepare-sdk-feed.sh FEED_DIRECTORY}"
mkdir -p "$tide_feed_root/luci-theme-tide"
git archive HEAD | tar -x -C "$tide_feed_root/luci-theme-tide"

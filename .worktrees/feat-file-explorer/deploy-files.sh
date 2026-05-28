#!/usr/bin/env bash
# Deploy do labsrv-files — sincroniza fileexplorer/ e shared/ para /opt/labsrv-files/
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
DEST=/opt/labsrv-files

sudo rsync -a --delete --exclude='venv/' --exclude='*.db' "$REPO/fileexplorer/" "$DEST/"
sudo rsync -a "$REPO/shared/" "$DEST/shared/"
sudo systemctl restart labsrv-files
journalctl -u labsrv-files -n 5 --no-pager

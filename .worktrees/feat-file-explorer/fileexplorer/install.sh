#!/usr/bin/env bash
set -euo pipefail

DEST=/opt/labsrv-files
REPO=~/labsrvfiles

echo ">>> Sincronizando arquivos..."
sudo mkdir -p "$DEST/shared"
sudo rsync -a --delete "$REPO/fileexplorer/" "$DEST/"
sudo rsync -a "$REPO/shared/" "$DEST/shared/"

echo ">>> Instalando dependências..."
[ -d "$DEST/venv" ] || sudo python3 -m venv "$DEST/venv"
sudo "$DEST/venv/bin/pip" install -q -r "$DEST/requirements.txt"

echo ">>> Instalando serviço systemd..."
sudo cp "$DEST/labsrv-files.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable labsrv-files

echo ">>> Abrindo porta 8081 no UFW (rede interna)..."
sudo ufw allow from 192.86.0.0/16 to any port 8081 comment 'labsrv-files' 2>/dev/null || true

echo ">>> Iniciando serviço..."
sudo systemctl restart labsrv-files
sleep 2
sudo systemctl status labsrv-files --no-pager

echo ">>> OK — acesse http://192.86.221.213:8081"

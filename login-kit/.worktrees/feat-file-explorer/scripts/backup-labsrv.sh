#!/bin/bash
DATE=$(date +%Y-%m-%d)
LOG=/var/log/backup-labsrv.log
RCLONE_CONF=/home/admin/.config/rclone/rclone.conf

echo "========================================" >> $LOG
echo "BACKUP INICIADO: $(date)" >> $LOG

rclone sync /srv/samba gdrive-labsobral:samba --config $RCLONE_CONF --log-file $LOG --log-level INFO \
    --exclude "gdrive_import/**"

rclone sync /mnt/hdd/samba gdrive-labsobral:hdd --config $RCLONE_CONF --log-file $LOG --log-level INFO \
    --exclude "gdrive_import/**"

rsync -av --delete --exclude="gdrive_import/" \
    --link-dest=/mnt/hdd2/backups/latest /srv/samba/ /mnt/hdd2/backups/$DATE/ >> $LOG 2>&1
ln -sfn /mnt/hdd2/backups/$DATE /mnt/hdd2/backups/latest

rsync -av --delete --exclude="gdrive_import/" \
    --link-dest=/mnt/hdd2/backups-hdd/latest /mnt/hdd/samba/ /mnt/hdd2/backups-hdd/$DATE/ >> $LOG 2>&1
ln -sfn /mnt/hdd2/backups-hdd/$DATE /mnt/hdd2/backups-hdd/latest

echo "BACKUP CONCLUIDO: $(date)" >> $LOG
echo "========================================" >> $LOG

# Restaura dono do rclone.conf para admin (rclone pode reescrever o token como root durante o sync)
chown admin:admin $RCLONE_CONF

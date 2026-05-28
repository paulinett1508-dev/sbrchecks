# 8 — Resolução de Problemas
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 8.1 Usuário não consegue acessar o compartilhamento

**Sintoma:** mensagem "Acesso negado" ou pasta não aparece ao acessar `\\192.86.221.213`.

**Diagnóstico:**

1. Verificar se o usuário está no grupo AD correto:
   ```bash
   id usuario@labsobralnet.ind
   ```
2. Verificar se o serviço Samba está ativo:
   ```bash
   sudo systemctl status smbd
   ```
3. Verificar se o compartilhamento está na configuração:
   ```bash
   testparm -s | grep -A5 "NOME_DO_SHARE"
   ```

**Ação:** se o usuário não estiver no grupo AD, adicionar conforme módulo [05 — Gestão de Usuários](05-gestao-usuarios.md). Se o Samba estiver parado, reiniciar.

---

## 8.2 Serviço Samba parado (smbd/nmbd)

**Sintoma:** usuários não conseguem acessar nenhum compartilhamento.

```bash
# Verificar status
sudo systemctl status smbd

# Ver últimas mensagens de erro
journalctl -u smbd -n 30

# Reiniciar
sudo systemctl restart smbd nmbd

# Confirmar
sudo systemctl status smbd
```

Se o restart falhar, verificar configuração:

```bash
testparm -s
```

---

## 8.3 Autenticação AD falhou (SSSD parado)

**Sintoma:** usuários do domínio não conseguem logar; erro "invalid credentials" mesmo com senha correta.

```bash
# Verificar status SSSD
sudo systemctl status sssd

# Ver logs
journalctl -u sssd -n 30

# Testar resolução do domínio
ping -c2 192.86.221.218

# Reiniciar SSSD
sudo systemctl restart sssd

# Testar autenticação
id usuario@labsobralnet.ind
```

---

## 8.4 Disco cheio ou próximo do limite

**Sintoma:** usuários recebem erro ao salvar arquivos; alerta de disco no painel.

```bash
# Verificar uso de disco
df -h | grep -E '/$|/mnt/'

# Identificar maiores diretórios
du -sh /srv/samba/* | sort -rh | head -10
du -sh /mnt/hdd/samba/* | sort -rh | head -10
```

**Ação:**
1. Acionar o gestor do departamento mais cheio para revisão de arquivos
2. Mover arquivos antigos para `/mnt/hdd3` se necessário
3. Se crítico (>95%), parar serviços não essenciais e liberar espaço imediatamente

---

## 8.5 Backup não executou

**Sintoma:** log de backup sem entrada do dia anterior.

```bash
# Verificar crontab
crontab -l | grep backup

# Verificar log
tail -50 /var/log/backup-labsrv.log

# Executar manualmente para testar
sudo bash /home/admin/labsrvfiles/scripts/backup-labsrv.sh
```

---

## 8.6 Servidor inacessível na rede

**Sintoma:** nenhum usuário consegue acessar; ping não responde.

1. Verificar fisicamente se o servidor está ligado e com LEDs ativos
2. Verificar cabo de rede
3. Acessar diretamente por console (teclado + monitor)
4. Verificar se UFW não bloqueou acessos indevidamente:
   ```bash
   sudo ufw status verbose
   ```
5. Verificar se IP mudou:
   ```bash
   ip addr show
   ```

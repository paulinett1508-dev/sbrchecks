# PENDING TASKS — Retomar na próxima sessão

> Itens bloqueados ou incompletos que precisam de continuidade.

---

## 🔴 Acesso SMB ao servidor — Windows não conecta em \\192.86.221.213\TI

**Status:** Winbind integrado e funcionando, mas Windows ainda não autentica via SMB.

**O que foi feito:**
- Instalado `winbind`, `libpam-winbind`, `libnss-winbind`
- `smb.conf` atualizado: `security = ads`, `server role = member server`
- Servidor ingressado no domínio: `Joined 'ADMIN' to dns domain 'labsobralnet.ind'`
- Winbind resolvendo usuários: `wbinfo --user-info 'LABSOBRALNET\pmiranda'` retorna OK
- Trust com DC confirmado: `checking the trust secret... succeeded`
- idmap backend trocado de `ad` → `rid` (Windows Server 2012 sem RFC2307)
- Samba escutando em `192.86.221.213:445` ✓

**Erro atual:** Windows Explorer em `\\192.86.221.213\TI` não conecta — credenciais AD `LABSOBRALNET\pmiranda` rejeitadas.

**Próximos passos a investigar:**
1. Checar log de autenticação Samba no servidor:
   ```bash
   sudo tail -50 /var/log/samba/log.smbd
   sudo tail -50 /var/log/samba/log.192.86.221.213  # ou IP da máquina Windows
   ```
2. Verificar se PAM está configurado para winbind (`/etc/pam.d/samba`)
3. Testar autenticação local via smbclient:
   ```bash
   smbclient //localhost/TI -U 'LABSOBRALNET\pmiranda'
   ```
4. Verificar se `pmiranda` é membro do grupo `Administradores` no AD (share TI exige `@LABSOBRALNET\Administradores`)
5. Sincronizar smb.conf final do servidor de volta ao repositório

**Arquivos relevantes:**
- `/etc/samba/smb.conf` (no servidor — editado diretamente, repo local desatualizado)
- `config/smb.conf` (no repo — precisa ser sincronizado com o servidor)
- `scripts/setup-samba-ad.sh`

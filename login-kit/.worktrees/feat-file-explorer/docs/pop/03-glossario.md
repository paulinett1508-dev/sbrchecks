# 3 — Glossário
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

| Termo | Definição |
|---|---|
| **Active Directory (AD)** | Sistema da Microsoft que gerencia usuários, senhas e permissões da rede da empresa. Funciona no servidor Windows (192.86.221.218). |
| **Backup** | Cópia de segurança dos arquivos armazenados no servidor, realizada automaticamente todo dia às 23h. |
| **Compartilhamento (Share)** | Pasta do servidor acessível pela rede. Cada departamento possui seu próprio compartilhamento. |
| **Domínio** | Rede corporativa gerenciada pelo Active Directory. O domínio da empresa é `labsobralnet.ind`. |
| **Firewall (UFW)** | Software de segurança que controla quais computadores podem se comunicar com o servidor. |
| **LABSRVFILES** | Nome do servidor de arquivos. IP: 192.86.221.213. |
| **Painel de Administração** | Interface web para monitoramento e administração do servidor. Acessível em `http://192.86.221.213:8080`. Uso exclusivo da equipe de TI. |
| **Samba** | Software que permite o compartilhamento de arquivos entre o servidor Linux e os computadores Windows da rede. |
| **SMB** | Protocolo de rede utilizado pelo Windows para acessar compartilhamentos de arquivos. |
| **SSSD** | Software que conecta o servidor Linux ao Active Directory, permitindo que usuários do domínio façam login no servidor. |
| **rsync** | Ferramenta utilizada para realizar o backup incremental dos arquivos (copia apenas o que mudou). |
| **rclone** | Ferramenta utilizada para enviar backups ao Google Drive da empresa. |
| **SSH** | Protocolo de acesso remoto seguro ao servidor. Uso exclusivo da equipe de TI. |
| **Grupo AD** | Conjunto de usuários no Active Directory com as mesmas permissões de acesso a um compartilhamento. |
| **pfSense** | Firewall de perímetro da rede corporativa (camada externa de proteção). |

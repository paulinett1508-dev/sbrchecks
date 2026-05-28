# 4 — Compartilhamentos Samba
**Última atualização:** 2026-04-13

---

## 4.1 Lista de Compartilhamentos

| # | Share | Caminho no servidor | Grupo AD | Disco |
|---|---|---|---|---|
| 1 | DEPARTAMENTO_TECNICO | /srv/samba/DEPARTAMENTO_TECNICO | LABSOBRALNET\SISTEMA DA QUALIDADE | sdb |
| 2 | CONTABILIDADE | /srv/samba/CONTABILIDADE | LABSOBRALNET\CONTABILIDADE | sdb |
| 3 | FISCAL | /srv/samba/FISCAL | LABSOBRALNET\CONTABILIDADE | sdb |
| 4 | CONTROLADORIA | /srv/samba/CONTROLADORIA | LABSOBRALNET\CONTROLADORIA | sdb |
| 5 | FINANCEIRO | /srv/samba/FINANCEIRO | LABSOBRALNET\FINANCEIRO | sdb |
| 6 | RECURSOS_HUMANOS | /srv/samba/RECURSOS_HUMANOS | LABSOBRALNET\RECURSOS HUMANOS | sdb |
| 7 | COMERCIAL_VENDAS | /srv/samba/COMERCIAL_VENDAS | usuários locais (comercial1/2/3) | sdb |
| 8 | INDUSTRIAL | /srv/samba/INDUSTRIAL | LABSOBRALNET\INDUSTRIAL | sdb |
| 9 | SUPRIMENTOS | /srv/samba/SUPRIMENTOS | LABSOBRALNET\PCP | sdb |
| 10 | MANUTENCAO | /srv/samba/MANUTENCAO | LABSOBRALNET\MANUTENÇÃO | sdb |
| 11 | LOGISTICA_RECEBIMENTO | /srv/samba/LOGISTICA_RECEBIMENTO | LABSOBRALNET\LOGISTICA | sdb |
| 12 | LOGISTICA_EXPEDICAO | /srv/samba/LOGISTICA_EXPEDICAO | LABSOBRALNET\LOGISTICA | sdb |
| 13 | MARKETING | /mnt/hdd/samba/MARKETING | LABSOBRALNET\MARKETING | sdc |
| 14 | SEGURANCA_TRABALHO | /mnt/hdd/samba/SEGURANCA_TRABALHO | LABSOBRALNET\SESMT | sdc |
| 15 | SERVICOS_GERAIS | /mnt/hdd/samba/SERVICOS_GERAIS | LABSOBRALNET\SERVICOS GERAIS | sdc |
| 16 | DIRETORIAS | /mnt/hdd/samba/DIRETORIAS | LABSOBRALNET\PRESIDENCIA | sdc |
| 17 | SECRETARIA | /mnt/hdd/samba/SECRETARIA | LABSOBRALNET\SECRETARIA | sdc |
| 18 | TI | /mnt/hdd/samba/TI | LABSOBRALNET\Administradores | sdc |
| 19 | LINKS_UTEIS | /mnt/hdd/samba/MARKETING/LINKS_UTEIS | usuário local (vendedores) | sdc |

**Total:** 19 compartilhamentos — 12 no SSD (sdb), 7 no HDD (sdc)

## 4.2 Convenções de Permissão

- Permissão de diretório: `0770` (dono: root, grupo: grupo Linux do depto)
- Grupos Linux mapeados para grupos AD via SSSD
- Escrita habilitada para todos os membros do grupo

## 4.3 Comandos Úteis

```bash
# Listar shares ativos
testparm -s | grep '\['

# Ver conexões por share
sudo smbstatus -S

# Verificar permissões de diretório
ls -la /srv/samba/
ls -la /mnt/hdd/samba/
```

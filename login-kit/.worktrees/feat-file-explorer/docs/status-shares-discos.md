# Status de Discos, Shares e Migração — LABSRVFILES

> Gerado em: 2026-04-17 | Servidor: 192.86.221.213 (LABSRVFILES)

---

## 1. Discos — Capacidade e Uso

| Disco | Mount | Capacidade | Uso aprox. | Observação |
|---|---|---|---|---|
| SSD (sdb) | `/srv/samba` + `/` | 953 GB | ~90% | Deptos críticos + gdrive_import |
| HDD (sdc) | `/mnt/hdd` | 465 GB | ~40–50% | Deptos secundários + gdrive_import |
| HDD2 (sda) | `/mnt/hdd2` | 465 GB | ~0% | Backup incremental — **desabilitado pós-migração** |
| HDD3 (sdd) | `/mnt/hdd3` | 465 GB | ~94% | Overflow migração gdrive_import |
| EXTERNO (Toshiba) | `/mnt/externo` | 916 GB | ~95% | MARKETING (853 GB) |

### Verificar em tempo real no servidor:
```bash
df -h | grep -E '/$|/mnt/|/srv/'
```

### Espaço por pasta de importação:
```bash
du -sh /srv/samba/gdrive_import /mnt/hdd/gdrive_import /mnt/hdd3/gdrive_import /mnt/externo/gdrive_import
```

---

## 2. Compartilhamentos Samba — Mapeamento Completo

### SSD — /srv/samba/ (departamentos críticos)

| Share Samba | Path | Grupo AD | Status |
|---|---|---|---|
| DEPARTAMENTO_TECNICO | /srv/samba/DEPARTAMENTO_TECNICO | LABSOBRALNET\SISTEMA DA QUALIDADE | ativo |
| CONTABILIDADE | /srv/samba/CONTABILIDADE | LABSOBRALNET\CONTABILIDADE | ativo |
| FISCAL | /srv/samba/FISCAL | LABSOBRALNET\CONTABILIDADE | ativo |
| CONTROLADORIA | /srv/samba/CONTROLADORIA | LABSOBRALNET\CONTROLADORIA | ativo |
| FINANCEIRO | /srv/samba/FINANCEIRO | LABSOBRALNET\FINANCEIRO | ativo |
| RECURSOS_HUMANOS | /srv/samba/RECURSOS_HUMANOS | LABSOBRALNET\RECURSOS HUMANOS | ativo |
| COMERCIAL_VENDAS | /srv/samba/COMERCIAL_VENDAS | comercial1, comercial2, comercial3 (locais) | ativo |
| INDUSTRIAL | /srv/samba/INDUSTRIAL | LABSOBRALNET\INDUSTRIAL | ativo |
| SUPRIMENTOS | /srv/samba/SUPRIMENTOS | LABSOBRALNET\PCP | ativo |
| MANUTENCAO | /srv/samba/MANUTENCAO | LABSOBRALNET\MANUTENÇÃO | ativo |
| LOGISTICA_RECEBIMENTO | /srv/samba/LOGISTICA_RECEBIMENTO | LABSOBRALNET\LOGISTICA | ativo |
| LOGISTICA_EXPEDICAO | /srv/samba/LOGISTICA_EXPEDICAO | LABSOBRALNET\LOGISTICA | ativo |

### HDD — /mnt/hdd/samba/ (departamentos secundários)

| Share Samba | Path | Grupo AD | Status |
|---|---|---|---|
| MARKETING | /mnt/hdd/samba/MARKETING | LABSOBRALNET\MARKETING | ativo |
| SEGURANCA_TRABALHO | /mnt/hdd/samba/SEGURANCA_TRABALHO | LABSOBRALNET\SESMT | ativo |
| SERVICOS_GERAIS | /mnt/hdd/samba/SERVICOS_GERAIS | LABSOBRALNET\SERVICOS GERAIS | ativo |
| DIRETORIAS | /mnt/hdd/samba/DIRETORIAS | LABSOBRALNET\PRESIDENCIA | ativo |
| SECRETARIA | /mnt/hdd/samba/SECRETARIA | LABSOBRALNET\SECRETARIA | ativo |
| TI | /mnt/hdd/samba/TI | LABSOBRALNET\Administradores | ativo |
| LINKS_UTEIS | /mnt/hdd/samba/MARKETING/LINKS_UTEIS | vendedores (local) | somente leitura |

---

## 3. Teste e Diagnóstico — Share TI

**Acesso esperado via Windows:** `\\192.86.221.213\TI`

### 3.1 Verificar se o diretório existe e tem permissões corretas

```bash
# Verificar existência
ls -la /mnt/hdd/samba/TI

# Verificar GID do grupo Administradores no AD
getent group | grep -i administrad

# Criar diretório se não existir
sudo mkdir -p /mnt/hdd/samba/TI

# Descobrir GID exato do grupo AD
getent group "LABSOBRALNET\Administradores"

# Ajustar dono e permissões (substituir GID pelo valor real)
sudo chown root:"LABSOBRALNET\Administradores" /mnt/hdd/samba/TI
sudo chmod 2770 /mnt/hdd/samba/TI
```

### 3.2 Verificar sintaxe do smb.conf

```bash
testparm -s 2>&1 | grep -A5 "\[TI\]"
```

### 3.3 Testar autenticação do usuário AD no grupo

```bash
# Substituir "nome.usuario" pelo login AD
id nome.usuario@labsobralnet.ind

# Verificar se o usuário aparece no grupo Administradores
getent group "LABSOBRALNET\Administradores"
```

### 3.4 Testar acesso Samba diretamente no servidor

```bash
smbclient //192.86.221.213/TI -U nome.usuario@labsobralnet.ind
```

### 3.5 Verificar logs de erro do Samba

```bash
sudo tail -50 /var/log/samba/log.smbd
# ou para ver tentativas do cliente específico (substituir IP)
sudo tail -100 /var/log/samba/log.192.86.221.xxx
```

### 3.6 Reiniciar Samba após ajustes

```bash
sudo systemctl restart smbd
sudo systemctl status smbd
```

---

## 4. Google Drive → Servidor: Drives Migrados

**Migração bruta concluída em 2026-04-17 | 42 drives | PUBLICO_GDRV descartado**

### SSD — /srv/samba/gdrive_import/

| Drive | ID GDrive |
|---|---|
| AMOSTRAGEM | 0AM9bA0jR3khtUk9PVA |
| ASSUNTOS_REGULATORIOS | 0AE-lgz70ZL46Uk9PVA |
| COMERCIAL | 0AFt0ygoC_2HdUk9PVA |
| CONTABILIDADE | 0AGfUCI5zcIR1Uk9PVA |
| CONTROLE_files_research_PART1 | 0AJww3cOaaLm9Uk9PVA |
| CONTROLE_files_research_PART2 | 0ADE_pSEELO0qUk9PVA |
| CONTROLE_DA_QUALIDADE | 0AEG4w39-I9FLUk9PVA |
| CQ_CONSULTAS_ATE_2019 | 0AJGIPDx_MSMgUk9PVA |
| DEPTO_PESSOAL | 0AFCNkPHfJ5QqUk9PVA |
| DEPTO_TECNICO | 0AIt4fV4pGGziUk9PVA |
| DRE_PROJETADO | 0AGwktq4lQzxaUk9PVA |
| FARMACOPEIAS | 0AM0G5iluQtNSUk9PVA |
| FARMACOVIGILANCIA | 0ANRdJ8RFUjSVUk9PVA |
| FINANCEIRO | 0AKf3PglVP3CEUk9PVA |
| GARANTIA | 0AC0UFgfLUGrtUk9PVA |
| IFS_HMLG | 0AC9ollY_anZ7Uk9PVA |
| IFS_PROD | 0AF3_kuuCB-k7Uk9PVA |

### HDD3 — /mnt/hdd3/gdrive_import/

| Drive | ID GDrive |
|---|---|
| INDUSTRIAL | 0AFwSL48iDII6Uk9PVA |
| LOGISTICA | 0ALeD10WqsfdaUk9PVA |
| MANUTENCAO | 0AMV9LFkQp94jUk9PVA |
| METADADOS | 0AKSd1rElNyFTUk9PVA |
| NOTIFIC_RJ | 0AOfS48Tp24X0Uk9PVA |
| PCP_COMPRAS | 0AAmXchnohSnQUk9PVA |
| PLANILHAS_COLABORATIVAS | 0AMmiGErLuQ4-Uk9PVA |
| PRODUCAO | 0AKF0mj45HdkDUk9PVA |
| RECURSOS_HUMANOS | 0ADoXXTQ6uFDoUk9PVA |
| REGULATORIO | 0APJ07weXFn8LUk9PVA |
| RENOVACAO_LICENCA_AMBIENTAL_2026 | 0AMfuiC2IZC0GUk9PVA |
| VALIDACAO | 0AEb73Y8fwXFmUk9PVA |

### HDD — /mnt/hdd/gdrive_import/

| Drive | ID GDrive |
|---|---|
| VENDAS | 0ABRWCXJbkEVDUk9PVA |
| ARQUIVOS_GERADORES | 0AHJWbgsDRqDvUk9PVA |
| BOOK_DE_INDICADORES | 0AA_reRHJqZhiUk9PVA |
| DIRETORIA_ADMIN_FINANCEIRA | 0AFMm7LaZsr9EUk9PVA |
| DIRETORIA_TECNICA | 0AFSqFzKTnz0TUk9PVA |
| ENDOMARKETING | 0ADEuJJ-Uk_KeUk9PVA |
| IMAGENS_CAMERAS | 0ACg91Y742lKPUk9PVA |
| INDICADORES_POWER_BI | 0AC2X48Ew1CIRUk9PVA |
| MALA_DIRETA_BD_IFS | 0AJlEUSvuIwPQUk9PVA |
| POWERBI_DADOS | 0AGVAZ0eEvIajUk9PVA |
| SECRETARIA_EXECUTIVA | 0AF1LDR7B9kZdUk9PVA |
| SEGURANCA_DO_TRABALHO | 0ABk8vA9JLkZ_Uk9PVA |

### EXTERNO — /mnt/externo/gdrive_import/

| Drive | ID GDrive |
|---|---|
| MARKETING | 0AKjqL2jAceRBUk9PVA |

---

## 5. Próximos Passos

1. **Delta-sync** — rodar `scripts/delta-sync.sh` para capturar alterações pós-migração bruta
2. **Validar shares Samba** — testar acesso de cada departamento via Windows
3. **Comunicar usuários** — redirecionar acesso do GDrive para `\\192.86.221.213\[SHARE]`
4. **Reativar backup** — redesenhar estratégia offsite pós-migração

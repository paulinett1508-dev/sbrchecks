# Spec — Explorador de Arquivos Web (labsrv-files)

**Data:** 2026-04-20
**Status:** Aprovado

---

## Objetivo

Interface web para usuários do domínio AD acessarem os arquivos dos seus compartilhamentos Samba via browser, sem precisar mapear unidade de rede no Windows. Operações completas (visualizar, baixar, enviar, criar pasta, renomear, deletar) com auditoria integrada ao painel admin existente.

---

## Escopo

- **Usuários-alvo:** todos os usuários do domínio `labsobralnet.ind` — cada um vê apenas o(s) share(s) do seu departamento
- **Admins de TI:** continuam usando acesso técnico direto ao servidor; este explorador não é para eles
- **Operações:** read + download + upload + mkdir + rename + delete
- **Auditoria:** toda operação de escrita/deleção registrada em SQLite, visível no painel admin

---

## Arquitetura

### Novo serviço: `labsrv-files`

| Item | Valor |
|---|---|
| Porta | `8081` |
| Código-fonte | `fileexplorer/` (mesmo repositório) |
| Systemd | `labsrv-files.service` |
| Deploy | `rsync -a --delete ~/labsrvfiles/fileexplorer/ /opt/labsrv-files/` |
| Python | 3.10, mesmo venv pattern do painel |
| Stack | FastAPI + Uvicorn + HTML/CSS/JS puro (sem framework frontend) |

### Relação com o painel admin

- `fileexplorer/` importa `SHARE_GROUPS` de um módulo compartilhado `shared/share_groups.py` (extraído de `panel/api/shares.py`)
- Auditoria gravada em `/opt/labsrv-files/audit.db` (SQLite)
- Painel admin adiciona endpoint `GET /api/admin/file-audit` e aba "Auditoria de Arquivos"

---

## Autenticação

- PAM + JWT (igual ao painel), sem exigência de grupo admin
- Qualquer usuário do domínio `labsobralnet.ind` pode autenticar
- Cookie `token` httponly, samesite=lax, 8h
- Endpoint: `POST /api/login`, `POST /api/logout`, `GET /api/me`

---

## Mapeamento usuário → share

No login, após autenticação PAM:

```
grupos = wbinfo -r <username>   # grupos AD do usuário
shares_autorizados = [share for share, grupo in SHARE_GROUPS.items()
                      if grupo in grupos]
```

- Usuário com 1 share: entra direto na raiz do share
- Usuário com múltiplos shares: tela inicial lista os shares disponíveis
- Usuário sem share mapeado: tela "Sem acesso configurado"

`SHARE_GROUPS` mapeia share → grupo AD exato (ex: `"FINANCEIRO": "LABSOBRALNET\\FINANCEIRO"`). Shares com usuários locais (COMERCIAL_VENDAS, LINKS_UTEIS) ficam fora deste explorador.

---

## Layout da interface

Layout híbrido em painel único:

```
┌─────────────────────────────────────────────────────────────┐
│  [breadcrumb: SHARE › pasta › subpasta]  [🔍 buscar]  [⊞☰] │
├──────────────┬──────────────────────────────────────────────┤
│ Árvore de    │  [⬆ Upload]  [📁 Nova pasta]     4 itens     │
│ pastas       ├──────────────────────────────────────────────┤
│ (colapsável) │  Nome        Tamanho   Modificado   Ações    │
│              │  📁 Subpasta   —        14/02/2025   ✏ 🗑    │
│              │  📄 arq.xlsx  142KB     18/02/2025  ⬇ ✏ 🗑   │
└──────────────┴──────────────────────────────────────────────┘
```

- Árvore lateral: expandir/colapsar por clique, destaca pasta atual
- Breadcrumb: navegação rápida para qualquer nível acima
- Toggle grid/lista: preferência salva em localStorage
- Busca: filtra arquivos/pastas pelo nome na pasta atual (client-side)

---

## API de arquivos

Base path: `/api/files`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/files?path=` | Lista conteúdo do diretório |
| GET | `/api/files/download?path=` | Download de arquivo (StreamingResponse) |
| POST | `/api/files/upload?path=` | Upload (multipart/form-data) |
| POST | `/api/files/mkdir` | Cria pasta `{"path": "..."}` |
| POST | `/api/files/rename` | Renomeia `{"path": "...", "new_name": "..."}` |
| DELETE | `/api/files?path=` | Deleta arquivo ou pasta vazia |
| DELETE | `/api/files?path=&confirm=true` | Deleta pasta com conteúdo |

### Resposta de listagem

```json
{
  "path": "FINANCEIRO/2025/Fevereiro",
  "items": [
    {"name": "Notas Fiscais", "type": "dir", "size": null, "modified": "2025-02-14T10:00:00"},
    {"name": "Relatorio.xlsx", "type": "file", "size": 145408, "modified": "2025-02-18T14:32:00"}
  ]
}
```

---

## Segurança

### Path traversal
Toda operação resolve o path absoluto e verifica que está contido na raiz do share autorizado:

```python
resolved = (share_root / user_path).resolve()
if not str(resolved).startswith(str(share_root.resolve())):
    raise HTTPException(403)
```

Sem seguir symlinks fora do share (`follow_symlinks=False` em operações stat).

### Limites de upload
- Tamanho máximo por arquivo: 500 MB (configurável em `config.py`)
- MIME type não é restrito (usuários podem precisar de qualquer formato)

### Deleção de pasta não-vazia
Exige `confirm=true` como query param explícito. Frontend mostra modal de confirmação antes de enviar.

---

## Auditoria

### Schema SQLite (`/opt/labsrv-files/audit.db`)

```sql
CREATE TABLE file_audit_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    username  TEXT NOT NULL,
    action    TEXT NOT NULL,  -- upload | download | mkdir | rename | delete
    path      TEXT NOT NULL,
    ip        TEXT NOT NULL
);
```

Apenas operações de escrita e download são auditadas (não listagens).

### Integração no painel admin

- Novo endpoint: `GET /api/admin/file-audit?user=&action=&from=&to=&limit=100`
- Nova aba "Auditoria de Arquivos" no painel admin existente
- Role mínima para ver: `readonly`

---

## Estrutura de arquivos

```
fileexplorer/
├── main.py               # FastAPI app, rotas login/logout/SPA
├── auth.py               # PAM+JWT (fork do panel/auth.py sem check admin)
├── config.py             # PORT=8081, MAX_UPLOAD_MB=500
├── audit.py              # SQLite helpers
├── api/
│   └── files.py          # Todos os endpoints de arquivo
├── static/
│   ├── index.html        # SPA do explorador
│   ├── app.js            # Lógica de navegação, tree, upload
│   ├── style.css
│   └── login.html
├── labsrv-files.service  # Systemd unit
├── install.sh
└── requirements.txt

shared/
└── share_groups.py       # SHARE_GROUPS dict (extraído de panel/api/shares.py)
```

---

## Deploy

```bash
# Instalar
sudo rsync -a --delete ~/labsrvfiles/fileexplorer/ /opt/labsrv-files/
sudo rsync -a ~/labsrvfiles/shared/ /opt/labsrv-files/shared/
cd /opt/labsrv-files && sudo pip install -r requirements.txt -q
sudo systemctl daemon-reload
sudo systemctl restart labsrv-files

# Verificar
sudo systemctl status labsrv-files
```

Porta `8081` liberada no UFW apenas para rede interna (`192.86.0.0/16`).

---

## Fora do escopo

- Preview de arquivos no browser (PDF/imagens) — pode ser adicionado depois
- Compartilhamento de link público — não planejado
- Versionamento de arquivos — Samba não provê, fora do escopo
- Mobile-first — funcional em mobile, mas não otimizado

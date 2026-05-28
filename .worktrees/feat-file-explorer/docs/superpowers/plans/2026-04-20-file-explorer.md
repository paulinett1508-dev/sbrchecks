# File Explorer (labsrv-files) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar serviço web na porta 8081 para usuários do domínio AD acessarem e gerenciarem arquivos dos seus compartilhamentos Samba via browser.

**Architecture:** FastAPI + PAM/JWT na porta 8081 (serviço independente `labsrv-files`). Usuário autentica com credenciais AD; o backend detecta seus grupos via `id <username>` e libera acesso apenas aos shares mapeados. Toda operação de escrita/deleção/download é auditada em SQLite e visível no painel admin existente.

**Tech Stack:** Python 3.10, FastAPI, PyJWT, python-pam, aiofiles, SQLite (stdlib), HTML/CSS/JS puro

---

## Estrutura de arquivos

```
shared/
└── share_groups.py           # SHARE_GROUPS + SHARE_ROOTS (extraído de panel/api/shares.py)

fileexplorer/
├── main.py                   # FastAPI app: login/logout/me/SPA
├── auth.py                   # PAM+JWT sem exigência de grupo admin; get_user_shares()
├── audit.py                  # SQLite helpers: log_action(), query_logs()
├── config.py                 # PORT=8081, MAX_UPLOAD_BYTES, AUDIT_DB, JWT_SECRET
├── requirements.txt
├── labsrv-files.service      # Systemd unit
├── install.sh                # Deploy script
├── api/
│   ├── __init__.py
│   └── files.py              # Endpoints: list, download, upload, mkdir, rename, delete
├── static/
│   ├── login.html
│   ├── index.html            # SPA shell
│   ├── app.js                # Tree, breadcrumb, CRUD, upload
│   └── style.css
└── tests/
    ├── test_auth.py
    ├── test_audit.py
    └── test_files_api.py

panel/api/admin.py            # MODIFICAR: adicionar endpoint GET /api/admin/file-audit
panel/static/app.js           # MODIFICAR: adicionar aba "Auditoria de Arquivos"
```

---

## Task 1: Módulo compartilhado share_groups.py

**Files:**
- Create: `shared/__init__.py`
- Create: `shared/share_groups.py`
- Modify: `panel/api/shares.py` (importar de shared)

- [ ] **Step 1: Criar shared/__init__.py**

```python
# shared/__init__.py
```

- [ ] **Step 2: Criar shared/share_groups.py**

```python
# shared/share_groups.py

SHARE_GROUPS: dict[str, str] = {
    "DEPARTAMENTO_TECNICO":   "LABSOBRALNET\\SISTEMA DA QUALIDADE",
    "CONTABILIDADE":          "LABSOBRALNET\\CONTABILIDADE",
    "FISCAL":                 "LABSOBRALNET\\CONTABILIDADE",
    "CONTROLADORIA":          "LABSOBRALNET\\CONTROLADORIA",
    "FINANCEIRO":             "LABSOBRALNET\\FINANCEIRO",
    "RECURSOS_HUMANOS":       "LABSOBRALNET\\RECURSOS HUMANOS",
    "COMERCIAL_VENDAS":       "local: comercial1/2/3",
    "INDUSTRIAL":             "LABSOBRALNET\\INDUSTRIAL",
    "SUPRIMENTOS":            "LABSOBRALNET\\PCP",
    "MANUTENCAO":             "LABSOBRALNET\\MANUTENÇÃO",
    "LOGISTICA_RECEBIMENTO":  "LABSOBRALNET\\LOGISTICA",
    "LOGISTICA_EXPEDICAO":    "LABSOBRALNET\\LOGISTICA",
    "MARKETING":              "LABSOBRALNET\\MARKETING",
    "SEGURANCA_TRABALHO":     "LABSOBRALNET\\SESMT",
    "SERVICOS_GERAIS":        "LABSOBRALNET\\SERVICOS GERAIS",
    "DIRETORIAS":             "LABSOBRALNET\\PRESIDENCIA",
    "SECRETARIA":             "LABSOBRALNET\\SECRETARIA",
    "TI":                     "LABSOBRALNET\\Administradores",
    "LINKS_UTEIS":            "local: vendedores",
}

# Shares acessíveis via explorador (apenas grupos AD — sem usuários locais)
SHARE_ROOTS: dict[str, str] = {
    "DEPARTAMENTO_TECNICO":   "/srv/samba/DEPARTAMENTO_TECNICO",
    "CONTABILIDADE":          "/srv/samba/CONTABILIDADE",
    "FISCAL":                 "/srv/samba/FISCAL",
    "CONTROLADORIA":          "/srv/samba/CONTROLADORIA",
    "FINANCEIRO":             "/srv/samba/FINANCEIRO",
    "RECURSOS_HUMANOS":       "/srv/samba/RECURSOS_HUMANOS",
    "INDUSTRIAL":             "/srv/samba/INDUSTRIAL",
    "SUPRIMENTOS":            "/srv/samba/SUPRIMENTOS",
    "MANUTENCAO":             "/srv/samba/MANUTENCAO",
    "LOGISTICA_RECEBIMENTO":  "/srv/samba/LOGISTICA_RECEBIMENTO",
    "LOGISTICA_EXPEDICAO":    "/srv/samba/LOGISTICA_EXPEDICAO",
    "MARKETING":              "/mnt/hdd/samba/MARKETING",
    "SEGURANCA_TRABALHO":     "/mnt/hdd/samba/SEGURANCA_TRABALHO",
    "SERVICOS_GERAIS":        "/mnt/hdd/samba/SERVICOS_GERAIS",
    "DIRETORIAS":             "/mnt/hdd/samba/DIRETORIAS",
    "SECRETARIA":             "/mnt/hdd/samba/SECRETARIA",
    "TI":                     "/mnt/hdd/samba/TI",
}
```

- [ ] **Step 3: Atualizar panel/api/shares.py para importar de shared**

Substituir o dict `SHARE_GROUPS` inline por:

```python
# panel/api/shares.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from shared.share_groups import SHARE_GROUPS
from fastapi import APIRouter
from auth import run_cmd

router = APIRouter()

@router.get("")
async def shares():
    smb_out, _ = run_cmd(["smbstatus", "-S"])
    active_shares = set()
    for line in smb_out.splitlines():
        parts = line.split()
        if parts:
            active_shares.add(parts[0])
    result = [
        {"name": name, "group": group, "active_connections": name in active_shares}
        for name, group in SHARE_GROUPS.items()
    ]
    return {"shares": result, "total": len(result)}
```

- [ ] **Step 4: Verificar que o painel continua funcionando**

```bash
cd ~/labsrvfiles/panel
python -c "from api.shares import SHARE_GROUPS; print(len(SHARE_GROUPS), 'shares OK')"
```

Esperado: `19 shares OK`

- [ ] **Step 5: Commit**

```bash
git add shared/ panel/api/shares.py
git commit -m "refactor: extrai SHARE_GROUPS/SHARE_ROOTS para shared/share_groups.py"
```

---

## Task 2: fileexplorer/config.py + requirements.txt

**Files:**
- Create: `fileexplorer/config.py`
- Create: `fileexplorer/requirements.txt`
- Create: `fileexplorer/api/__init__.py`

- [ ] **Step 1: Criar fileexplorer/config.py**

```python
# fileexplorer/config.py
import os
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PERSISTENT_SECRET_FILE = os.path.expanduser("~/.labsrv-files-secret")


def _get_jwt_secret() -> str:
    if "FILES_JWT_SECRET" in os.environ:
        return os.environ["FILES_JWT_SECRET"]
    if os.path.exists(PERSISTENT_SECRET_FILE):
        with open(PERSISTENT_SECRET_FILE) as f:
            return f.read().strip()
    s = secrets.token_hex(32)
    old = os.umask(0o077)
    try:
        with open(PERSISTENT_SECRET_FILE, "w") as f:
            f.write(s)
    finally:
        os.umask(old)
    return s


PORT = 8081
HOST = "0.0.0.0"
JWT_SECRET = _get_jwt_secret()
JWT_EXPIRE_HOURS = 8
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB
AUDIT_DB = os.environ.get("AUDIT_DB", "/opt/labsrv-files/audit.db")
```

- [ ] **Step 2: Criar fileexplorer/requirements.txt**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
PyJWT==2.8.0
python-pam==2.0.2
aiofiles==23.2.1
python-multipart==0.0.9
```

- [ ] **Step 3: Criar fileexplorer/api/__init__.py**

```python
# fileexplorer/api/__init__.py
```

- [ ] **Step 4: Commit**

```bash
git add fileexplorer/
git commit -m "feat(fileexplorer): config e requirements iniciais"
```

---

## Task 3: fileexplorer/auth.py

**Files:**
- Create: `fileexplorer/auth.py`
- Create: `fileexplorer/tests/__init__.py`
- Create: `fileexplorer/tests/test_auth.py`

- [ ] **Step 1: Escrever os testes falhando**

```python
# fileexplorer/tests/test_auth.py
import sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from unittest.mock import patch
import pytest

os.environ.setdefault("FILES_JWT_SECRET", "test-secret-key-32-chars-xxxxxxxxx")
os.environ.setdefault("AUDIT_DB", "/tmp/test_audit.db")


def test_create_and_decode_token():
    from auth import create_token, decode_token
    token = create_token("joao.silva")
    payload = decode_token(token)
    assert payload["sub"] == "joao.silva"


def test_decode_invalid_token():
    from auth import decode_token
    assert decode_token("token.invalido.aqui") is None


def test_decode_expired_token():
    from auth import decode_token
    import jwt
    from config import JWT_SECRET
    payload = {"sub": "u", "exp": int(time.time()) - 1}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    assert decode_token(token) is None


def test_pam_authenticate_import_error():
    from auth import pam_authenticate
    with patch.dict("sys.modules", {"pam": None}):
        assert pam_authenticate("u", "p") is False


def test_get_user_shares_matches_by_short_group():
    from auth import get_user_shares
    id_out = "uid=1000(joao) gid=513(domain users) groups=513(domain users),1001(financeiro)"
    with patch("auth.run_cmd", return_value=(id_out, "")):
        shares = get_user_shares("joao")
    assert any(s["name"] == "FINANCEIRO" for s in shares)


def test_get_user_shares_no_match():
    from auth import get_user_shares
    id_out = "uid=1000(joao) gid=513(domain users) groups=513(domain users)"
    with patch("auth.run_cmd", return_value=(id_out, "")):
        shares = get_user_shares("joao")
    assert shares == []


def test_get_user_shares_empty_id_output():
    from auth import get_user_shares
    with patch("auth.run_cmd", return_value=("", "")):
        shares = get_user_shares("joao")
    assert shares == []


def test_get_user_shares_excludes_local_shares():
    from auth import get_user_shares
    id_out = "uid=1000(comercial1) gid=513(domain users) groups=513(domain users),1002(comercial)"
    with patch("auth.run_cmd", return_value=(id_out, "")):
        shares = get_user_shares("comercial1")
    names = [s["name"] for s in shares]
    assert "COMERCIAL_VENDAS" not in names
    assert "LINKS_UTEIS" not in names
```

- [ ] **Step 2: Rodar e confirmar que os testes falham**

```bash
cd ~/labsrvfiles
python -m pytest fileexplorer/tests/test_auth.py -v
```

Esperado: `ImportError: No module named 'auth'` ou similar.

- [ ] **Step 3: Criar fileexplorer/auth.py**

```python
# fileexplorer/auth.py
import re
import subprocess
import time

from fastapi import Depends, HTTPException, Request


def run_cmd(cmd: list[str], timeout: int = 10) -> tuple[str, str]:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return "", f"timed out after {timeout}s"
    except Exception as e:
        return "", str(e)


def pam_authenticate(username: str, password: str) -> bool:
    try:
        import pam
        return pam.pam().authenticate(username, password, service="login")
    except ImportError:
        return False


def create_token(username: str) -> str:
    import jwt
    from config import JWT_SECRET, JWT_EXPIRE_HOURS
    payload = {
        "sub": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    import jwt
    from config import JWT_SECRET
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None


def get_user_shares(username: str) -> list[dict]:
    """Returns [{name, root}] for shares the user can access via AD group membership."""
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from shared.share_groups import SHARE_GROUPS, SHARE_ROOTS

    stdout, _ = run_cmd(["id", username])
    if not stdout:
        return []
    user_groups = {g.lower() for g in re.findall(r'\(([^)]+)\)', stdout)}

    result = []
    for share, ad_group in SHARE_GROUPS.items():
        if share not in SHARE_ROOTS:
            continue  # skip local-user shares (COMERCIAL_VENDAS, LINKS_UTEIS)
        group_short = ad_group.split("\\")[-1].lower()
        if group_short in user_groups or ad_group.lower() in user_groups:
            result.append({"name": share, "root": SHARE_ROOTS[share]})
    return result


def get_current_user(request: Request) -> dict:
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    return payload
```

- [ ] **Step 4: Rodar e confirmar que os testes passam**

```bash
cd ~/labsrvfiles
python -m pytest fileexplorer/tests/test_auth.py -v
```

Esperado: 8 testes PASSED.

- [ ] **Step 5: Commit**

```bash
git add fileexplorer/auth.py fileexplorer/tests/
git commit -m "feat(fileexplorer): auth PAM+JWT com mapeamento user->share"
```

---

## Task 4: fileexplorer/audit.py

**Files:**
- Create: `fileexplorer/audit.py`
- Create: `fileexplorer/tests/test_audit.py`

- [ ] **Step 1: Escrever os testes falhando**

```python
# fileexplorer/tests/test_audit.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("FILES_JWT_SECRET", "test-secret-key-32-chars-xxxxxxxxx")

import pytest


@pytest.fixture
def tmp_db(tmp_path):
    db = str(tmp_path / "audit.db")
    os.environ["AUDIT_DB"] = db
    import importlib
    import config
    config.AUDIT_DB = db
    import audit
    importlib.reload(audit)
    audit.init_db()
    yield db


def test_log_and_query(tmp_db):
    from audit import log_action, query_logs
    log_action("joao.silva", "upload", "/srv/samba/FINANCEIRO/file.xlsx", "10.0.0.5")
    rows = query_logs()
    assert len(rows) == 1
    assert rows[0]["username"] == "joao.silva"
    assert rows[0]["action"] == "upload"
    assert rows[0]["path"] == "/srv/samba/FINANCEIRO/file.xlsx"


def test_query_filter_by_user(tmp_db):
    from audit import log_action, query_logs
    log_action("user1", "download", "/srv/samba/FINANCEIRO/a.pdf", "10.0.0.1")
    log_action("user2", "delete",   "/srv/samba/FINANCEIRO/b.pdf", "10.0.0.2")
    rows = query_logs(user="user1")
    assert len(rows) == 1
    assert rows[0]["username"] == "user1"


def test_query_filter_by_action(tmp_db):
    from audit import log_action, query_logs
    log_action("u", "upload",   "/p1", "1.1.1.1")
    log_action("u", "delete",   "/p2", "1.1.1.1")
    log_action("u", "download", "/p3", "1.1.1.1")
    rows = query_logs(action="delete")
    assert len(rows) == 1
    assert rows[0]["action"] == "delete"


def test_query_limit(tmp_db):
    from audit import log_action, query_logs
    for i in range(10):
        log_action("u", "upload", f"/p{i}", "1.1.1.1")
    rows = query_logs(limit=3)
    assert len(rows) == 3
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
cd ~/labsrvfiles
python -m pytest fileexplorer/tests/test_audit.py -v
```

Esperado: `ImportError: No module named 'audit'`

- [ ] **Step 3: Criar fileexplorer/audit.py**

```python
# fileexplorer/audit.py
import sqlite3
from datetime import datetime


def _conn() -> sqlite3.Connection:
    from config import AUDIT_DB
    return sqlite3.connect(AUDIT_DB)


def init_db() -> None:
    with _conn() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS file_audit_log (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                username  TEXT NOT NULL,
                action    TEXT NOT NULL,
                path      TEXT NOT NULL,
                ip        TEXT NOT NULL
            )
        """)


def log_action(username: str, action: str, path: str, ip: str) -> None:
    with _conn() as db:
        db.execute(
            "INSERT INTO file_audit_log (timestamp, username, action, path, ip) VALUES (?,?,?,?,?)",
            (datetime.utcnow().isoformat(), username, action, path, ip)
        )


def query_logs(
    user: str | None = None,
    action: str | None = None,
    from_ts: str | None = None,
    to_ts: str | None = None,
    limit: int = 100,
) -> list[dict]:
    sql = "SELECT id, timestamp, username, action, path, ip FROM file_audit_log WHERE 1=1"
    params: list = []
    if user:
        sql += " AND username = ?"
        params.append(user)
    if action:
        sql += " AND action = ?"
        params.append(action)
    if from_ts:
        sql += " AND timestamp >= ?"
        params.append(from_ts)
    if to_ts:
        sql += " AND timestamp <= ?"
        params.append(to_ts)
    sql += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    with _conn() as db:
        db.row_factory = sqlite3.Row
        rows = db.execute(sql, params).fetchall()
    return [dict(r) for r in rows]
```

- [ ] **Step 4: Rodar e confirmar que os testes passam**

```bash
cd ~/labsrvfiles
python -m pytest fileexplorer/tests/test_audit.py -v
```

Esperado: 4 testes PASSED.

- [ ] **Step 5: Commit**

```bash
git add fileexplorer/audit.py fileexplorer/tests/test_audit.py
git commit -m "feat(fileexplorer): audit SQLite com log_action e query_logs"
```

---

## Task 5: fileexplorer/api/files.py

**Files:**
- Create: `fileexplorer/api/files.py`
- Create: `fileexplorer/tests/test_files_api.py`

- [ ] **Step 1: Escrever os testes falhando**

```python
# fileexplorer/tests/test_files_api.py
import sys, os, pathlib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

os.environ.setdefault("FILES_JWT_SECRET", "test-secret-key-32-chars-xxxxxxxxx")

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


@pytest.fixture
def share_root(tmp_path):
    root = tmp_path / "FINANCEIRO"
    root.mkdir()
    (root / "relatorio.xlsx").write_bytes(b"xlsx content")
    (root / "subpasta").mkdir()
    return root


@pytest.fixture
def client(share_root, tmp_path):
    os.environ["AUDIT_DB"] = str(tmp_path / "audit.db")
    import importlib, config
    config.AUDIT_DB = str(tmp_path / "audit.db")
    import audit
    importlib.reload(audit)
    audit.init_db()

    from main import app
    import auth as auth_mod
    token = auth_mod.create_token("joao.silva")
    shares = [{"name": "FINANCEIRO", "root": str(share_root)}]

    tc = TestClient(app, raise_server_exceptions=True)
    tc.cookies.set("token", token)
    return tc, shares


def test_list_root(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files?path=FINANCEIRO/")
    assert resp.status_code == 200
    names = [i["name"] for i in resp.json()["items"]]
    assert "relatorio.xlsx" in names
    assert "subpasta" in names


def test_list_path_traversal_blocked(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files?path=FINANCEIRO/../../etc/passwd")
    assert resp.status_code == 403


def test_download_file(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files/download?path=FINANCEIRO/relatorio.xlsx")
    assert resp.status_code == 200
    assert resp.content == b"xlsx content"


def test_download_traversal_blocked(client):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.get("/api/files/download?path=FINANCEIRO/../../../etc/passwd")
    assert resp.status_code == 403


def test_mkdir(client, share_root):
    tc, shares = client
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.post("/api/files/mkdir", json={"path": "FINANCEIRO/nova_pasta"})
    assert resp.status_code == 200
    assert (share_root / "nova_pasta").is_dir()


def test_rename(client, share_root):
    tc, shares = client
    (share_root / "antigo.txt").write_text("x")
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.post("/api/files/rename", json={
            "path": "FINANCEIRO/antigo.txt",
            "new_name": "novo.txt"
        })
    assert resp.status_code == 200
    assert (share_root / "novo.txt").exists()
    assert not (share_root / "antigo.txt").exists()


def test_delete_file(client, share_root):
    tc, shares = client
    (share_root / "lixo.txt").write_text("x")
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.delete("/api/files?path=FINANCEIRO/lixo.txt")
    assert resp.status_code == 200
    assert not (share_root / "lixo.txt").exists()


def test_delete_nonempty_dir_requires_confirm(client, share_root):
    tc, shares = client
    d = share_root / "cheio"
    d.mkdir()
    (d / "arquivo.txt").write_text("x")
    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.delete("/api/files?path=FINANCEIRO/cheio")
    assert resp.status_code == 400

    with patch("api.files._get_user_shares", return_value=shares):
        resp = tc.delete("/api/files?path=FINANCEIRO/cheio&confirm=true")
    assert resp.status_code == 200
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
cd ~/labsrvfiles
python -m pytest fileexplorer/tests/test_files_api.py -v
```

Esperado: erros de import.

- [ ] **Step 3: Criar fileexplorer/api/files.py**

```python
# fileexplorer/api/files.py
import os
import shutil
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from auth import get_current_user
import audit

router = APIRouter()


def _get_user_shares(request: Request) -> list[dict]:
    from auth import get_user_shares
    user = get_current_user(request)
    return get_user_shares(user["sub"])


def _resolve_path(path: str, shares: list[dict]) -> tuple[Path, dict]:
    """Resolve user path to absolute Path within an authorized share. Raises 403 on violation."""
    parts = Path(path).parts
    if not parts:
        raise HTTPException(400, "Path vazio")
    share_name = parts[0]
    share = next((s for s in shares if s["name"] == share_name), None)
    if not share:
        raise HTTPException(403, "Share não autorizado")
    share_root = Path(share["root"]).resolve()
    relative = Path(*parts[1:]) if len(parts) > 1 else Path(".")
    target = (share_root / relative).resolve()
    if not str(target).startswith(str(share_root) + os.sep) and target != share_root:
        raise HTTPException(403, "Acesso negado")
    return target, share


@router.get("")
async def list_dir(path: str, request: Request):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(path, shares)
    if not target.exists():
        raise HTTPException(404, "Caminho não encontrado")
    if not target.is_dir():
        raise HTTPException(400, "Não é um diretório")
    items = []
    for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
        stat = entry.stat(follow_symlinks=False)
        items.append({
            "name": entry.name,
            "type": "dir" if entry.is_dir(follow_symlinks=False) else "file",
            "size": None if entry.is_dir(follow_symlinks=False) else stat.st_size,
            "modified": datetime.utcfromtimestamp(stat.st_mtime).isoformat(),
        })
    return {"path": path, "items": items}


@router.get("/download")
async def download_file(path: str, request: Request):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(path, shares)
    if not target.exists() or not target.is_file():
        raise HTTPException(404, "Arquivo não encontrado")
    user = get_current_user(request)
    audit.log_action(user["sub"], "download", str(target), request.client.host)

    def _iter():
        with open(target, "rb") as f:
            while chunk := f.read(65536):
                yield chunk

    return StreamingResponse(
        _iter(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{target.name}"'},
    )


@router.post("/upload")
async def upload_file(path: str, request: Request, file: UploadFile = File(...)):
    from config import MAX_UPLOAD_BYTES
    shares = _get_user_shares(request)
    target_dir, _ = _resolve_path(path, shares)
    if not target_dir.is_dir():
        raise HTTPException(400, "Destino não é um diretório")
    dest = target_dir / file.filename
    size = 0
    with open(dest, "wb") as f:
        while chunk := await file.read(65536):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                f.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(413, "Arquivo excede o limite de tamanho")
            f.write(chunk)
    user = get_current_user(request)
    audit.log_action(user["sub"], "upload", str(dest), request.client.host)
    return {"ok": True, "name": file.filename, "size": size}


class MkdirRequest(BaseModel):
    path: str


@router.post("/mkdir")
async def mkdir(req: MkdirRequest, request: Request):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(req.path, shares)
    target.mkdir(parents=False, exist_ok=False)
    user = get_current_user(request)
    audit.log_action(user["sub"], "mkdir", str(target), request.client.host)
    return {"ok": True}


class RenameRequest(BaseModel):
    path: str
    new_name: str


@router.post("/rename")
async def rename(req: RenameRequest, request: Request):
    if "/" in req.new_name or "\\" in req.new_name:
        raise HTTPException(400, "new_name não pode conter separadores de caminho")
    shares = _get_user_shares(request)
    target, _ = _resolve_path(req.path, shares)
    dest = target.parent / req.new_name
    _resolve_path(str(Path(req.path).parent / req.new_name), shares)
    target.rename(dest)
    user = get_current_user(request)
    audit.log_action(user["sub"], "rename", f"{target} -> {dest}", request.client.host)
    return {"ok": True}


@router.delete("")
async def delete(path: str, request: Request, confirm: bool = False):
    shares = _get_user_shares(request)
    target, _ = _resolve_path(path, shares)
    if not target.exists():
        raise HTTPException(404, "Caminho não encontrado")
    if target.is_dir() and any(target.iterdir()) and not confirm:
        raise HTTPException(400, "Pasta não está vazia. Use confirm=true para confirmar.")
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    user = get_current_user(request)
    audit.log_action(user["sub"], "delete", str(target), request.client.host)
    return {"ok": True}
```

- [ ] **Step 4: Criar fileexplorer/main.py**

```python
# fileexplorer/main.py
import os
import re

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator

import auth
import audit
from auth import get_current_user
from config import PORT, HOST

app = FastAPI(docs_url=None, redoc_url=None)
audit.init_db()

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


class LoginData(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) > 64 or not re.match(r'^[\w.\-@\\]+$', v):
            raise ValueError("username inválido")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 256:
            raise ValueError("password inválido")
        return v


@app.post("/api/login")
async def login(data: LoginData) -> JSONResponse:
    if not auth.pam_authenticate(data.username, data.password):
        raise HTTPException(401, "Credenciais inválidas")
    shares = auth.get_user_shares(data.username)
    if not shares:
        raise HTTPException(403, "Nenhum compartilhamento autorizado para este usuário")
    token = auth.create_token(data.username)
    resp = JSONResponse({"ok": True, "username": data.username, "shares": shares})
    resp.set_cookie("token", token, httponly=True, samesite="lax", max_age=28800)
    return resp


@app.post("/api/logout")
async def logout() -> JSONResponse:
    resp = JSONResponse({"ok": True})
    resp.delete_cookie("token")
    return resp


@app.get("/api/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    shares = auth.get_user_shares(user["sub"])
    return {**user, "shares": shares}


def _include_routers():
    from api import files
    app.include_router(files.router, prefix="/api/files",
                       dependencies=[Depends(get_current_user)])

_include_routers()

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/login", response_class=HTMLResponse)
    async def login_page():
        with open(os.path.join(STATIC_DIR, "login.html")) as f:
            return f.read()

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def spa(full_path: str, request: Request):
        token = request.cookies.get("token")
        if not token or not auth.decode_token(token):
            return RedirectResponse("/login")
        with open(os.path.join(STATIC_DIR, "index.html")) as f:
            return HTMLResponse(f.read())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
```

- [ ] **Step 5: Rodar todos os testes**

```bash
cd ~/labsrvfiles
python -m pytest fileexplorer/tests/ -v
```

Esperado: todos PASSED.

- [ ] **Step 6: Commit**

```bash
git add fileexplorer/
git commit -m "feat(fileexplorer): API de arquivos com path traversal protection e auditoria"
```

---

## Task 6: Frontend — HTML + CSS + JS

**Files:**
- Create: `fileexplorer/static/login.html`
- Create: `fileexplorer/static/index.html`
- Create: `fileexplorer/static/style.css`
- Create: `fileexplorer/static/app.js`

- [ ] **Step 1: Criar fileexplorer/static/login.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Explorador de Arquivos — Lab Sobral</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body class="login-page">
  <div class="login-box">
    <h1>🗂 Explorador de Arquivos</h1>
    <p class="subtitle">Lab Sobral — acesso com credenciais do domínio</p>
    <form id="login-form">
      <input type="text" id="username" placeholder="Usuário (ex: joao.silva)" required autocomplete="username">
      <input type="password" id="password" placeholder="Senha" required autocomplete="current-password">
      <button type="submit" id="login-btn">Entrar</button>
      <p id="login-error" class="error hidden"></p>
    </form>
  </div>
  <script>
    document.getElementById('login-form').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const err = document.getElementById('login-error');
      btn.disabled = true; btn.textContent = 'Entrando...';
      err.classList.add('hidden');
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: document.getElementById('username').value.trim(),
          password: document.getElementById('password').value,
        })
      });
      if (resp.ok) {
        window.location.href = '/';
      } else {
        const data = await resp.json().catch(() => ({}));
        err.textContent = data.detail || 'Erro ao autenticar';
        err.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'Entrar';
      }
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Criar fileexplorer/static/index.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Explorador de Arquivos — Lab Sobral</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <header class="topbar">
    <span class="topbar-logo">🗂 Explorador de Arquivos</span>
    <div class="topbar-breadcrumb" id="breadcrumb"></div>
    <input type="text" id="search-input" placeholder="🔍 Buscar...">
    <div class="view-toggle">
      <button id="btn-list" class="active">☰</button>
      <button id="btn-grid">⊞</button>
    </div>
    <span id="topbar-user" class="topbar-user"></span>
    <button id="btn-logout" class="btn-logout">Sair</button>
  </header>

  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-label">Meus Shares</div>
      <nav id="tree"></nav>
    </aside>

    <main class="main-panel">
      <div class="action-bar">
        <button id="btn-upload" class="btn-primary">⬆ Upload</button>
        <button id="btn-mkdir" class="btn-secondary">📁 Nova pasta</button>
        <span id="item-count" class="item-count"></span>
        <input type="file" id="file-input" style="display:none" multiple>
      </div>
      <div id="drop-overlay" class="drop-overlay hidden">Solte para fazer upload</div>
      <div id="file-list" class="file-list list-view"></div>
    </main>
  </div>

  <div id="modal-overlay" class="modal-overlay hidden">
    <div class="modal">
      <p id="modal-msg"></p>
      <input type="text" id="modal-input" class="hidden">
      <div class="modal-actions">
        <button id="modal-confirm" class="btn-primary">Confirmar</button>
        <button id="modal-cancel" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  </div>

  <script src="/static/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Criar fileexplorer/static/style.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d1117; --bg2: #161b22; --bg3: #21262d;
  --border: #30363d; --text: #e6edf3; --muted: #8b949e;
  --accent: #58a6ff; --green: #3fb950; --red: #f85149;
  --radius: 6px;
}

body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; }

.login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.login-box { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 40px; width: 360px; }
.login-box h1 { font-size: 20px; margin-bottom: 6px; }
.subtitle { color: var(--muted); font-size: 12px; margin-bottom: 24px; }
.login-box input { display: block; width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); padding: 8px 12px; margin-bottom: 12px; font-size: 14px; }
.login-box button[type=submit] { width: 100%; background: var(--accent); border: none; border-radius: var(--radius); color: #000; padding: 10px; font-weight: 600; cursor: pointer; }
.login-box button[type=submit]:disabled { opacity: .6; cursor: not-allowed; }
.error { color: var(--red); font-size: 12px; margin-top: 8px; }
.hidden { display: none !important; }

.topbar { display: flex; align-items: center; gap: 12px; background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 16px; height: 48px; position: sticky; top: 0; z-index: 10; }
.topbar-logo { font-weight: 600; white-space: nowrap; }
.topbar-breadcrumb { flex: 1; color: var(--muted); font-size: 13px; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.bc-link { cursor: pointer; color: var(--accent); }
.bc-current { color: var(--text); }
.bc-sep { color: var(--border); }
#search-input { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); padding: 5px 10px; font-size: 13px; width: 180px; }
.view-toggle button { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); color: var(--muted); padding: 4px 8px; cursor: pointer; }
.view-toggle button.active { background: var(--accent); color: #000; border-color: var(--accent); }
.topbar-user { color: var(--muted); font-size: 12px; white-space: nowrap; }
.btn-logout { background: transparent; border: 1px solid var(--border); border-radius: var(--radius); color: var(--muted); padding: 4px 10px; cursor: pointer; font-size: 12px; }

.app-layout { display: flex; height: calc(100vh - 48px); overflow: hidden; }
.sidebar { width: 200px; background: var(--bg); border-right: 1px solid var(--border); overflow-y: auto; padding: 12px 8px; flex-shrink: 0; }
.sidebar-label { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 0 8px 8px; }
.tree-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: var(--radius); cursor: pointer; font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tree-item:hover { background: var(--bg3); color: var(--text); }
.tree-item.active { background: rgba(88,166,255,.1); color: var(--accent); }
.tree-item.share-root { color: var(--text); font-weight: 500; }

.main-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
.action-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--bg); }
.btn-primary { background: #238636; border: 1px solid #2ea043; border-radius: var(--radius); color: #fff; padding: 5px 12px; cursor: pointer; font-size: 13px; }
.btn-primary:hover { background: #2ea043; }
.btn-secondary { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); color: var(--muted); padding: 5px 12px; cursor: pointer; font-size: 13px; }
.btn-secondary:hover { color: var(--text); }
.item-count { margin-left: auto; color: var(--muted); font-size: 12px; }

.drop-overlay { position: absolute; inset: 48px 0 0 0; background: rgba(88,166,255,.15); border: 2px dashed var(--accent); z-index: 5; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--accent); pointer-events: none; }

.file-list { flex: 1; overflow-y: auto; padding: 8px 12px; }
.list-header { display: grid; grid-template-columns: 24px 1fr 90px 150px 100px; gap: 8px; padding: 4px 8px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
.file-row { display: grid; grid-template-columns: 24px 1fr 90px 150px 100px; gap: 8px; padding: 6px 8px; border-radius: var(--radius); align-items: center; }
.file-row:hover { background: var(--bg2); }
.file-row .f-name { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-row .f-name.is-dir { color: var(--accent); cursor: pointer; }
.file-row .f-name.is-file { color: var(--text); }
.file-row .f-meta { color: var(--muted); font-size: 12px; }
.file-row .f-actions { display: flex; gap: 4px; opacity: 0; }
.file-row:hover .f-actions { opacity: 1; }
.f-actions button { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 14px; padding: 2px 4px; border-radius: 3px; }
.f-actions button:hover { color: var(--text); background: var(--bg3); }

.grid-view { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; padding: 12px; align-content: start; }
.grid-view .list-header { display: none; }
.file-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 8px; text-align: center; cursor: pointer; position: relative; }
.file-card:hover { border-color: var(--accent); }
.card-icon { font-size: 28px; margin-bottom: 6px; }
.card-name { font-size: 11px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-actions { position: absolute; top: 4px; right: 4px; display: none; gap: 2px; }
.file-card:hover .card-actions { display: flex; }
.card-actions button { background: var(--bg3); border: 1px solid var(--border); border-radius: 3px; color: var(--muted); font-size: 12px; padding: 1px 4px; cursor: pointer; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 100; display: flex; align-items: center; justify-content: center; }
.modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 24px; width: 360px; }
.modal p { margin-bottom: 16px; }
.modal input { display: block; width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); padding: 8px 12px; margin-bottom: 16px; font-size: 14px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

.upload-toast { position: fixed; bottom: 16px; right: 16px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 16px; font-size: 13px; z-index: 50; max-width: 280px; }
```

- [ ] **Step 4: Criar fileexplorer/static/app.js**

Nota de segurança: todos os nomes de arquivo e paths são inseridos via `textContent` ou `createTextNode` — nunca via `innerHTML` com dados do servidor. Os botões de ação são criados com `createElement` + `addEventListener` para evitar XSS.

```javascript
// fileexplorer/static/app.js

const state = {
  username: '',
  shares: [],
  currentPath: '',
  currentItems: [],
  viewMode: localStorage.getItem('viewMode') || 'list',
};

// ── Bootstrap ──────────────────────────────────────────────────────────────

async function init() {
  const resp = await fetch('/api/me');
  if (!resp.ok) { window.location.href = '/login'; return; }
  const me = await resp.json();
  state.username = me.sub;
  state.shares = me.shares || [];
  document.getElementById('topbar-user').textContent = me.sub;
  setView(state.viewMode, false);
  wireButtons();
  renderTree();
  if (state.shares.length === 1) navigate(state.shares[0].name + '/');
}

function wireButtons() {
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-list').addEventListener('click', () => setView('list', true));
  document.getElementById('btn-grid').addEventListener('click', () => setView('grid', true));
  document.getElementById('btn-upload').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('btn-mkdir').addEventListener('click', promptMkdir);
  document.getElementById('file-input').addEventListener('change', e => uploadFiles(e.target.files));
  document.getElementById('search-input').addEventListener('input', e => filterItems(e.target.value));
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  wireDragDrop();
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}

// ── Tree ───────────────────────────────────────────────────────────────────

function renderTree() {
  const nav = document.getElementById('tree');
  nav.textContent = '';
  for (const share of state.shares) {
    const el = document.createElement('div');
    el.className = 'tree-item share-root';
    el.dataset.path = share.name + '/';
    el.textContent = '📁 ' + share.name;
    el.addEventListener('click', () => navigate(share.name + '/'));
    nav.appendChild(el);
  }
}

function updateTreeActive() {
  document.querySelectorAll('.tree-item').forEach(el => {
    el.classList.toggle('active', state.currentPath.startsWith(el.dataset.path));
  });
}

// ── Navigation ─────────────────────────────────────────────────────────────

async function navigate(path) {
  state.currentPath = path.endsWith('/') ? path : path + '/';
  const resp = await fetch('/api/files?path=' + encodeURIComponent(state.currentPath));
  if (!resp.ok) { showToast('Erro ao listar diretório'); return; }
  const data = await resp.json();
  state.currentItems = data.items || [];
  renderBreadcrumb();
  renderItems(state.currentItems);
  updateTreeActive();
  document.getElementById('search-input').value = '';
}

function renderBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  bc.textContent = '';
  const parts = state.currentPath.replace(/\/$/, '').split('/').filter(Boolean);
  let built = '';
  parts.forEach((part, i) => {
    built += (built ? '/' : '') + part;
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep';
      sep.textContent = ' › ';
      bc.appendChild(sep);
    }
    const span = document.createElement('span');
    span.textContent = part;
    if (i < parts.length - 1) {
      span.className = 'bc-link';
      const captured = built + '/';
      span.addEventListener('click', () => navigate(captured));
    } else {
      span.className = 'bc-current';
    }
    bc.appendChild(span);
  });
}

// ── Render items ───────────────────────────────────────────────────────────

function renderItems(items) {
  const container = document.getElementById('file-list');
  document.getElementById('item-count').textContent =
    items.length + ' ' + (items.length === 1 ? 'item' : 'itens');

  container.textContent = '';

  if (state.viewMode === 'list') {
    container.className = 'file-list list-view';
    const header = document.createElement('div');
    header.className = 'list-header';
    ['', 'Nome', 'Tamanho', 'Modificado', 'Ações'].forEach(t => {
      const s = document.createElement('span');
      s.textContent = t;
      header.appendChild(s);
    });
    container.appendChild(header);
    items.forEach(item => container.appendChild(makeListRow(item)));
  } else {
    container.className = 'file-list grid-view';
    items.forEach(item => container.appendChild(makeGridCard(item)));
  }
}

function makeListRow(item) {
  const itemPath = state.currentPath + item.name;
  const row = document.createElement('div');
  row.className = 'file-row';

  const icon = document.createElement('span');
  icon.textContent = item.type === 'dir' ? '📁' : fileIcon(item.name);
  row.appendChild(icon);

  const name = document.createElement('span');
  name.className = 'f-name ' + (item.type === 'dir' ? 'is-dir' : 'is-file');
  name.textContent = item.name;
  if (item.type === 'dir') name.addEventListener('click', () => navigate(itemPath + '/'));
  row.appendChild(name);

  const size = document.createElement('span');
  size.className = 'f-meta';
  size.textContent = item.size != null ? fmtSize(item.size) : '—';
  row.appendChild(size);

  const mod = document.createElement('span');
  mod.className = 'f-meta';
  mod.textContent = item.modified
    ? new Date(item.modified + 'Z').toLocaleString('pt-BR')
    : '—';
  row.appendChild(mod);

  row.appendChild(makeActionButtons(item, itemPath));
  return row;
}

function makeGridCard(item) {
  const itemPath = state.currentPath + item.name;
  const card = document.createElement('div');
  card.className = 'file-card';
  if (item.type === 'dir') card.addEventListener('click', () => navigate(itemPath + '/'));

  const icon = document.createElement('div');
  icon.className = 'card-icon';
  icon.textContent = item.type === 'dir' ? '📁' : fileIcon(item.name);
  card.appendChild(icon);

  const label = document.createElement('div');
  label.className = 'card-name';
  label.title = item.name;
  label.textContent = item.name;
  card.appendChild(label);

  const actions = makeActionButtons(item, itemPath);
  actions.className = 'card-actions';
  card.appendChild(actions);
  return card;
}

function makeActionButtons(item, itemPath) {
  const wrap = document.createElement('span');
  wrap.className = 'f-actions';

  if (item.type === 'file') {
    const dl = document.createElement('button');
    dl.title = 'Download'; dl.textContent = '⬇️';
    dl.addEventListener('click', e => { e.stopPropagation(); downloadFile(itemPath); });
    wrap.appendChild(dl);
  }

  const ren = document.createElement('button');
  ren.title = 'Renomear'; ren.textContent = '✏️';
  ren.addEventListener('click', e => { e.stopPropagation(); promptRename(itemPath, item.name); });
  wrap.appendChild(ren);

  const del = document.createElement('button');
  del.title = 'Deletar'; del.textContent = '🗑️';
  del.addEventListener('click', e => { e.stopPropagation(); promptDelete(itemPath, item.type === 'dir'); });
  wrap.appendChild(del);

  return wrap;
}

function filterItems(q) {
  const filtered = q
    ? state.currentItems.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))
    : state.currentItems;
  renderItems(filtered);
}

function setView(mode, rerender) {
  state.viewMode = mode;
  localStorage.setItem('viewMode', mode);
  document.getElementById('btn-list').classList.toggle('active', mode === 'list');
  document.getElementById('btn-grid').classList.toggle('active', mode === 'grid');
  if (rerender && state.currentItems.length) renderItems(state.currentItems);
}

// ── File operations ────────────────────────────────────────────────────────

function downloadFile(path) {
  window.location.href = '/api/files/download?path=' + encodeURIComponent(path);
}

function promptMkdir() {
  showModal('Nome da nova pasta:', '', true, async name => {
    if (!name) return;
    const resp = await fetch('/api/files/mkdir', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ path: state.currentPath + name }),
    });
    if (resp.ok) navigate(state.currentPath);
    else showToast('Erro ao criar pasta');
  });
}

function promptRename(path, currentName) {
  showModal('Novo nome:', currentName, true, async newName => {
    if (!newName || newName === currentName) return;
    const resp = await fetch('/api/files/rename', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ path, new_name: newName }),
    });
    if (resp.ok) navigate(state.currentPath);
    else showToast('Erro ao renomear');
  });
}

function promptDelete(path, isDir) {
  const name = path.split('/').pop();
  const msg = isDir
    ? 'Deletar pasta "' + name + '" e todo o seu conteúdo?'
    : 'Deletar arquivo "' + name + '"?';
  showModal(msg, null, false, async () => {
    const resp = await fetch(
      '/api/files?path=' + encodeURIComponent(path) + '&confirm=true',
      { method: 'DELETE' }
    );
    if (resp.ok) navigate(state.currentPath);
    else showToast('Erro ao deletar');
  });
}

// ── Upload ─────────────────────────────────────────────────────────────────

async function uploadFiles(files) {
  for (const file of Array.from(files)) {
    const toast = showToast('Enviando ' + file.name + '…', true);
    const form = new FormData();
    form.append('file', file);
    const resp = await fetch(
      '/api/files/upload?path=' + encodeURIComponent(state.currentPath),
      { method: 'POST', body: form }
    );
    toast.remove();
    if (!resp.ok) showToast('Erro ao enviar ' + file.name);
  }
  navigate(state.currentPath);
  document.getElementById('file-input').value = '';
}

function wireDragDrop() {
  const overlay = document.getElementById('drop-overlay');
  let depth = 0;
  document.addEventListener('dragenter', e => { e.preventDefault(); depth++; overlay.classList.remove('hidden'); });
  document.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; overlay.classList.add('hidden'); } });
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault(); depth = 0; overlay.classList.add('hidden');
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  });
}

// ── Modal ──────────────────────────────────────────────────────────────────

let _modalCb = null;

function showModal(msg, inputDefault, hasInput, callback) {
  _modalCb = callback;
  document.getElementById('modal-msg').textContent = msg;
  const inp = document.getElementById('modal-input');
  if (hasInput) {
    inp.classList.remove('hidden');
    inp.value = inputDefault || '';
    setTimeout(() => inp.focus(), 50);
  } else {
    inp.classList.add('hidden');
  }
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-confirm').onclick = () => {
    const val = hasInput ? inp.value.trim() : null;
    closeModal();
    _modalCb && _modalCb(val);
  };
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(msg, persistent) {
  const el = document.createElement('div');
  el.className = 'upload-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  if (!persistent) setTimeout(() => el.remove(), 3000);
  return el;
}

// ── Utils ──────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {pdf:'📄',xlsx:'📊',xls:'📊',doc:'📝',docx:'📝',ppt:'📊',pptx:'📊',
               jpg:'🖼',jpeg:'🖼',png:'🖼',gif:'🖼',mp4:'🎬',avi:'🎬',
               zip:'📦',rar:'📦','7z':'📦',txt:'📄',csv:'📊'};
  return map[ext] || '📄';
}

init();
```

- [ ] **Step 5: Commit**

```bash
git add fileexplorer/static/
git commit -m "feat(fileexplorer): frontend SPA com tree, breadcrumb, upload drag-drop e CRUD"
```

---

## Task 7: Integração no painel admin

**Files:**
- Modify: `panel/api/admin.py`
- Modify: `panel/static/index.html`
- Modify: `panel/static/app.js`

- [ ] **Step 1: Adicionar endpoint file-audit em panel/api/admin.py**

Adicionar import `sqlite3` no topo (se não existir) e o seguinte endpoint ao final do arquivo:

```python
FILE_AUDIT_DB = "/opt/labsrv-files/audit.db"


@router.get("/file-audit")
async def file_audit(
    user: dict = Depends(require_role("readonly", "operador", "superadmin")),
    username: str = "",
    action: str = "",
    limit: int = 100,
):
    if not os.path.exists(FILE_AUDIT_DB):
        return {"logs": [], "note": "labsrv-files não instalado"}
    import sqlite3
    sql = "SELECT id, timestamp, username, action, path, ip FROM file_audit_log WHERE 1=1"
    params: list = []
    if username:
        sql += " AND username = ?"
        params.append(username)
    if action:
        sql += " AND action = ?"
        params.append(action)
    sql += " ORDER BY id DESC LIMIT ?"
    params.append(min(limit, 500))
    with sqlite3.connect(FILE_AUDIT_DB) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute(sql, params).fetchall()
    return {"logs": [dict(r) for r in rows]}
```

- [ ] **Step 2: Localizar onde ficam as seções no panel/static/index.html**

```bash
grep -n "section\|id=" ~/labsrvfiles/panel/static/index.html | head -40
```

Identificar o padrão de seções existentes (ex: `<section id="shares" class="...">`).

- [ ] **Step 3: Adicionar seção de auditoria no panel/static/index.html**

Seguindo o padrão das outras seções encontradas no step 2, adicionar antes do `</main>`:

```html
<section id="file-audit" class="section hidden">
  <h2>🗂 Auditoria de Arquivos</h2>
  <p class="section-desc">Operações realizadas no Explorador de Arquivos</p>
  <table id="file-audit-table" class="data-table">
    <thead>
      <tr><th>Timestamp</th><th>Usuário</th><th>Ação</th><th>Caminho</th><th>IP</th></tr>
    </thead>
    <tbody></tbody>
  </table>
</section>
```

- [ ] **Step 4: Localizar onde ficam os itens de navegação no panel/static/app.js**

```bash
grep -n "shares\|servicos\|conexoes\|section\|nav" ~/labsrvfiles/panel/static/app.js | head -40
```

Identificar o array de seções ou a função de navegação usada pelo painel.

- [ ] **Step 5: Adicionar aba e função loadFileAudit no panel/static/app.js**

Seguindo o padrão identificado no step 4, adicionar a aba ao array/switch de seções e a função:

```javascript
async function loadFileAudit() {
  const resp = await fetch('/api/admin/file-audit?limit=100');
  const data = await resp.json();
  const tbody = document.querySelector('#file-audit-table tbody');
  if (!tbody) return;
  const logs = data.logs || [];
  tbody.textContent = '';
  if (logs.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.style.textAlign = 'center';
    td.textContent = data.note || 'Sem registros';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  const actions = { upload: '#3fb950', download: '#58a6ff', delete: '#f85149', mkdir: '#d29922', rename: '#e6edf3' };
  for (const r of logs) {
    const tr = document.createElement('tr');
    [r.timestamp, r.username, r.action, r.path, r.ip].forEach((val, i) => {
      const td = document.createElement('td');
      if (i === 2) {
        td.style.color = actions[val] || '#e6edf3';
        td.style.fontWeight = '500';
      }
      if (i === 3) td.style.fontSize = '12px';
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add panel/api/admin.py panel/static/index.html panel/static/app.js
git commit -m "feat(panel): aba Auditoria de Arquivos integrada ao labsrv-files"
```

---

## Task 8: Systemd + deploy

**Files:**
- Create: `fileexplorer/labsrv-files.service`
- Create: `fileexplorer/install.sh`
- Modify: `.gitignore`

- [ ] **Step 1: Criar fileexplorer/labsrv-files.service**

```ini
[Unit]
Description=Lab Sobral File Explorer
After=network.target sssd.service

[Service]
Type=simple
User=admin
WorkingDirectory=/opt/labsrv-files
ExecStart=/opt/labsrv-files/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8081 --workers 1
Restart=on-failure
RestartSec=5
Environment=PYTHONPATH=/opt/labsrv-files

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 2: Criar fileexplorer/install.sh**

```bash
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
```

- [ ] **Step 3: Tornar executável e atualizar .gitignore**

```bash
chmod +x ~/labsrvfiles/fileexplorer/install.sh
```

Adicionar ao `.gitignore`:
```
.superpowers/
fileexplorer/__pycache__/
fileexplorer/**/__pycache__/
fileexplorer/.pytest_cache/
fileexplorer/tests/__pycache__/
```

- [ ] **Step 4: Commit**

```bash
git add fileexplorer/labsrv-files.service fileexplorer/install.sh .gitignore
git commit -m "feat(fileexplorer): systemd unit e script de deploy"
```

- [ ] **Step 5: Deploy no servidor**

```bash
ssh admin@192.86.221.213 "cd ~/labsrvfiles && git pull && bash fileexplorer/install.sh"
```

- [ ] **Step 6: Verificar serviço**

```bash
ssh admin@192.86.221.213 "sudo systemctl status labsrv-files && curl -s http://localhost:8081/api/me"
```

Esperado: `active (running)` e `{"detail":"Não autenticado"}`.

- [ ] **Step 7: Testar login com pmiranda**

```bash
ssh admin@192.86.221.213 "curl -s -X POST http://localhost:8081/api/login \
  -H 'Content-Type: application/json' \
  -d '{\"username\":\"pmiranda\",\"password\":\"Acesso#1508\"}' | python3 -m json.tool"
```

Esperado: `{"ok": true, "username": "pmiranda", "shares": [...]}`.

- [ ] **Step 8: Deploy do painel (aba de auditoria)**

```bash
ssh admin@192.86.221.213 "sudo rsync -a --delete ~/labsrvfiles/panel/ /opt/labsrv-panel/ && sudo systemctl restart labsrv-panel"
```

---

## Comandos de verificação

```bash
# Todos os testes
cd ~/labsrvfiles && python -m pytest fileexplorer/tests/ panel/tests/ -v

# Status em produção
ssh admin@192.86.221.213 "sudo systemctl status labsrv-files labsrv-panel"

# Logs do serviço
ssh admin@192.86.221.213 "journalctl -u labsrv-files -n 50"
```

# panel/api/cutover.py
import json
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from auth import require_role, log_admin_action
from config import CUTOVER_FILE

router = APIRouter()

ALL_SHARES = [
    {"name": "DEPARTAMENTO_TECNICO",  "path": "/srv/samba/DEPARTAMENTO_TECNICO",           "group": "LABSOBRALNET\\SISTEMA DA QUALIDADE"},
    {"name": "CONTABILIDADE",         "path": "/srv/samba/CONTABILIDADE",                  "group": "LABSOBRALNET\\CONTABILIDADE"},
    {"name": "FISCAL",                "path": "/srv/samba/FISCAL",                         "group": "LABSOBRALNET\\CONTABILIDADE"},
    {"name": "CONTROLADORIA",         "path": "/srv/samba/CONTROLADORIA",                  "group": "LABSOBRALNET\\CONTROLADORIA"},
    {"name": "FINANCEIRO",            "path": "/srv/samba/FINANCEIRO",                     "group": "LABSOBRALNET\\FINANCEIRO"},
    {"name": "RECURSOS_HUMANOS",      "path": "/srv/samba/RECURSOS_HUMANOS",               "group": "LABSOBRALNET\\RECURSOS HUMANOS"},
    {"name": "COMERCIAL_VENDAS",      "path": "/srv/samba/COMERCIAL_VENDAS",               "group": "comercial1, comercial2, comercial3"},
    {"name": "INDUSTRIAL",            "path": "/srv/samba/INDUSTRIAL",                     "group": "LABSOBRALNET\\INDUSTRIAL"},
    {"name": "SUPRIMENTOS",           "path": "/srv/samba/SUPRIMENTOS",                    "group": "LABSOBRALNET\\PCP"},
    {"name": "MANUTENCAO",            "path": "/srv/samba/MANUTENCAO",                     "group": "LABSOBRALNET\\MANUTENÇÃO"},
    {"name": "LOGISTICA_RECEBIMENTO", "path": "/srv/samba/LOGISTICA_RECEBIMENTO",          "group": "LABSOBRALNET\\LOGISTICA"},
    {"name": "LOGISTICA_EXPEDICAO",   "path": "/srv/samba/LOGISTICA_EXPEDICAO",            "group": "LABSOBRALNET\\LOGISTICA"},
    {"name": "MARKETING",             "path": "/mnt/hdd/samba/MARKETING",                  "group": "LABSOBRALNET\\MARKETING"},
    {"name": "SEGURANCA_TRABALHO",    "path": "/mnt/hdd/samba/SEGURANCA_TRABALHO",         "group": "LABSOBRALNET\\SESMT"},
    {"name": "SERVICOS_GERAIS",       "path": "/mnt/hdd/samba/SERVICOS_GERAIS",            "group": "LABSOBRALNET\\SERVICOS GERAIS"},
    {"name": "DIRETORIAS",            "path": "/mnt/hdd/samba/DIRETORIAS",                 "group": "LABSOBRALNET\\PRESIDENCIA"},
    {"name": "SECRETARIA",            "path": "/mnt/hdd/samba/SECRETARIA",                 "group": "LABSOBRALNET\\SECRETARIA"},
    {"name": "TI",                    "path": "/mnt/hdd/samba/TI",                         "group": "LABSOBRALNET\\Administradores"},
    {"name": "LINKS_UTEIS",           "path": "/mnt/hdd/samba/MARKETING/LINKS_UTEIS",      "group": "vendedores (local)"},
]

_SHARE_NAMES = {s["name"] for s in ALL_SHARES}


def _load() -> dict:
    if os.path.exists(CUTOVER_FILE):
        with open(CUTOVER_FILE, "r") as f:
            return json.load(f)
    return {}


def _save(state: dict) -> None:
    with open(CUTOVER_FILE, "w") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def _build_list(state: dict) -> list:
    return [
        {
            **s,
            "exists":       os.path.isdir(s["path"]),
            "validated":    state.get(s["name"], {}).get("validated", False),
            "validated_by": state.get(s["name"], {}).get("validated_by"),
            "validated_at": state.get(s["name"], {}).get("validated_at"),
        }
        for s in ALL_SHARES
    ]


@router.get("")
async def cutover_status(user: dict = Depends(require_role("readonly", "operador", "superadmin"))):
    state = _load()
    shares = _build_list(state)
    done = sum(1 for s in shares if s["validated"])
    return {"shares": shares, "done_count": done, "total": len(shares)}


@router.post("/{share}/validar")
async def validar_share(share: str, user: dict = Depends(require_role("operador"))):
    if share not in _SHARE_NAMES:
        raise HTTPException(400, f"Share desconhecido: {share}")
    state = _load()
    state[share] = {
        "validated":    True,
        "validated_by": user["sub"],
        "validated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    _save(state)
    log_admin_action(user["sub"], f"CUTOVER: {share} validado")
    shares = _build_list(state)
    done = sum(1 for s in shares if s["validated"])
    return {"ok": True, "done_count": done, "total": len(shares)}


@router.post("/{share}/reset")
async def reset_share(share: str, user: dict = Depends(require_role("superadmin"))):
    if share not in _SHARE_NAMES:
        raise HTTPException(400, f"Share desconhecido: {share}")
    state = _load()
    state.pop(share, None)
    _save(state)
    log_admin_action(user["sub"], f"CUTOVER: validação de {share} revertida")
    return {"ok": True}

# panel/api/shares.py
from fastapi import APIRouter
from auth import run_cmd

router = APIRouter()

SHARE_GROUPS = {
    "DEPARTAMENTO_TECNICO": "LABSOBRALNET\\SISTEMA DA QUALIDADE",
    "CONTABILIDADE": "LABSOBRALNET\\CONTABILIDADE",
    "FISCAL": "LABSOBRALNET\\CONTABILIDADE",
    "CONTROLADORIA": "LABSOBRALNET\\CONTROLADORIA",
    "FINANCEIRO": "LABSOBRALNET\\FINANCEIRO",
    "RECURSOS_HUMANOS": "LABSOBRALNET\\RECURSOS HUMANOS",
    "COMERCIAL_VENDAS": "local: comercial1/2/3",
    "INDUSTRIAL": "LABSOBRALNET\\INDUSTRIAL",
    "SUPRIMENTOS": "LABSOBRALNET\\PCP",
    "MANUTENCAO": "LABSOBRALNET\\MANUTENÇÃO",
    "LOGISTICA_RECEBIMENTO": "LABSOBRALNET\\LOGISTICA",
    "LOGISTICA_EXPEDICAO": "LABSOBRALNET\\LOGISTICA",
    "MARKETING": "LABSOBRALNET\\MARKETING",
    "SEGURANCA_TRABALHO": "LABSOBRALNET\\SESMT",
    "SERVICOS_GERAIS": "LABSOBRALNET\\SERVICOS GERAIS",
    "DIRETORIAS": "LABSOBRALNET\\PRESIDENCIA",
    "SECRETARIA": "LABSOBRALNET\\SECRETARIA",
    "TI": "LABSOBRALNET\\Administradores",
    "LINKS_UTEIS": "local: vendedores",
}


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

"""Transfere o setup script .181 -> .218 (C:\\Temp). Nao executa nada."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
src = r"C:\PROJETOS\CONTA SUPORTE\labsrvfiles\scripts\setup-winrm-audit-218.ps1"
dst = r"C:\Temp\setup-winrm-audit-218.ps1"
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=180, read_timeout=300)
c.copy(src, dst)
print(f"OK copiado -> {dst}")
# confirma tamanho remoto
out, streams, had_err = c.execute_ps(f"(Get-Item '{dst}').Length")
print("tamanho remoto:", (out or "").strip())

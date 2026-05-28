"""Transfere a versao ASCII correta do faust-purge.ps1 (.181 repo) -> C:\\Temp no .218."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
src = r"C:\PROJETOS\CONTA SUPORTE\labsrvfiles\scripts\faust-purge.ps1"
dst = r"C:\Temp\faust-purge.ps1"
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=180, read_timeout=300)
c.copy(src, dst)
# valida sintaxe + bytes apos a copia
ps = r'''
$e=$null
[void][System.Management.Automation.PSParser]::Tokenize((Get-Content 'C:\Temp\faust-purge.ps1' -Raw),[ref]$e)
if ($e) { $e | ForEach-Object { "PARSE ERR linha $($_.Token.StartLine): $($_.Message)" } } else { "Sintaxe OK" }
$b=[System.IO.File]::ReadAllBytes('C:\Temp\faust-purge.ps1')
"primeiros bytes: " + (($b[0..3]) -join ',')
"total linhas: " + (Get-Content 'C:\Temp\faust-purge.ps1').Count
'''
out, streams, had_err = c.execute_ps(ps)
print(out)

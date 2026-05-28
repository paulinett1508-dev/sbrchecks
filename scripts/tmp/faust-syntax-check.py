"""Read-only: valida sintaxe/encoding do faust-purge.ps1 no .218 (via Write tool, sem bug de heredoc)."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
$errs = $null
$content = Get-Content 'C:\Temp\faust-purge.ps1' -Raw
[void][System.Management.Automation.PSParser]::Tokenize($content, [ref]$errs)
if ($errs) { $errs | ForEach-Object { "PARSE ERR linha $($_.Token.StartLine) col $($_.Token.StartColumn): $($_.Message)" } } else { "Sintaxe OK (parser nao achou erro)" }
$b = [System.IO.File]::ReadAllBytes('C:\Temp\faust-purge.ps1')
"primeiros bytes (BOM?): " + (($b[0..3]) -join ',')
"total linhas: " + (Get-Content 'C:\Temp\faust-purge.ps1').Count
"--- conteudo (primeiras 25 linhas) ---"
Get-Content 'C:\Temp\faust-purge.ps1' -TotalCount 25
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=120, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

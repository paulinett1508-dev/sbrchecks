import keyring
from pypsrp.client import Client
pwd = keyring.get_password("lab-audit", "labsobralnet\administrador")
ps = r'''
$errs = $null
$content = Get-Content 'C:\Temp\faust-purge.ps1' -Raw
[void][System.Management.Automation.PSParser]::Tokenize($content, [ref]$errs)
if ($errs) { $errs | ForEach-Object { "PARSE ERR linha $($_.Token.StartLine): $($_.Message)" } } else { "Sintaxe OK" }
$b = [System.IO.File]::ReadAllBytes('C:\Temp\faust-purge.ps1')
"primeiros bytes (BOM?): " + (($b[0..2]) -join ',')
"--- primeiras 22 linhas ---"
Get-Content 'C:\Temp\faust-purge.ps1' -TotalCount 22
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=120, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error: print("ERR:", e)

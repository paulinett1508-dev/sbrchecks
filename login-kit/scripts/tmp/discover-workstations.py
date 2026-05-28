"""Descoberta read-only de workstations no AD (.218) para escolher pilotos."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
Import-Module ActiveDirectory -ErrorAction SilentlyContinue
$cut = (Get-Date).AddDays(-30)
$comps = Get-ADComputer -Filter {Enabled -eq $true} -Properties OperatingSystem,LastLogonDate,IPv4Address,DistinguishedName |
  Where-Object { $_.OperatingSystem -match 'Windows (11|10|8|7)' -and $_.LastLogonDate -gt $cut }
"=== Workstations client ativas (LastLogon <= 30d): $($comps.Count) ==="
""
"=== OUs distintas (contagem) ==="
$comps | ForEach-Object { ($_.DistinguishedName -split ',',2)[1] } |
  Group-Object | Sort-Object Count -Descending |
  ForEach-Object { "{0,4}  {1}" -f $_.Count, $_.Name }
""
"=== TOP 25 por LastLogonDate ==="
$comps | Sort-Object LastLogonDate -Descending | Select-Object -First 25 `
  Name, IPv4Address, OperatingSystem, @{n='LastLogon';e={$_.LastLogonDate.ToString('yyyy-MM-dd')}}, DistinguishedName |
  Format-Table -AutoSize | Out-String -Width 220
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=120, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

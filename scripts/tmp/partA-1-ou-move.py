"""Parte A.1 — criar OU=Workstations e mover os 5 pilotos. AD write no .218."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
Import-Module ActiveDirectory -ErrorAction Stop
$ouPath = "DC=labsobralnet,DC=ind"
$ouDN   = "OU=Workstations,DC=labsobralnet,DC=ind"
$existing = Get-ADOrganizationalUnit -Filter "DistinguishedName -eq '$ouDN'" -ErrorAction SilentlyContinue
if (-not $existing) {
  New-ADOrganizationalUnit -Name "Workstations" -Path $ouPath -ProtectedFromAccidentalDeletion $true
  "OU criada: $ouDN"
} else { "OU ja existe: $ouDN" }

$pilots = "LABCON01","LABCQ01","LABFIN09","LABPROD05","LABMANUT03"
foreach ($p in $pilots) {
  try {
    $c = Get-ADComputer -Identity $p -ErrorAction Stop
    if ($c.DistinguishedName -like "*$ouDN") { "ja na OU: $p" }
    else { Move-ADObject -Identity $c.DistinguishedName -TargetPath $ouDN -ErrorAction Stop; "movido: $p -> OU=Workstations" }
  } catch { "ERRO mover $p : $($_.Exception.Message)" }
}
"=== Conteudo atual de OU=Workstations ==="
Get-ADComputer -Filter * -SearchBase $ouDN | Select-Object -ExpandProperty Name
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=180, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

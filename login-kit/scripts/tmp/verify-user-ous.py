"""Read-only: onde estao as contas de usuario e onde as GPOs de mapeamento linkam."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
Import-Module ActiveDirectory -ErrorAction SilentlyContinue
Import-Module GroupPolicy -ErrorAction SilentlyContinue

"=== OUs onde estao as contas de USUARIO ativas (top 15) ==="
Get-ADUser -Filter {Enabled -eq $true} -Properties DistinguishedName |
  ForEach-Object { ($_.DistinguishedName -split ',',2)[1] } |
  Group-Object | Sort-Object Count -Descending | Select-Object -First 15 |
  ForEach-Object { "{0,5}  {1}" -f $_.Count, $_.Name }

""
"=== GPOs de mapeamento: onde linkam + config User/Computer ==="
Get-GPO -All | Where-Object { $_.DisplayName -match 'Mapeamento|Drive|Mapa|Map|Unidade' } | ForEach-Object {
  $g = $_
  try {
    [xml]$rep = Get-GPOReport -Guid $g.Id -ReportType Xml
    $links = @($rep.GPO.LinksTo | ForEach-Object { $_.SOMPath })
    $hasUser = [bool]$rep.GPO.User.ExtensionData
    $hasComp = [bool]$rep.GPO.Computer.ExtensionData
    "{0}" -f $g.DisplayName
    "   Linkada em : {0}" -f (($links -join ' ; ') -replace '^$','(sem link ativo)')
    "   Config     : User=$hasUser  Computer=$hasComp"
  } catch { "{0} -- ERRO: {1}" -f $g.DisplayName, $_.Exception.Message }
}
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=180, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

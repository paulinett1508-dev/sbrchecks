"""Read-only: (a) faust-purge.ps1 ainda existe? (b) KMS task + licenciamento Windows."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
"=== FAUST: script em C:\Temp ==="
$s='C:\Temp\faust-purge.ps1'
if (Test-Path $s) { $f=Get-Item $s; "EXISTE size=$($f.Length) mtime=$($f.LastWriteTime)" } else { "AUSENTE - quarentenado/removido?" }
"ps1 em C:\Temp: " + (@(Get-ChildItem C:\Temp -Filter *.ps1 -ErrorAction SilentlyContinue).Name -join ', ')

""
"=== KMS: task R@1N-KMS ==="
$t = Get-ScheduledTask -TaskName 'R@1N-KMS' -ErrorAction SilentlyContinue
if ($t) { $t.Actions | ForEach-Object { "Exec=$($_.Execute)  Args=$($_.Arguments)" }; "Author=$($t.Author)  State=$($t.State)" }
else { "task R@1N-KMS nao encontrada" }

""
"=== Licenciamento Windows (depende de KMS?) ==="
Get-CimInstance SoftwareLicensingProduct -Filter "PartialProductKey IS NOT NULL AND Name LIKE 'Windows%'" -ErrorAction SilentlyContinue |
  ForEach-Object { "Name=$($_.Name)"; "  LicenseStatus=$($_.LicenseStatus) (1=Licensed)  Channel=$($_.ProductKeyChannel)  GraceMin=$($_.GracePeriodRemaining)" }
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=120, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

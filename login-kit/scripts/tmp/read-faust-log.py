"""Read-only: log do purge Faust das 12h + info da scheduled task no .218."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
$log = 'C:\Temp\faust_purge_20260527.log'
if (Test-Path $log) { "=== faust_purge_20260527.log ==="; Get-Content $log }
else { "LOG AUSENTE - purge nao rodou?" }
""
$i = Get-ScheduledTaskInfo -TaskName 'FaustPurge_MiniWindow' -ErrorAction SilentlyContinue
if ($i) { "TASK LastRun=$($i.LastRunTime)  LastResult=$($i.LastTaskResult)  NextRun=$($i.NextRunTime)" }
else { "TASK FaustPurge_MiniWindow nao encontrada" }
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=120, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

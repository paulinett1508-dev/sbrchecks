"""Re-agenda FaustPurge_MiniWindow para hoje 18:30 (janela off-hours do .218)."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
$trigger = New-ScheduledTaskTrigger -Once -At '18:30'
Set-ScheduledTask -TaskName 'FaustPurge_MiniWindow' -Trigger $trigger | Out-Null
$t = Get-ScheduledTask -TaskName 'FaustPurge_MiniWindow'
$i = Get-ScheduledTaskInfo -TaskName 'FaustPurge_MiniWindow'
"State=$($t.State)  NextRun=$($i.NextRunTime)"
($t.Actions | Select-Object -First 1) | ForEach-Object { "Action=$($_.Execute) $($_.Arguments)" }
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=120, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

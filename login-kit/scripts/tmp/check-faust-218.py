"""Verificacao pontual no .218: Scheduled Task do Faust + integridade do script + log."""
import keyring
from pypsrp.client import Client

pwd = keyring.get_password("lab-audit", "labsobralnet\\administrador")
ps = r'''
$t = Get-ScheduledTask -TaskName 'FaustPurge_MiniWindow' -ErrorAction SilentlyContinue
if ($t) {
  $i = Get-ScheduledTaskInfo -TaskName 'FaustPurge_MiniWindow'
  "TASK State=$($t.State) NextRun=$($i.NextRunTime) LastRun=$($i.LastRunTime) LastResult=$($i.LastTaskResult)"
  $a = $t.Actions | Select-Object -First 1
  "TASK Action=$($a.Execute) $($a.Arguments)"
} else { "TASK AUSENTE" }
$s = Get-Item 'C:\Temp\faust-purge.ps1' -ErrorAction SilentlyContinue
if ($s) { "SCRIPT existe size=$($s.Length) mtime=$($s.LastWriteTime)" } else { "SCRIPT AUSENTE (quarentenado?)" }
$l = Get-Item 'C:\Temp\faust_purge_20260527.log' -ErrorAction SilentlyContinue
if ($l) { "LOG existe size=$($l.Length)"; Get-Content 'C:\Temp\faust_purge_20260527.log' -Tail 8 } else { "LOG ainda nao criado (purge nao rodou)" }
Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz' | ForEach-Object { "AGORA_218 $_" }
'''
c = Client("labsrv05.labsobralnet.ind", username="labsobralnet\\administrador",
           password=pwd, auth="ntlm", ssl=False,
           connection_timeout=60, operation_timeout=120, read_timeout=300)
out, streams, had_err = c.execute_ps(ps)
print(out)
if had_err:
    for e in streams.error:
        print("ERR:", e)

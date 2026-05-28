"""Read-only: inspeciona o NVR3 (host que funciona) para replicar grupo/template/interface."""
import json
import requests

ZBX = "http://192.86.221.216/api_jsonrpc.php"
HDR = {"Content-Type": "application/json-rpc"}


def call(method, params, token=None):
    payload = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
    headers = dict(HDR)
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.post(ZBX, json=payload, headers=headers, timeout=25).json()


auth = call("user.login", {"username": "Admin", "password": "zabbix"})["result"]
print("login OK\n")

print("=== NVR3 (host com SNMP que funciona) ===")
h = call("host.get", {
    "search": {"host": "NVR3"},
    "selectParentTemplates": ["templateid", "host"],
    "selectHostGroups": ["groupid", "name"],
    "selectInterfaces": "extend",
}, auth)
print(json.dumps(h.get("result"), indent=2, ensure_ascii=False))

print("\n=== todos os hostgroups ===")
g = call("hostgroup.get", {"output": ["groupid", "name"]}, auth)
for x in g.get("result", []):
    print(f"  {x['groupid']}  {x['name']}")

print("\n=== templates com 'SNMP' no nome ===")
t = call("template.get", {"output": ["templateid", "host"], "search": {"host": "SNMP"}}, auth)
for x in t.get("result", []):
    print(f"  {x['templateid']}  {x['host']}")

"""DVR6 (10677): SNMP v3 travado no firmware -> trocar template SNMP por ICMP Ping."""
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

# template ICMP Ping
t = call("template.get", {"output": ["templateid", "host"], "search": {"host": "ICMP Ping"}}, auth)
print("templates ICMP:", [(x["templateid"], x["host"]) for x in t.get("result", [])])
tid_icmp = next((x["templateid"] for x in t.get("result", []) if x["host"] == "ICMP Ping"), None)
if not tid_icmp:
    print("ABORT: template 'ICMP Ping' nao encontrado")
    raise SystemExit(1)

# troca template: remove SNMP genérico (10226), adiciona ICMP Ping
res = call("host.update", {
    "hostid": "10677",
    "templates": [{"templateid": tid_icmp}],
    "templates_clear": [{"templateid": "10226"}],
}, auth)
print("host.update:", json.dumps(res, indent=2))

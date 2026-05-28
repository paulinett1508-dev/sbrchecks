"""Read-only: status da interface SNMP do DVR5 (10676) + itens coletados."""
import sys
import requests

HOSTID = sys.argv[1] if len(sys.argv) > 1 else "10676"
ZBX = "http://192.86.221.216/api_jsonrpc.php"
HDR = {"Content-Type": "application/json-rpc"}


def call(method, params, token=None):
    payload = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
    headers = dict(HDR)
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.post(ZBX, json=payload, headers=headers, timeout=25).json()


auth = call("user.login", {"username": "Admin", "password": "zabbix"})["result"]

h = call("host.get", {
    "hostids": [HOSTID],
    "selectInterfaces": "extend",
}, auth)
host = h["result"][0]
iface = host["interfaces"][0]
av = {"0": "unknown(ainda nao testou)", "1": "AVAILABLE (responde)", "2": "UNAVAILABLE (falha)"}
print(f"Host: {host['name']}")
print(f"SNMP interface: ip={iface['ip']} port={iface['port']} available={iface['available']} -> {av.get(iface['available'])}")
if iface.get("error"):
    print(f"ERRO: {iface['error']}")

# alguns itens com valor coletado
it = call("item.get", {
    "hostids": [HOSTID],
    "output": ["name", "lastvalue", "lastclock", "state", "error"],
    "filter": {"state": 0},
    "search": {"key_": "sys"},
    "limit": 8,
}, auth)
print("\nItens (amostra):")
for i in it.get("result", []):
    lv = (i.get("lastvalue") or "")[:60]
    print(f"  {i['name']}: '{lv}' (clock={i.get('lastclock')})")

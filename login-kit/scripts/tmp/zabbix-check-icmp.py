"""Read-only: itens ICMP do host (default 10677 DVR6)."""
import sys
import requests

HOSTID = sys.argv[1] if len(sys.argv) > 1 else "10677"
ZBX = "http://192.86.221.216/api_jsonrpc.php"
HDR = {"Content-Type": "application/json-rpc"}


def call(method, params, token=None):
    payload = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
    headers = dict(HDR)
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return requests.post(ZBX, json=payload, headers=headers, timeout=25).json()


auth = call("user.login", {"username": "Admin", "password": "zabbix"})["result"]
it = call("item.get", {
    "hostids": [HOSTID],
    "output": ["name", "key_", "lastvalue", "lastclock", "state", "error"],
    "search": {"key_": "icmpping"},
}, auth)
print(f"host {HOSTID} — itens ICMP:")
for i in it.get("result", []):
    st = "OK" if i["state"] == "0" else f"NOTSUPPORTED({i.get('error')})"
    print(f"  {i['name']}: lastvalue='{i.get('lastvalue')}' clock={i.get('lastclock')} [{st}]")

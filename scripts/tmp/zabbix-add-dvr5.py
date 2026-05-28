"""Cadastra DVR5-MHDX3116 (.222.5) no Zabbix .216 via API JSON-RPC. SNMPv3 Private/SHA/DES."""
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


# 1. login
res = call("user.login", {"username": "Admin", "password": "zabbix"})
if "error" in res:
    print("LOGIN FALHOU:", res["error"])
    raise SystemExit(1)
auth = res["result"]
print("login OK")

# IDs confirmados via inspeção do NVR3
gid = "23"      # hostgroup Cameras
tid = "10226"   # template Network Generic Device by SNMP

# 4. host ja existe?
ex = call("host.get", {"filter": {"host": ["DVR5-MHDX3116"]}}, auth)
if ex.get("result"):
    print("HOST JA EXISTE:", ex["result"])
    raise SystemExit(0)

if not (gid and tid):
    print("ABORT: groupid ou templateid nao resolvidos.")
    raise SystemExit(1)

# 5. cria host SNMPv3 (SHA=1, DES=0, authPriv=2)
h = call("host.create", {
    "host": "DVR5-MHDX3116",
    "name": "DVR5 MHDX 3116 (.222.5)",
    "groups": [{"groupid": gid}],
    "templates": [{"templateid": tid}],
    "interfaces": [{
        "type": 2, "main": 1, "useip": 1,
        "ip": "192.86.222.5", "dns": "", "port": "161",
        "details": {
            "version": 3, "bulk": 1,
            "securityname": "Private",
            "securitylevel": 2,
            "authprotocol": 1,
            "authpassphrase": "Dvr5Auth2026",
            "privprotocol": 0,
            "privpassphrase": "Dvr5Priv2026",
            "contextname": "",
            "max_repetitions": 10,
        },
    }],
}, auth)
print("host.create:", json.dumps(h, indent=2))

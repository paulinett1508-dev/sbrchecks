"""Cadastra DVR6-MHDX1016C (.222.6) no Zabbix .216. SNMPv3 Private/SHA/DES. So rodar apos salvar no DVR."""
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
print("login OK")

gid = "23"      # Cameras
tid = "10226"   # Network Generic Device by SNMP

ex = call("host.get", {"filter": {"host": ["DVR6-MHDX1016C"]}}, auth)
if ex.get("result"):
    print("HOST JA EXISTE:", ex["result"])
    raise SystemExit(0)

h = call("host.create", {
    "host": "DVR6-MHDX1016C",
    "name": "DVR6 MHDX 1016-C (.222.6)",
    "groups": [{"groupid": gid}],
    "templates": [{"templateid": tid}],
    "interfaces": [{
        "type": 2, "main": 1, "useip": 1,
        "ip": "192.86.222.6", "dns": "", "port": "161",
        "details": {
            "version": 3, "bulk": 1,
            "securityname": "Private",
            "securitylevel": 2,
            "authprotocol": 1,            # SHA
            "authpassphrase": "Dvr6Auth2026",
            "privprotocol": 0,            # DES (MHDX nao tem AES)
            "privpassphrase": "Dvr6Priv2026",
            "contextname": "",
            "max_repetitions": 10,
        },
    }],
}, auth)
print("host.create:", json.dumps(h, indent=2))

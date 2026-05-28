"""Corrige a interface SNMP do DVR6 (10677): privprotocol DES->AES (CFB-AES)."""
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
h = call("host.get", {"hostids": ["10677"], "selectInterfaces": "extend"}, auth)
ifid = h["result"][0]["interfaces"][0]["interfaceid"]
print("interfaceid:", ifid)

res = call("hostinterface.update", {
    "interfaceid": ifid,
    "details": {
        "version": 3, "bulk": 1,
        "securityname": "Private",
        "securitylevel": 2,
        "authprotocol": 1,          # SHA
        "authpassphrase": "Dvr6Auth2026",
        "privprotocol": 1,          # AES (CFB-AES)
        "privpassphrase": "Dvr6Priv2026",
        "contextname": "",
        "max_repetitions": 10,
    },
}, auth)
print("update:", json.dumps(res, indent=2))

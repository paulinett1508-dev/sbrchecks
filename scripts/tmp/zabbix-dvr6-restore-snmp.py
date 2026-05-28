"""DVR6 (10677) respondeu SNMP apos hard reboot -> reverte ICMP para SNMP (SHA sobral11 / DES sobral22)."""
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

# 1. atualiza interface SNMP (id 38): SHA + DES + senhas atuais do DVR
r1 = call("hostinterface.update", {
    "interfaceid": "38",
    "details": {
        "version": 3, "bulk": 1,
        "securityname": "Private",
        "securitylevel": 2,
        "authprotocol": 1,          # SHA
        "authpassphrase": "sobral11",
        "privprotocol": 0,          # DES (CBC-DES)
        "privpassphrase": "sobral22",
        "contextname": "",
        "max_repetitions": 10,
    },
}, auth)
print("interface.update:", json.dumps(r1.get("result") or r1.get("error")))

# 2. troca template: remove ICMP Ping (10564), adiciona SNMP generico (10226)
r2 = call("host.update", {
    "hostid": "10677",
    "templates": [{"templateid": "10226"}],
    "templates_clear": [{"templateid": "10564"}],
}, auth)
print("host.update:", json.dumps(r2.get("result") or r2.get("error")))

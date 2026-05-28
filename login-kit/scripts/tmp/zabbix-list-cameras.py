"""Read-only: lista hosts do grupo Cameras (23) no Zabbix."""
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
h = call("host.get", {
    "groupids": ["23"],
    "output": ["hostid", "name"],
    "selectInterfaces": ["ip", "type"],
    "selectParentTemplates": ["host"],
}, auth)
print("Grupo Cameras — hosts cadastrados:")
for x in h.get("result", []):
    ips = ",".join(i["ip"] for i in x.get("interfaces", []))
    tmpls = ",".join(t["host"] for t in x.get("parentTemplates", []))
    print(f"  {x['hostid']}  {x['name']}  ip={ips}  template=[{tmpls}]")

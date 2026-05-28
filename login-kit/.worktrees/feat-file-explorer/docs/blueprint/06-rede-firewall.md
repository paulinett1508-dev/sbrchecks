# 6 — Rede e Firewall
**Última atualização:** 2026-04-13

---

## 6.1 Endereçamento

| Componente | IP | Função |
|---|---|---|
| LABSRVFILES | 192.86.221.213 | Servidor de arquivos |
| AD / DNS | 192.86.221.218 | Active Directory + DNS primário |
| pfSense | (gateway da rede) | Firewall de perímetro |
| Rede corporativa | 192.86.221.0/24 | Subnet interna |

## 6.2 Portas do Servidor

| Porta | Protocolo | Serviço | Origem permitida |
|---|---|---|---|
| 22 | TCP | SSH | 192.86.221.0/24 |
| 139 | TCP | SMB / NetBIOS Session | 192.86.221.0/24 |
| 445 | TCP | SMB direto | 192.86.221.0/24 |
| 8080 | TCP | Painel Web (labsrv-panel) | 192.86.221.0/24 |

Nenhuma porta está exposta externamente. O pfSense bloqueia todo tráfego externo ao servidor.

## 6.3 UFW — Firewall Host

```bash
# Ver regras ativas
sudo ufw status verbose

# Aplicar regras do repositório
sudo bash ~/labsrvfiles/ufw-rules.sh

# Adicionar nova regra (exemplo)
sudo ufw allow from 192.86.221.0/24 to any port 8080 proto tcp
```

## 6.4 pfSense

Firewall de perímetro gerenciado separadamente. Responsável por:
- Bloquear todo tráfego externo ao servidor de arquivos
- NAT da rede interna
- VPN (se configurada)

Acesso ao pfSense: consultar equipe de TI (fora do escopo deste repositório).

## 6.5 DNS

```bash
# Verificar resolução DNS
nslookup labsobralnet.ind
nslookup LABSRVFILES.labsobralnet.ind

# Verificar configuração de DNS do servidor
cat /etc/resolv.conf
```

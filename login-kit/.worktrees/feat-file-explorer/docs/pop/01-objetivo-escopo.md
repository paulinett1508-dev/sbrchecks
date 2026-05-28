# 1 — Objetivo e Escopo
**Versão:** 1.0
**Data:** 2026-04-13
**Elaborado por:** TI — Laboratório Sobral

---

## 1.1 Objetivo

Este Procedimento Operacional Padrão (POP) tem como objetivo estabelecer as diretrizes, responsabilidades e procedimentos necessários para a operação, manutenção e uso do **Servidor de Arquivos do Laboratório Sobral (LABSRVFILES)**.

O servidor centraliza o armazenamento de documentos institucionais, garantindo:

- Acesso controlado por departamento
- Rastreabilidade de operações
- Disponibilidade contínua dos arquivos durante o horário de funcionamento da empresa
- Integridade dos dados por meio de rotinas de backup automatizadas

## 1.2 Escopo

Este POP aplica-se a:

- **Equipe de TI:** responsável pela administração, manutenção e suporte do servidor
- **Gestores de Departamento:** responsáveis por orientar seus colaboradores sobre o uso correto dos compartilhamentos
- **Colaboradores em geral:** usuários do servidor de arquivos em suas atividades diárias
- **Departamento da Qualidade:** para fins de auditoria e verificação de conformidade operacional

Este POP **não** abrange:

- Gestão de Active Directory (realizada no servidor Windows — 192.86.221.218)
- Infraestrutura de rede externa (gerenciada pelo pfSense)
- Dispositivos dos usuários finais

## 1.3 Documentos Relacionados

| Documento | Localização |
|---|---|
| Blueprint Técnico | `docs/Blueprint_Tecnico.md` |
| Manual de Usuários | `docs/Manual_de_Uso.md` |
| Configuração Samba | `config/smb.conf` |
| Configuração SSSD | `config/sssd.conf` |
| Regras de Firewall | `ufw-rules.sh` |

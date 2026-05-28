# shared/share_groups.py

SHARE_GROUPS: dict[str, str] = {
    "DEPARTAMENTO_TECNICO":   "LABSOBRALNET\\grupo_sistema_da_qualidade",
    "CONTABILIDADE":          "LABSOBRALNET\\grupo contabilidade",
    "FISCAL":                 "LABSOBRALNET\\grupo contabilidade",
    "CONTROLADORIA":          "LABSOBRALNET\\grupo controladoria",
    "FINANCEIRO":             "LABSOBRALNET\\grupo financeiro",
    "RECURSOS_HUMANOS":       "LABSOBRALNET\\grupo rh",
    "COMERCIAL_VENDAS":       "local: comercial1/2/3",
    "INDUSTRIAL":             "LABSOBRALNET\\grupo industrial",
    "SUPRIMENTOS":            "LABSOBRALNET\\grupo pcp",
    "MANUTENCAO":             "LABSOBRALNET\\grupo manutenção",
    "LOGISTICA_RECEBIMENTO":  "LABSOBRALNET\\logistica_recebimento",
    "LOGISTICA_EXPEDICAO":    "LABSOBRALNET\\logistica_expedicao",
    "MARKETING":              "LABSOBRALNET\\grupo marketing",
    "SEGURANCA_TRABALHO":     "LABSOBRALNET\\grupo sesmt",
    "SERVICOS_GERAIS":        "LABSOBRALNET\\grupo servicos gerais",
    "DIRETORIAS":             "LABSOBRALNET\\grupo presidencia",
    "SECRETARIA":             "LABSOBRALNET\\grupo secretaria",
    "TI":                     "LABSOBRALNET\\grupo ti",
    "LINKS_UTEIS":            "local: vendedores",
}

# Shares acessíveis via explorador (apenas grupos AD — sem usuários locais)
SHARE_ROOTS: dict[str, str] = {
    "DEPARTAMENTO_TECNICO":   "/srv/samba/DEPARTAMENTO_TECNICO",
    "CONTABILIDADE":          "/srv/samba/CONTABILIDADE",
    "FISCAL":                 "/srv/samba/FISCAL",
    "CONTROLADORIA":          "/srv/samba/CONTROLADORIA",
    "FINANCEIRO":             "/srv/samba/FINANCEIRO",
    "RECURSOS_HUMANOS":       "/srv/samba/RECURSOS_HUMANOS",
    "INDUSTRIAL":             "/srv/samba/INDUSTRIAL",
    "SUPRIMENTOS":            "/srv/samba/SUPRIMENTOS",
    "MANUTENCAO":             "/srv/samba/MANUTENCAO",
    "LOGISTICA_RECEBIMENTO":  "/srv/samba/LOGISTICA_RECEBIMENTO",
    "LOGISTICA_EXPEDICAO":    "/srv/samba/LOGISTICA_EXPEDICAO",
    "MARKETING":              "/mnt/hdd/samba/MARKETING",
    "SEGURANCA_TRABALHO":     "/mnt/hdd/samba/SEGURANCA_TRABALHO",
    "SERVICOS_GERAIS":        "/mnt/hdd/samba/SERVICOS_GERAIS",
    "DIRETORIAS":             "/mnt/hdd/samba/DIRETORIAS",
    "SECRETARIA":             "/mnt/hdd/samba/SECRETARIA",
    "TI":                     "/mnt/hdd/samba/TI",
}

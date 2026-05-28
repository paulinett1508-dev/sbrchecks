# 2 — Como Acessar pelo Windows
**Manual de Uso — Servidor de Arquivos**
**Laboratório Sobral**

---

## Método 1: Acesso direto (mais simples)

1. Pressione as teclas **Win + R** ao mesmo tempo
   *(a tecla Win é a do logotipo do Windows no teclado)*
2. Na janela que abrir, digite exatamente:
   ```
   \\192.86.221.213
   ```
3. Pressione **Enter**
4. Se solicitado, digite seu **usuário** e **senha do domínio**
   - Usuário: `labsobralnet\seu.nome` ou apenas `seu.nome`
   - Senha: a mesma que você usa para entrar no Windows
5. Você verá as pastas dos departamentos que você tem acesso

## Método 2: Mapear como unidade de rede (recomendado)

Mapear cria uma "letra de unidade" (como `Z:`) no seu computador, facilitando o acesso diário.

1. Abra o **Explorador de Arquivos** (a pasta amarela na barra de tarefas)
2. Clique em **Este Computador** no painel esquerdo
3. No menu superior, clique em **Computador** → **Mapear unidade de rede**
4. Escolha uma letra (ex: `Z:`)
5. No campo **Pasta**, digite:
   ```
   \\192.86.221.213\NOME_DO_SEU_DEPARTAMENTO
   ```
   Exemplo para o departamento Financeiro:
   ```
   \\192.86.221.213\FINANCEIRO
   ```
6. Marque a opção **Reconectar ao entrar**
7. Clique em **Concluir**
8. Digite suas credenciais se solicitado

A partir de agora, o compartilhamento aparecerá como uma unidade no Explorador de Arquivos.

## Nomes dos compartilhamentos por departamento

| Departamento | Nome para usar no endereço |
|---|---|
| Sistema da Qualidade / Técnico | DEPARTAMENTO_TECNICO |
| Contabilidade | CONTABILIDADE |
| Fiscal | FISCAL |
| Controladoria | CONTROLADORIA |
| Financeiro | FINANCEIRO |
| Recursos Humanos | RECURSOS_HUMANOS |
| Industrial | INDUSTRIAL |
| Suprimentos / PCP | SUPRIMENTOS |
| Manutenção | MANUTENCAO |
| Logística Recebimento | LOGISTICA_RECEBIMENTO |
| Logística Expedição | LOGISTICA_EXPEDICAO |
| Marketing | MARKETING |
| Segurança do Trabalho | SEGURANCA_TRABALHO |
| Serviços Gerais | SERVICOS_GERAIS |
| Diretorias | DIRETORIAS |
| Secretaria | SECRETARIA |
| TI | TI |

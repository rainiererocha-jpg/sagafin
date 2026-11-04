# Fase 1: lista de clientes e relacionamento

Este guia explica como trazer a carteira do Hub XP para o Sagafin, o que entra e o que fica de fora, e como funciona a classificação A/B/C.

## 1. Exportar a lista do Hub

1. Entre no Hub XP e abra **Minha Carteira**.
2. Use o ícone de download para exportar a lista de clientes.
3. Se o arquivo vier em Excel (.xlsx), abra no Excel e escolha **Arquivo > Salvar como > CSV UTF-8**. O importador só lê CSV.
4. Guarde o CSV numa pasta de trabalho sua (não dentro do projeto do site) e apague o arquivo original depois da importação.

## 2. O que entra e o que fica de fora

| Entra | Fica de fora (nunca é lido nem gravado) |
|---|---|
| Nome (coluna "Cliente") | CPF |
| Celular | Saldo e patrimônio |
| E-mail | Investidor |
| Segmento (Signature, Regular...) | Última atualização |
| Suitability (só o texto) | Qualquer outra coluna desconhecida |
| Aniversário / Data de nascimento | |

**Por quê:** a decisão de 23/10 é usar o mínimo necessário para o relacionamento. Dados de posição e documentos ficam no Hub e no app da XP, onde já têm proteção e regras próprias. Quanto menos dado sensível o Sagafin guarda, menor o risco para os clientes e para você.

Ao rodar, o importador mostra um aviso listando as colunas ignoradas. Se CPF e saldos aparecerem nessa lista, está tudo certo: eles foram descartados.

## 3. Como rodar a importação

Pré-requisito: a migração `supabase/migrations/20261023_clientes_crm.sql` precisa estar aplicada no Supabase do Sagafin, e o arquivo `.env` do projeto precisa ter a URL do Supabase e a chave de serviço (a mesma usada pelos outros scripts).

Primeiro, um ensaio que não grava nada:

```
node scripts/importar-clientes.mjs --arquivo C:\caminho\clientes.csv --dry-run
```

Ele mostra as 5 primeiras linhas já tratadas e os totais. Confira nomes, telefones e as colunas ignoradas. Depois, a importação de verdade:

```
node scripts/importar-clientes.mjs --arquivo C:\caminho\clientes.csv
```

O resumo final informa: lidos, importados (novos), atualizados, sem telefone válido e colunas ignoradas.

**Tratamento automático:**
- Nomes ficam em formato "Maria da Silva" (nunca em letras maiúsculas).
- Telefones viram o padrão de 13 dígitos (55 + DDD + 9 + número). Se o número for inválido, o campo fica em branco e o cliente aparece no aviso.
- E-mails ficam em letras minúsculas.
- Rodar de novo é seguro: quem já existe (mesmo telefone ou e-mail) é atualizado, ninguém é apagado.

**Importante:** a importação **nunca** marca ninguém como autorizado a receber e-mail ou WhatsApp. O consentimento só vale depois que o cliente responde SIM ao convite.

## 4. A tela de clientes

No Saga Studio, aba **Clientes**: lista com busca por nome ou telefone, filtro por nível (A/B/C) e por consentimento. Os quatro cartões do alto mostram o total, quantos aceitaram e-mail, quantos aceitaram WhatsApp e quantos precisam de contato hoje.

O botão **Registrar contato** guarda o que foi conversado (canal, tipo e resumo), atualiza o "último contato" e já agenda a próxima ação.

## 5. A regra A/B/C

Você define o nível de cada cliente pela tela (padrão: C). O critério é potencial e proximidade da relação, não o patrimônio.

| Nível | Cadência | Próxima ação sugerida ao registrar contato |
|---|---|---|
| A | Ligação mensal e revisão trimestral | em 30 dias |
| B | Mensagem pessoal mensal e revisão semestral | em 30 dias |
| C | Diário Saga e convite trimestral | em 90 dias |

Se você escolher uma data no registro do contato, ela vale no lugar da sugestão. Quem tem a próxima ação vencida e não pediu para sair entra na contagem "para contatar hoje".

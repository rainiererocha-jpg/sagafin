# Script de WhatsApp: diagnóstico de carteira pós-eleições (SPIN)

Uso interno do Rainiere. Lead qualificado = faixa de R$ 100 mil ou mais e consentimento registrado na tabela `leads`
(source `pos-eleicoes`). Responder em até 48 h. Fila: 5 carteiras novas por semana.
Regras: sem promessa de retorno, sem citar produto ou emissor, sem a palavra "consultoria". Se o lead pedir o custo, informar
o percentual fee-based por escrito antes de qualquer contratação.

## Mensagem 1 (abertura, em até 2 horas do pedido)
"Oi, [Nome]! Aqui é o Rainiere, da Saga Financeira. Vi que você baixou o Manual Pós-Eleições e pediu o diagnóstico da carteira.
Antes de marcar, deixa eu entender onde você está: hoje o seu dinheiro está mais no banco ou em corretora, e há quanto tempo?"

## Situação (entender o ponto de partida)
- "Qual é a parte do patrimônio em renda fixa, e qual em ações ou fundos?"
- "Tem algo em prefixado ou IPCA+ de prazo mais longo?"

## Problema (o que doeu)
- "O que ficou vermelho no seu extrato depois do dia 26?"
- "Você chegou a vender alguma coisa no susto, ou segurou?"

## Implicação (o custo de não olhar)
- "Se o juro ficar alto por mais tempo, o que isso faz com o prazo do seu objetivo principal?"
- "Hoje você sabe separar o que está vermelho só por marcação a mercado do que realmente merece atenção?"

## Necessidade (o benefício do diagnóstico)
- "Se eu te mostrasse a carteira marcada a mercado, com o que fazer em cada posição, isso te ajudaria a decidir com calma?"

## Agendamento
"Perfeito. São 20 minutos, por vídeo ou áudio, sem compromisso. Para eu chegar preparado, me manda um print do extrato
(pode esconder o nome e o número da conta). Tenho quinta às 10h ou sexta às 15h. Qual fica melhor?"

## Fechamento fee-based (só depois do diagnóstico, e só se o cliente pedir)
1. Explicar o modelo: percentual fixo ao ano sobre o patrimônio, a partir de 1% a.a., sem comissão por produto.
2. Apresentar o valor exato por escrito.
3. Se for abrir conta ou trocar de assessor: link de cadastro com o código A44795 ("Você já possui assessor?" responder Sim,
   no caso de troca) e acompanhar o termo de fee na XP.

## Registro
Atualizar a linha do lead em `leads` (status: contatado, diagnóstico marcado, diagnóstico feito, fee-based, sem interesse).

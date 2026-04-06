

## Levantamento e Correções para Publicação

### Problemas Encontrados

**1. Bugs de conteudo no ContactForm.tsx (CRITICO)**
- Linha 66: texto quebrado/duplicado misturando e-mail com lista de beneficios
- Linhas 84-85: header duplicado "O que esperar da assessoria:" + "O que esperar da consultoria:"
- Linha 171: botao diz "Consultoria" em vez de "Assessoria"
- Falta o icone de e-mail (Mail) na linha 63

**2. Bugs no HeroSection.tsx**
- Linhas 61, 65: trust badges vazios (sem numeros)
- Linha 62: typo "Anos de ercado" (falta "M")
- Texto descritivo (linha 40-43) muito longo e centralizado, prejudica leitura
- CTAs genericos ("Saiba Mais", "Ligar Agora") sem links reais

**3. Termo "Consultoria" em vez de "Assessoria"**
- ServicesSection.tsx linha 129: "Agendar Consultoria Gratuita"
- TestimonialsSection.tsx linha 26: "A consultoria de planejamento"

**4. Funcionalidades ausentes para producao**
- Botao flutuante de WhatsApp (conversao direta)
- Botao back-to-top
- Links de CTA direcionando para WhatsApp
- Servicos de Consorcios e Credito (mencionados no super prompt)

**5. SEO e meta tags**
- Meta tags ja estao boas, mas falta schema.org markup

---

### Plano de Implementacao

**Arquivo 1: src/components/ContactForm.tsx**
- Corrigir secao de e-mail (linha 63-68): adicionar icone Mail e email real
- Corrigir header duplicado (linhas 84-86): manter apenas "O que esperar da assessoria:"
- Trocar "Solicitar Consultoria Gratuita" por "Solicitar Assessoria Gratuita"

**Arquivo 2: src/components/HeroSection.tsx**
- Preencher trust badges: "10+" anos, "500+" clientes
- Corrigir "ercado" para "Mercado"
- Encurtar texto descritivo para 2-3 linhas focadas em conversao
- Trocar CTAs para "Agende sua Assessoria" (link WhatsApp) e "Fale pelo WhatsApp"

**Arquivo 3: src/components/ServicesSection.tsx**
- Trocar "Consultoria" por "Assessoria" no botao
- Adicionar servicos de Consorcios e Credito ao grid (substituindo ou adicionando)

**Arquivo 4: src/components/TestimonialsSection.tsx**
- Corrigir "consultoria" para "assessoria" no depoimento

**Arquivo 5: src/components/WhatsAppButton.tsx (NOVO)**
- Botao flutuante no canto inferior direito com icone WhatsApp
- Link para wa.me/5562994160930 com mensagem pre-preenchida
- Animacao pulse sutil para chamar atencao

**Arquivo 6: src/components/BackToTop.tsx (NOVO)**
- Botao que aparece apos scroll de 500px
- Smooth scroll para o topo
- Animacao fade-in/out

**Arquivo 7: src/pages/Index.tsx**
- Adicionar WhatsAppButton e BackToTop ao layout

**Arquivo 8: index.html**
- Adicionar schema.org JSON-LD para FinancialService

---

### Resultado
Site corrigido, sem bugs de conteudo, com CTAs funcionais direcionando para WhatsApp, botao flutuante de conversao, e pronto para publicacao profissional.


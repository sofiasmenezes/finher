# FinHer

Plataforma educativa para apoiar, informar e conectar mulheres que querem entrar, permanecer ou crescer no mercado financeiro. Projeto acadêmico independente. Não faz operações, não guarda dinheiro e não recomenda investimentos.

**Seções:** Meu caminho, Assistente FinHer (IA), Trilha, Desafios (com Apoio psicológico), Soft skills, Carreira e família, Histórias e Comunidade (em breve). A página inicial tem a seção Quem somos. O idioma padrão é português do Brasil.

## Rodar

```bash
npm install
npm run dev
```

Sem as chaves do Supabase, o app roda em **modo de demonstração**: contas e respostas ficam só no navegador (localStorage).

## Conectar o Supabase

1. Crie um projeto e rode os arquivos de `supabase/migrations/` em ordem (editor SQL ou `supabase db push`).
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Assistente FinHer (IA)

A assistente responde dúvidas das usuárias com o Claude, da Anthropic, por uma função da Vercel em `api/assistant.ts`. A chave fica só no servidor.

1. Crie uma chave em [platform.claude.com](https://platform.claude.com) e adicione na Vercel, em **Settings → Environment Variables**, como `ANTHROPIC_API_KEY`.
2. Opcional: `ASSISTANT_MODEL` troca o modelo (padrão: `claude-opus-5-5`).
3. Com o Supabase configurado, só quem está logada consegue usar a assistente.

Sem a chave (ou rodando com `npm run dev`, que não executa funções), a assistente continua funcionando de forma simples: busca no conteúdo do FinHer e indica os guias mais próximos da pergunta. Para testar a IA localmente, use `vercel dev`.

O comportamento da assistente (tom, limites, quando indicar o CVV) fica no texto `SYSTEM_PROMPT` dentro de `api/assistant.ts`.

## Comunidade: calendário, alertas e materiais

- **Calendário de oportunidades** (`/app/community/opportunities`): lê os arquivos de `content/opportunities/`. Os alertas são dentro do site (sino no topo) e cada oportunidade pode ir para a agenda do celular com um arquivo `.ics` que já traz lembrete.
- **Indicação de materiais** (`/app/community/materials`): a seleção da equipe fica em `TEAM_MATERIALS` (`src/content/catalog.ts`); as indicações das usuárias ficam na tabela `material_recommendations`.
- Com o Supabase, rode `supabase/migrations/0005_materials_and_alerts.sql`.

## Publicar na Vercel

O repositório já vem configurado para **um único projeto** na Vercel (`vercel.json`): instala com `npm ci`, publica com `npm run build` e serve a pasta `dist`. Qualquer endereço (como `/app/education`) abre o app, para os links diretos funcionarem.

1. Na Vercel, clique em **Add New → Project** e importe o repositório `finher`.
2. Deixe as configurações como vierem (a Vercel lê o `vercel.json`).
3. Opcional: em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Sem elas, o site fica no modo de demonstração.
4. Clique em **Deploy**. Cada push no `main` publica de novo no mesmo projeto.

## Estrutura

| Caminho | O que é |
|---|---|
| `content/` | Conteúdo editável sem programar: guias de áreas, empresas, Navegador de desafios, Soft skills, Carreira e família, histórias, ajuda por país. Veja `content/README.md` |
| `api/assistant.ts` | Função da Vercel da Assistente FinHer |
| `docs/kit-entrevistas.md` | Roteiro, termo de consentimento (modelo) e checklist para as histórias reais |
| `src/i18n/pt-BR.ts` | Todo o texto da interface |
| `src/index.css` | Cores, fontes e estilos base (claro e escuro) |
| `src/lib/path-engine.ts` | Respostas do cadastro → próximos passos, trilhas, guias e conexões |
| `src/content/loader.ts` | Lê `content/` na hora da publicação |
| `src/content/catalog.ts` | Trilhas e perfis/grupos de exemplo (fictícios) |
| `src/lib/backend` | Supabase e modo de demonstração |
| `supabase/migrations` | Banco de dados e regras de acesso (cada usuária só vê os próprios dados) |
| `npm run build:artifact` | Versão de arquivo único para compartilhar como página hospedada |

# 🌸 Oi, Bonita! — Loja de Cosméticos

Loja virtual feita em **Next.js**, com a identidade visual real da marca **Oi, Bonita!** (extraída do repositório oficial: logo, paleta de cores rosa, tipografia Poppins, blobs animados de fundo). Produtos carregados via **Supabase** (com fallback em JSON local), carrinho de compras e finalização de pedido direto pelo **WhatsApp**. Inclui **login de usuários** e **painel administrativo**.

## ✨ Funcionalidades

- Visual fiel à marca: logo oficial, gradiente rosa `#ff4fa1 → #ff78b6`, fundo `#fff7fb` com blobs animados, fonte Poppins
- Catálogo de produtos carregado do Supabase (com `lib/produtos.json` como fallback)
- Busca por nome/código e filtro por categoria, igual ao site original
- Carrinho de compras persistente (localStorage), botão flutuante no canto inferior direito
- Finalização de pedido: gera mensagem formatada e abre o WhatsApp automaticamente
- Login e cadastro de clientes (Supabase Auth)
- Painel `/admin` para criar, editar, ativar/desativar e excluir produtos

## 🚀 Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. As variáveis de ambiente já estão preenchidas em `.env.local` (suas credenciais do Supabase e o número de WhatsApp). Se precisar alterar:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_WHATSAPP_NUMBER=554396174585
   ```

3. Rode o projeto:
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:3000`

## 🗄️ Configurar o Supabase

1. Acesse o painel do seu projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** → cole todo o conteúdo do arquivo `sql/schema.sql` → clique em **Run**.
   - Isso cria as tabelas `produtos`, `perfis` e `pedidos`, configura as permissões (RLS) e insere 4 produtos de exemplo.
3. Crie sua conta de administradora pelo site (`/cadastro`).
4. Volte ao **SQL Editor** e rode (troque pelo seu e-mail):
   ```sql
   update public.perfis set is_admin = true where email = 'seuemail@exemplo.com';
   ```
5. Agora você pode acessar `/admin` para gerenciar os produtos.

## 📲 Como funciona o envio para o WhatsApp

Quando o cliente clica em **"Finalizar pedido no WhatsApp"**, o site monta automaticamente uma mensagem assim:

```
Olá! Quero fazer um pedido:
COD10 | Perfume Yara Rosa - 69,90 reais.
COD12 | Batom Matte Rosê x2 - 59,80 reais.
Total: 129.70 reais.
```

E abre o link `https://wa.me/554396174585?text=...` em uma nova aba, já preenchido — o cliente só precisa apertar enviar.

Para trocar o número de WhatsApp, edite a variável `NEXT_PUBLIC_WHATSAPP_NUMBER` (apenas números, com DDI 55 + DDD).

## 📦 Estrutura do projeto

```
app/
  page.js              → página da loja (catálogo + busca + categorias)
  layout.js            → layout raiz
  globals.css          → paleta oficial, blobs animados, tipografia
  login/page.js        → tela de login
  cadastro/page.js     → tela de cadastro
  admin/page.js        → painel administrativo
components/
  Header.js            → cabeçalho com logo oficial e login
  ProductCard.js        → card de produto
  CartButton.js        → botão flutuante do carrinho
  CartDrawer.js        → carrinho lateral + integração WhatsApp
lib/
  supabaseClient.js    → cliente do Supabase
  CartContext.js       → estado global do carrinho
  whatsapp.js          → monta o link e o texto do pedido
  produtos.json         → catálogo de fallback (mesmo formato da tabela)
public/
  logo.png             → logo oficial "Oi, bonita!"
sql/
  schema.sql           → script completo do banco de dados
```

## ☁️ Deploy

### Opção recomendada: Vercel
1. Suba este projeto para um repositório no GitHub.
2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório.
3. Em **Environment Variables**, adicione as 3 variáveis do `.env.example`.
4. Clique em **Deploy**. Pronto — seu site estará no ar.

### Subindo para o GitHub
```bash
git init
git add .
git commit -m "Loja Oi, Bonita! - versão inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

> ⚠️ O arquivo `.env.local` está no `.gitignore` por segurança/padrão, mas como sua chave é a **chave pública (publishable/anon)** do Supabase, ela é segura para expor no front-end — é o `.env.example` que já replica os mesmos valores caso precise.

## 🔐 Sobre as chaves do Supabase

A chave usada (`sb_publishable_...`) é a chave **pública** do Supabase — equivalente à antiga "anon key". Ela é projetada para rodar no navegador do cliente e é protegida pelas regras de **RLS (Row Level Security)** já configuradas no `schema.sql`. Nunca coloque a **service_role key** no front-end.

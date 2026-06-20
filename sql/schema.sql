-- =========================================================
-- SCHEMA DA LOJA ROSA — rode isto no SQL Editor do Supabase
-- =========================================================

-- 1) Tabela de produtos
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,           -- ex: COD10
  nome text not null,                    -- ex: Perfume Yara Rosa
  descricao text,
  preco numeric(10,2) not null,          -- ex: 69.90
  imagem_url text,
  categoria text,
  estoque integer default 0,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- 2) Tabela de perfis (vinculada ao auth.users do Supabase)
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  is_admin boolean default false,
  criado_em timestamptz default now()
);

-- 3) Tabela de pedidos (histórico, opcional mas recomendado)
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  itens jsonb not null,         -- snapshot dos itens comprados
  total numeric(10,2) not null,
  status text default 'pendente', -- pendente | enviado_whatsapp | concluido
  criado_em timestamptz default now()
);

-- =========================================================
-- TRIGGER: cria automaticamente um "perfil" quando alguém
-- se cadastra via Supabase Auth
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================
alter table public.produtos enable row level security;
alter table public.perfis enable row level security;
alter table public.pedidos enable row level security;

-- Qualquer pessoa (logada ou não) pode LER produtos ativos
create policy "produtos_select_publico"
  on public.produtos for select
  using (ativo = true);

-- Apenas admin pode inserir/editar/excluir produtos
create policy "produtos_admin_insert"
  on public.produtos for insert
  with check (
    exists (select 1 from public.perfis where id = auth.uid() and is_admin = true)
  );

create policy "produtos_admin_update"
  on public.produtos for update
  using (
    exists (select 1 from public.perfis where id = auth.uid() and is_admin = true)
  );

create policy "produtos_admin_delete"
  on public.produtos for delete
  using (
    exists (select 1 from public.perfis where id = auth.uid() and is_admin = true)
  );

-- Perfis: cada usuário só vê e edita o próprio perfil; admin vê todos
create policy "perfis_select_proprio"
  on public.perfis for select
  using (auth.uid() = id or exists (
    select 1 from public.perfis p where p.id = auth.uid() and p.is_admin = true
  ));

create policy "perfis_update_proprio"
  on public.perfis for update
  using (auth.uid() = id);

-- Pedidos: usuário vê os próprios; admin vê todos; qualquer logado pode criar o seu
create policy "pedidos_select_proprio"
  on public.pedidos for select
  using (
    auth.uid() = user_id or exists (
      select 1 from public.perfis where id = auth.uid() and is_admin = true
    )
  );

create policy "pedidos_insert_proprio"
  on public.pedidos for insert
  with check (auth.uid() = user_id);

-- =========================================================
-- DADOS DE EXEMPLO (produtos)
-- =========================================================
insert into public.produtos (codigo, nome, descricao, preco, imagem_url, categoria, estoque)
values
  ('COD10', 'Perfume Yara Rosa', 'Fragrância floral adocicada, fixação prolongada.', 69.90, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600', 'Perfumaria', 25),
  ('COD11', 'Hidratante Corporal Flor de Cerejeira', 'Hidratação intensa por 24h, toque seco.', 39.90, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 'Corpo', 40),
  ('COD12', 'Batom Matte Rosê', 'Cor intensa e duradoura, acabamento aveludado.', 29.90, 'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=600', 'Maquiagem', 60),
  ('COD13', 'Kit Skincare Glow', 'Sérum + hidratante facial para pele radiante.', 119.90, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', 'Skincare', 15),
  ('COD14', 'Paleta de Sombras Pink Glow', '12 cores em tons rosados, alta pigmentação.', 54.90, 'https://images.unsplash.com/photo-1583241800698-9c2cb3a04977?w=600', 'Maquiagem', 30),
  ('COD15', 'Óleo Capilar Reparador', 'Nutrição profunda, brilho e maciez instantânea.', 44.90, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', 'Cabelo', 35)
on conflict (codigo) do nothing;

-- =========================================================
-- PARA TORNAR UM USUÁRIO ADMIN (rode depois que ele se cadastrar):
-- update public.perfis set is_admin = true where email = 'seuemail@exemplo.com';
-- =========================================================

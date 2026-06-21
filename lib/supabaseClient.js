import { createClient } from '@supabase/supabase-js';

// Aceita os dois nomes possíveis de variável de ambiente, para evitar
// quebra caso o nome configurado na Vercel seja diferente do esperado.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Variáveis de ambiente faltando. Verifique NEXT_PUBLIC_SUPABASE_URL e ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) na Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import './globals.css';
import { CartProvider } from '../lib/CartContext';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Bonite-se! — Cosméticos e Perfumaria',
  description: 'Perfumes, skincare e maquiagem selecionados com carinho. Faça seu pedido pelo WhatsApp.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>{children}</CartProvider>
        <Analytics />
      </body>
    </html>
  );
}

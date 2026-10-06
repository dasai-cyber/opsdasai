import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control de Vueltas - Choferes',
  description: 'Aplicación para control de rutas y entregas',
  manifest: '/manifest.json', // Añadiremos esto después para la PWA
  themeColor: '#121418',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0', // Importante para PWA móvil
};

export default function ChoferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500/30">
      <main className="max-w-md mx-auto min-h-screen flex flex-col relative bg-[#121418] shadow-2xl border-x border-white/5">
        {children}
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${CONFIG.SYSTEM_NAME} — Sistema de Gestión de Operaciones`,
    template: `%s | ${CONFIG.SYSTEM_NAME}`,
  },
  description:
    "Plataforma corporativa para gestión de operaciones técnicas. Control de órdenes, técnicos, inventario, mapas e informes en tiempo real.",
  keywords: ["gestión operaciones", "órdenes de trabajo", "técnicos campo", "mantenimiento", "seguridad", "anclajes"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

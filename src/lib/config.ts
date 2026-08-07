// Configuración global de marca y sistema para la personalización de la plataforma.

export const CONFIG = {
  // Nombre del sistema (se usa en títulos y menús)
  SYSTEM_NAME: "OpsKeytek",
  
  // Nombre completo de la empresa (para pantallas corporativas)
  COMPANY_NAME: "Keytek SpA",
  
  // Dominio de correo electrónico por defecto para placeholders y sugerencias
  DEFAULT_EMAIL_DOMAIN: "keytek.cl",
  
  // Texto de derechos de autor (copyright)
  COPYRIGHT_TEXT: `© ${new Date().getFullYear()} Keytek. Todos los derechos reservados.`,
  
  // Versión del sistema
  SYSTEM_VERSION: "v2026.1",
  
  // Ruta al logo de la empresa (puedes reemplazar /Imagen1.jpg por el de Keytek)
  LOGO_PATH: "/Imagen1.jpg",
  
  // ¿Usar el logo como imagen física o preferir un logo dinámico con icono CSS?
  // true = usa LOGO_PATH. false = dibuja un logo premium usando CSS + Lucide Icon
  USE_IMAGE_LOGO: false,
};

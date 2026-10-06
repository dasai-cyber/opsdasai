const fs = require('fs');
let layout = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

layout = layout.replace(
  `{ href: "/dashboard/coordinacion", icon: CalendarDays,    label: "Coordinación",      badge: null,  roles: ['administrador','supervisor','operaria'] },`,
  `{ href: "/dashboard/coordinacion", icon: CalendarDays,    label: "Coordinación",      badge: null,  roles: ['administrador','supervisor','operaria'] },
  { href: "/dashboard/programacion", icon: CalendarDays,    label: "Programación",      badge: null,  roles: ['administrador','supervisor','operaria'] },`
);

fs.writeFileSync('src/app/dashboard/layout.tsx', layout);
console.log("Updated layout.tsx");

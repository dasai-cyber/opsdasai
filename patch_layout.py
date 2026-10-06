import re

with open('src/app/dashboard/layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Coordinacion to navItems
old_nav = """  { href: "/dashboard/technicians",  icon: Users,           label: "Chofer",            badge: null,  roles: ['administrador','supervisor','operaria'] },
];"""
new_nav = """  { href: "/dashboard/technicians",  icon: Users,           label: "Chofer",            badge: null,  roles: ['administrador','supervisor','operaria'] },
  { href: "/dashboard/coordinacion", icon: CalendarDays,    label: "Coordinación",      badge: null,  roles: ['administrador','supervisor','operaria'] },
];"""
content = content.replace(old_nav, new_nav)

# Remove the isCoordinacion logic
content = re.sub(
    r'const isCoordinacion = item\.href === "/dashboard/coordinacion";\s*const Icon = item\.icon;\s*const isActive = pathname === item\.href \|\| \(item\.href !== "/dashboard" && pathname\.startsWith\(item\.href\)\);\s*if \(isCoordinacion\) \{.*?\n\s*\}\s*return \(',
    r'''const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (''',
    content,
    flags=re.DOTALL
)

with open('src/app/dashboard/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Layout updated")

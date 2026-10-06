import re

def insert_nav():
    path = 'src/app/dashboard/layout.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    target = '{ href: "/dashboard/coordinacion", icon: CalendarDays,    label: "Coordinación",      badge: null,  roles: [\'administrador\',\'supervisor\',\'operaria\'] },'
    new_nav = target + '\n  { href: "/dashboard/control",      icon: MapPin,          label: "Control Vueltas",   badge: null,  roles: [\'administrador\',\'supervisor\'] },'

    text = text.replace(target, new_nav)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

insert_nav()
print("Nav item inserted")

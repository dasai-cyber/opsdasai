import re

with open('src/app/dashboard/technicians/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Replace statsByStatus map block
old_stats_code = """  const statsByStatus = STATUS_OPTS.map((s) => ({
    status: s,
    count: technicians.filter((t) => t.status === s).length,
  }));"""

new_stats_code = """  const getStatsForTipo = (tipo: string) => {
    return STATUS_OPTS.map((s) => ({
      status: s,
      count: technicians.filter((t) => t.status === s && (t.tipoServicio?.toLowerCase() === tipo.toLowerCase() || t.tipoServicio?.toLowerCase() === 'ambas')).length,
    }));
  };
  const statsSupermercado = getStatsForTipo('Supermercado');
  const statsPaqueteria = getStatsForTipo('Paquetería');"""

text = text.replace(old_stats_code, new_stats_code)

# 2. Replace the JSX block
old_jsx_block = """      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsByStatus.map(({ status, count }) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            className="stat-card text-left"
            style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as TechnicianStatus]}40` : undefined }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
              <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
          </button>
        ))}
      </div>"""

new_jsx_block = """      {/* Status summary */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#94a3b8" }}>Supermercado</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsSupermercado.map(({ status, count }) => (
              <button key={`sup-${status}`} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className="stat-card text-left"
                style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as TechnicianStatus]}40` : undefined }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
                  <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status === 'trabajando' ? 'libre' : status}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#94a3b8" }}>Paquetería</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsPaqueteria.map(({ status, count }) => (
              <button key={`paq-${status}`} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className="stat-card text-left"
                style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as TechnicianStatus]}40` : undefined }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
                  <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status === 'trabajando' ? 'libre' : status}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
              </button>
            ))}
          </div>
        </div>
      </div>"""

text = text.replace(old_jsx_block, new_jsx_block)

# 3. Replace all Trabajando in dropdowns
text = text.replace('<option value="trabajando">Trabajando</option>', '<option value="trabajando">Libre</option>')

# 4. Replace Trabajando UI string in TechCard
text = text.replace('status === "trabajando" ? "Trabajando"', 'status === "trabajando" ? "Libre"')


with open('src/app/dashboard/technicians/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied UI split and renaming")

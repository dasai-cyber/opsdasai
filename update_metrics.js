const fs = require('fs');
let file = fs.readFileSync('src/app/dashboard/technicians/page.tsx', 'utf8');

// Replace the single statsByStatus with getStatsForTipo
const statsByStatusCode = `  const statsByStatus = STATUS_OPTS.map((s) => ({
    status: s,
    count: technicians.filter((t) => t.status === s).length,
  }));`;

const newStatsCode = `  const getStatsForTipo = (tipo: string) => {
    return STATUS_OPTS.map((s) => ({
      status: s,
      count: technicians.filter((t) => t.status === s && (t.tipoServicio?.toLowerCase() === tipo.toLowerCase() || t.tipoServicio?.toLowerCase() === 'ambas')).length,
    }));
  };
  const statsSupermercado = getStatsForTipo('Supermercado');
  const statsPaqueteria = getStatsForTipo('Paquetería');`;

file = file.replace(statsByStatusCode, newStatsCode);


const oldJSX = `      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsByStatus.map(({ status, count }) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            className="stat-card text-left"
            style={{ border: statusFilter === status ? \`1px solid \${STATUS_COLOR[status as TechnicianStatus]}40\` : undefined }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
              <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
          </button>
        ))}
      </div>`;

const newJSX = `      {/* Status summary */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#94a3b8" }}>Supermercado</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsSupermercado.map(({ status, count }) => (
              <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className="stat-card text-left"
                style={{ border: statusFilter === status ? \`1px solid \${STATUS_COLOR[status as TechnicianStatus]}40\` : undefined }}>
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
              <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className="stat-card text-left"
                style={{ border: statusFilter === status ? \`1px solid \${STATUS_COLOR[status as TechnicianStatus]}40\` : undefined }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
                  <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status === 'trabajando' ? 'libre' : status}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
              </button>
            ))}
          </div>
        </div>
      </div>`;

file = file.replace(oldJSX, newJSX);

// Replace select option values in modals
file = file.replace(/<option value="trabajando">Trabajando<\/option>/g, '<option value="trabajando">Libre</option>');
file = file.replace(/<option value="trabajando">Trabajando<\/option>/g, '<option value="trabajando">Libre</option>');

// Update UI badge for the individual cards if it says "Trabajando"
file = file.replace(/status === "trabajando" \? "Trabajando"/g, 'status === "trabajando" ? "Libre"');

fs.writeFileSync('src/app/dashboard/technicians/page.tsx', file);
console.log("Updated metrics!");

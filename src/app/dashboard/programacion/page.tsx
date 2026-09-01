'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, X, Search, Trash2, Edit2, Car } from 'lucide-react';
import { Technician } from '@/types';

// Extend Technician local interface to hold programacion
interface Programacion {
  id: string;
  fecha: string;
  mes: string;
  ruta: string;
  patente: string;
  choferId: string;
  choferName: string;
  rut: string;
  tipoVehiculo: string;
  turno: string;
  hora: string;
}

const inputStyle = {
  width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f1f5f9", fontSize: 13,
  outline: "none"
};

export default function ProgramacionPage() {
  const [records, setRecords] = useState<Programacion[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Programacion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all technicians for the dropdown and all programacion records
  useEffect(() => {
    async function fetchData() {
      // Fetch technicians
      const { data: techData } = await supabase.from('tecnicos').select('id, name, rut, data');
      if (techData) {
        setTechnicians(techData.map(t => {
          const d = t.data || {};
          return {
            id: t.id,
            name: t.name,
            rut: t.rut,
            patente: d.patente || '',
            ...d
          } as Technician;
        }));
      }

      // Fetch programacion records from servicios table (type: 'programacion')
      const { data: progData } = await supabase
        .from('servicios')
        .select('id, data')
        .eq('data->>type', 'programacion')
        .order('created_at', { ascending: false });

      if (progData) {
        setRecords(progData.map(p => ({
          id: p.id,
          ...(p.data as any)
        })));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta programación?")) {
      await supabase.from('servicios').delete().eq('id', id);
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const filteredRecords = records.filter(r => 
    (r.choferName && r.choferName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.patente && r.patente.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.ruta && r.ruta.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Programación de Turnos</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Asigna choferes a turnos y rutas específicas.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} style={{ color: "#64748b" }} />
            </div>
            <input
              type="text"
              placeholder="Buscar chofer, ruta, patente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", borderRadius: 8 }}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            style={{ background: "#72b01d", color: "white" }}
          >
            <Plus size={16} /> Nueva
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "#1e2229" }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", color: "#94a3b8" }}>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Mes</th>
              <th className="px-4 py-3 font-medium text-center">Ruta</th>
              <th className="px-4 py-3 font-medium">Patente</th>
              <th className="px-4 py-3 font-medium">Chofer</th>
              <th className="px-4 py-3 font-medium">RUT</th>
              <th className="px-4 py-3 font-medium">Tipo Veh.</th>
              <th className="px-4 py-3 font-medium">Turno</th>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody style={{ color: "#e2e8f0" }}>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">Cargando datos...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">No hay programaciones registradas</td>
              </tr>
            ) : (
              filteredRecords.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="hover:bg-white/5">
                  <td className="px-4 py-3">{r.fecha}</td>
                  <td className="px-4 py-3">{r.mes}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-bold">{r.ruta}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{r.patente}</td>
                  <td className="px-4 py-3 font-medium text-white">{r.choferName}</td>
                  <td className="px-4 py-3 text-slate-400">{r.rut}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>
                      {r.tipoVehiculo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 font-bold text-xs border border-green-500/20">{r.turno}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.hora}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditingRecord(r)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded mr-2" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {(showAddModal || editingRecord) && (
        <ProgModal
          record={editingRecord}
          technicians={technicians}
          onClose={() => {
            setShowAddModal(false);
            setEditingRecord(null);
          }}
          onSave={(savedRecord) => {
            if (editingRecord) {
              setRecords(prev => prev.map(p => p.id === savedRecord.id ? savedRecord : p));
            } else {
              setRecords(prev => [savedRecord, ...prev]);
            }
            setShowAddModal(false);
            setEditingRecord(null);
          }}
        />
      )}
    </div>
  );
}

// Modal Component
function ProgModal({ 
  record, 
  technicians, 
  onClose, 
  onSave 
}: { 
  record: Programacion | null; 
  technicians: Technician[]; 
  onClose: () => void; 
  onSave: (rec: Programacion) => void;
}) {
  const isEdit = !!record;
  
  const [form, setForm] = useState({
    fecha: record?.fecha || new Date().toISOString().split('T')[0], // yyyy-mm-dd
    ruta: record?.ruta || '',
    choferId: record?.choferId || '',
    tipoVehiculo: record?.tipoVehiculo || 'Diesel',
    turno: record?.turno || 'AM-1',
    hora: record?.hora || '08:00',
    // We keep these in state so they are preserved even if chofer is custom
    choferName: record?.choferName || '',
    rut: record?.rut || '',
    patente: record?.patente || '',
  });

  const [saving, setSaving] = useState(false);

  const confirmClose = () => {
    if (window.confirm("¿Deseas GUARDAR los datos antes de salir? (Aceptar = Guardar, Cancelar = No guardar)")) {
      handleSave();
    } else {
      if (window.confirm("¿Deseas salir sin guardar y perder los cambios?")) {
        onClose();
      }
    }
  };

  const getMesString = (dateStr: string) => {
    if (!dateStr) return '';
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const d = new Date(dateStr + "T12:00:00"); // Avoid timezone issues
    return meses[d.getMonth()] || '';
  };

  const handleChoferChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    const tech = technicians.find(t => t.id === cid);
    if (tech) {
      setForm(f => ({
        ...f, 
        choferId: cid, 
        choferName: tech.name, 
        rut: tech.rut, 
        patente: tech.patente || '' 
      }));
    } else {
      setForm(f => ({
        ...f, choferId: '', choferName: '', rut: '', patente: ''
      }));
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create payload matching generic servicio shape
      const payload: any = {
        type: 'programacion',
        fecha: form.fecha, // we'll reformat it later if needed, or keep yyyy-mm-dd
        mes: getMesString(form.fecha),
        ruta: form.ruta.trim(),
        choferId: form.choferId,
        choferName: form.choferName.trim(),
        rut: form.rut.trim(),
        patente: form.patente.trim().toUpperCase(),
        tipoVehiculo: form.tipoVehiculo,
        turno: form.turno,
        hora: form.hora
      };

      if (isEdit && record) {
        payload.id = record.id; // required to not overwrite
        await supabase.from('servicios').update({
          data: payload,
          fecha: form.fecha // Keep root fecha searchable if needed
        }).eq('id', record.id);
        onSave(payload as Programacion);
      } else {
        const id = `prog-${Date.now()}`;
        payload.id = id;
        
        await supabase.from('servicios').insert({
          id,
          cliente: 'N/A', // dummy for not-null constraints if any
          direccion: 'N/A',
          fecha: form.fecha,
          estado: 'creada',
          data: payload
        });
        onSave(payload as Programacion);
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar la programación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h2 className="text-lg font-bold" style={{ color: "#f1f5f9" }}>
              {isEdit ? 'Editar Programación' : 'Nueva Programación'}
            </h2>
            <button onClick={confirmClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={20} /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Fecha</label>
                <input type="date" style={inputStyle} value={form.fecha} onChange={set('fecha')} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Ruta (Ej: 95)</label>
                <input style={inputStyle} value={form.ruta} onChange={set('ruta')} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Chofer</label>
              <select style={inputStyle} value={form.choferId} onChange={handleChoferChange}>
                <option value="">Selecciona un chofer registrado...</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (RUT: {t.rut})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Nombre (Manual)</label>
                <input style={inputStyle} value={form.choferName} onChange={set('choferName')} placeholder="Se autocompleta" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>RUT (Manual)</label>
                <input style={inputStyle} value={form.rut} onChange={set('rut')} placeholder="11.222.333-4" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Patente</label>
                <input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.patente} onChange={set('patente')} placeholder="ABCD12" />
              </div>
              <div className="col-span-2">
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Tipo Vehículo</label>
                <select style={inputStyle} value={form.tipoVehiculo} onChange={set('tipoVehiculo')}>
                  <option value="Diesel">Diesel</option>
                  <option value="Eléctrica">Eléctrica</option>
                  <option value="Bencina">Bencina</option>
                  <option value="Gas">Gas</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Turno</label>
                <select style={inputStyle} value={form.turno} onChange={set('turno')}>
                  <option value="AM-1">AM-1</option>
                  <option value="AM-2">AM-2</option>
                  <option value="PM-1">PM-1</option>
                  <option value="PM-2">PM-2</option>
                  <option value="NOCHE">Noche</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>Hora (Ej: 08:00)</label>
                <input style={inputStyle} type="time" value={form.hora} onChange={set('hora')} />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex justify-end gap-3" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={confirmClose} style={{ background: "transparent", color: "#94a3b8", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8 }}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.choferName || !form.fecha}
              style={{
                background: "#72b01d", color: "white", fontSize: 13, fontWeight: 500,
                padding: "8px 20px", borderRadius: 8, opacity: (saving || !form.choferName || !form.fecha) ? 0.7 : 1
              }}
            >
              {saving ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

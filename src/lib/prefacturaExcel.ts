import type ExcelJSNS from "exceljs";

export interface PrefacturaExcelRow {
  patente: string;
  fecha: string; // YYYY-MM-DD o DD/MM/YYYY
  horaInicio: string;
  horaTermino: string;
  local: string;
  asignadoA: string;
  v1: string; sg1: string | number;
  v2: string; sg2: string | number;
  v3: string; sg3: string | number;
  v4: string; sg4: string | number;
  v5: string; sg5: string | number;
  valorDia: number;
  adicional: number;
  bono: number;
}

export interface PrefacturaExcelInput {
  emisor: { nombre: string; subtitulo: string; rut: string; direccion: string; telefono: string; correo: string };
  cliente: { razonSocial: string; rut: string; giro: string; direccion: string; contacto: string };
  transferencia: { banco: string; tipoCuenta: string; numCuenta: string; titular: string; rut: string; correo: string };
  numPrefactura: string;
  fechaEmision: string; // YYYY-MM-DD
  plazoDias: number;
  descuentoPct: number; // 0-100
  observaciones: string;
  rows: PrefacturaExcelRow[];
}

const FIRST_ROW = 16;
const LAST_TEMPLATE_ROW = 46; // 31 filas de detalle en la plantilla
const BOTTOM_FIRST = 47;      // fila TOTAL
const BOTTOM_LAST = 62;       // nota al pie
const LAST_COL = 21;          // U

function parseDate(s: string): Date | null {
  if (!s) return null;
  const t = s.trim();
  let y: number, m: number, d: number;
  let mt = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (mt) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else {
    mt = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (!mt) return null;
    d = +mt[1]; m = +mt[2]; y = +mt[3];
  }
  return new Date(Date.UTC(y, m - 1, d)); // UTC para que Excel no corra el día
}

function parseTime(s: string): number | null {
  if (!s) return null;
  const mt = s.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!mt) return null;
  return (+mt[1] * 60 + +mt[2]) / 1440;
}

function num(v: string | number | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

function shiftFormulaRows(formula: string, extra: number): string {
  // El fin del rango SUM(U16:U46) crece con las filas nuevas; las referencias a filas >= 47 se desplazan.
  return formula.replace(/([A-Z]+)(\d+)/g, (m, c, r) => {
    const row = parseInt(r, 10);
    if (row >= LAST_TEMPLATE_ROW) return `${c}${row + extra}`;
    return m;
  });
}

export async function buildPrefacturaWorkbook(
  ExcelJS: typeof ExcelJSNS,
  templateBuffer: ArrayBuffer | Buffer,
  input: PrefacturaExcelInput
): Promise<ExcelJSNS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer as ArrayBuffer);
  const ws = wb.getWorksheet("Prefactura");
  if (!ws) throw new Error("La plantilla no contiene la hoja 'Prefactura'");

  const n = input.rows.length;
  const extra = Math.max(0, n - (LAST_TEMPLATE_ROW - FIRST_ROW + 1));

  // ── 1. Si hay más de 31 servicios, abrir espacio desplazando el bloque inferior ──
  if (extra > 0) {
    const merges: string[] = [...((ws.model as any).merges || [])];
    const bottomMerges = merges.filter((r) => {
      const top = parseInt(r.split(":")[0].replace(/[A-Z]+/, ""), 10);
      return top >= BOTTOM_FIRST;
    });
    bottomMerges.forEach((r) => ws.unMergeCells(r));

    for (let r = BOTTOM_LAST; r >= BOTTOM_FIRST; r--) {
      const src = ws.getRow(r);
      const dst = ws.getRow(r + extra);
      dst.height = src.height;
      for (let c = 1; c <= LAST_COL; c++) {
        const sc = src.getCell(c);
        const dc = dst.getCell(c);
        let v: any = sc.value;
        if (v && typeof v === "object" && "formula" in v) {
          v = { formula: shiftFormulaRows(v.formula, extra) };
        }
        dc.value = v;
        dc.style = JSON.parse(JSON.stringify(sc.style));
      }
    }

    // Nuevas filas de detalle 47 .. 46+extra con el estilo/fórmulas de la fila 46
    for (let r = BOTTOM_FIRST; r < BOTTOM_FIRST + extra; r++) {
      const row = ws.getRow(r);
      row.height = ws.getRow(LAST_TEMPLATE_ROW).height;
      for (let c = 1; c <= LAST_COL; c++) {
        const sc = ws.getRow(LAST_TEMPLATE_ROW).getCell(c);
        const dc = row.getCell(c);
        dc.style = JSON.parse(JSON.stringify(sc.style));
        let v: any = null;
        if (c === 6) v = { formula: `IF(COUNT(I${r},K${r},M${r},O${r},Q${r})=0,"",SUM(I${r},K${r},M${r},O${r},Q${r}))` };
        if (c === 21) v = { formula: `IF(COUNT(R${r}:T${r})=0,"",SUM(R${r}:T${r}))` };
        dc.value = v;
      }
    }

    bottomMerges.forEach((r) => {
      const [a, b] = r.split(":");
      const shift = (ref: string) => ref.replace(/([A-Z]+)(\d+)/, (_m, c, rr) => `${c}${parseInt(rr, 10) + extra}`);
      ws.mergeCells(`${shift(a)}:${shift(b)}`);
    });

    ws.pageSetup.printArea = `A1:U${BOTTOM_LAST + extra}`;
  }

  // Lista desplegable OK/NO y fórmulas de Puntos (F) y Total (U) en todas las filas de detalle
  // (en la plantilla original las filas 16-22 no traen fórmula).
  const lastDetail = LAST_TEMPLATE_ROW + extra;
  for (let r = FIRST_ROW; r <= lastDetail; r++) {
    for (const col of ["H", "J", "L", "N", "P"]) {
      ws.getCell(`${col}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"OK,NO"'],
      };
    }
    ws.getCell(`F${r}`).value = { formula: `IF(COUNT(I${r},K${r},M${r},O${r},Q${r})=0,"",SUM(I${r},K${r},M${r},O${r},Q${r}))` } as any;
    ws.getCell(`U${r}`).value = { formula: `IF(COUNT(R${r}:T${r})=0,"",SUM(R${r}:T${r}))` } as any;
  }

  // ── 2. Encabezado emisor / prefactura ──
  ws.getCell("C1").value = input.emisor.nombre;
  ws.getCell("C2").value = input.emisor.subtitulo;
  ws.getCell("C3").value = `RUT empresa: ${input.emisor.rut}`;
  ws.getCell("C4").value = `Dirección: ${input.emisor.direccion}`;
  ws.getCell("C5").value = `Tel: ${input.emisor.telefono} · ${input.emisor.correo}`;
  ws.getCell("T2").value = input.numPrefactura;
  const fe = parseDate(input.fechaEmision);
  if (fe) ws.getCell("T3").value = fe;
  ws.getCell("T3").numFmt = "dd/mm/yyyy";
  ws.getCell("T5").numFmt = "dd/mm/yyyy";
  ws.getCell("T4").value = Number(input.plazoDias) || 0;
  // T5 conserva la fórmula =T3+T4 de la plantilla

  // ── 3. Cliente ──
  ws.getCell("C8").value = input.cliente.razonSocial;
  ws.getCell("C9").value = input.cliente.rut;
  ws.getCell("C10").value = input.cliente.giro;
  ws.getCell("C11").value = input.cliente.direccion;
  ws.getCell("C12").value = input.cliente.contacto;

  // ── 4. Detalle ──
  const dateFmt = "dd/mm/yyyy";
  input.rows.forEach((r, i) => {
    const row = FIRST_ROW + i;
    ws.getCell(`A${row}`).value = r.patente || null;
    const d = parseDate(r.fecha);
    const cB = ws.getCell(`B${row}`);
    cB.value = d;
    cB.numFmt = dateFmt;
    ws.getCell(`C${row}`).value = parseTime(r.horaInicio);
    ws.getCell(`D${row}`).value = parseTime(r.horaTermino);
    ws.getCell(`E${row}`).value = r.local || null;
    ws.getCell(`G${row}`).value = r.asignadoA || null;
    const pairs = [[r.v1, r.sg1, "H", "I"], [r.v2, r.sg2, "J", "K"], [r.v3, r.sg3, "L", "M"], [r.v4, r.sg4, "N", "O"], [r.v5, r.sg5, "P", "Q"]] as const;
    pairs.forEach(([v, sg, cv, cs]) => {
      const vv = (v ?? "").toString().trim().toUpperCase();
      ws.getCell(`${cv}${row}`).value = vv || null;
      ws.getCell(`${cs}${row}`).value = num(sg as any);
    });
    ws.getCell(`R${row}`).value = r.valorDia || null;
    ws.getCell(`S${row}`).value = r.adicional || null;
    ws.getCell(`T${row}`).value = r.bono || null;
    // F (Puntos) y U (Total) conservan las fórmulas de la plantilla
  });

  // ── 5. Totales, observaciones y transferencia (desplazados si corresponde) ──
  const R = (row: number) => row + extra;
  ws.getCell(`A${R(49)}`).value = input.observaciones || null;
  ws.getCell(`T${R(50)}`).value = Math.max(0, Math.min(100, Number(input.descuentoPct) || 0)) / 100;
  ws.getCell(`C${R(56)}`).value = input.transferencia.banco;
  ws.getCell(`C${R(57)}`).value = input.transferencia.tipoCuenta;
  ws.getCell(`C${R(58)}`).value = input.transferencia.numCuenta;
  ws.getCell(`C${R(59)}`).value = `${input.transferencia.titular} · ${input.transferencia.rut}`;
  ws.getCell(`C${R(60)}`).value = input.transferencia.correo;

  // Forzar recálculo de fórmulas al abrir en Excel / LibreOffice
  (wb as any).calcProperties = { fullCalcOnLoad: true };

  return wb;
}

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  VerticalAlign,
  ImageRun,
  Packer,
  Header,
  Footer,
  HorizontalPositionRelativeFrom,
  HorizontalPositionAlign,
  VerticalPositionRelativeFrom,
  VerticalPositionAlign,
  TextWrappingType,
} from 'docx';
import * as path from 'path';
import * as fs from 'fs';

// Helper base64 logo (using the same logo from the project)
import { logoB64 } from './logoB64';

interface LineItem {
  id: string;
  descripcion: string;
  cantidad: number;
  valorUnit: number;
}

interface Cotizacion {
  id: string;
  numero: string;
  fecha: string;
  cliente: string;
  rut: string;
  atencion: string;
  emailContacto: string;
  descripcionServicio: string;
  direccion: string;
  items: LineItem[];
  nota: string;
  estado: string;
}

const BLUE_TEXT = '1F497D';
const BLUE_DARK = '1D2D44';
const TABLE_HEADER_BG = '4E5E77';
const ROW_ALT_BG = 'EBF1F6';

function fmtCLP(n: number) {
  return "$ " + n.toLocaleString("es-CL");
}

function formatLongDate(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    if (!isNaN(day) && month >= 0 && month < 12 && !isNaN(year)) {
      return `${String(day).padStart(2, '0')} de ${months[month]} ${year}`;
    }
  }
  return dateStr;
}

async function fetchImageBuffer(base64Str: string): Promise<{ buffer: Buffer; type: 'png' | 'jpg' | 'gif' } | null> {
  try {
    const cleanB64 = base64Str.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanB64, 'base64');
    return { buffer, type: 'png' };
  } catch {
    return null;
  }
}

export async function generarCotizacionDocx(cot: Cotizacion): Promise<Buffer> {
  const neto = cot.items.reduce((s, i) => s + i.cantidad * i.valorUnit, 0);
  const iva = Math.round(neto * 0.19);
  const bruto = neto + iva;

  // Cargar buffers de ondas locales
  let topWaveBuffer: Buffer | null = null;
  let bottomWaveBuffer: Buffer | null = null;
  try {
    const publicPath = path.join(process.cwd(), 'public');
    topWaveBuffer = fs.readFileSync(path.join(publicPath, 'top_wave.png'));
    bottomWaveBuffer = fs.readFileSync(path.join(publicPath, 'bottom_wave.png'));
  } catch (e) {
    console.error("Error cargando archivos de ondas locales:", e);
  }

  // Cargar Logo
  let logoRun: ImageRun | null = null;
  const logoBufferInfo = await fetchImageBuffer(logoB64);
  if (logoBufferInfo) {
    logoRun = new ImageRun({
      data: logoBufferInfo.buffer,
      transformation: { width: 140, height: 95 },
      type: logoBufferInfo.type,
    });
  }

  // Header Table (Logo left, number/date right)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: logoRun ? [logoRun] : [
                  new TextRun({
                    text: 'KEYTEK SpA',
                    bold: true,
                    size: 32,
                    font: 'Arial',
                    color: BLUE_TEXT,
                  })
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 200 },
                children: [
                  new TextRun({
                    text: `COTIZACIÓN #${cot.numero || '___'}\n`,
                    bold: true,
                    size: 40,
                    font: 'Arial',
                    color: BLUE_TEXT,
                  }),
                  new TextRun({
                    text: formatLongDate(cot.fecha),
                    size: 24,
                    font: 'Arial',
                    color: '555555',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Divider Line
  const dividerLine = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 24, color: BLUE_TEXT },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ spacing: { after: 120 } })]
          })
        ]
      })
    ]
  });

  // Client Section
  const clientParagraphs = [
    new Paragraph({
      children: [
        new TextRun({ text: 'CLIENTE', bold: true, size: 22, color: '555555', font: 'Arial' })
      ],
      spacing: { after: 60 }
    })
  ];

  if (cot.atencion) {
    clientParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Nombre: `, bold: true, size: 24, color: '3182CE', font: 'Arial' }),
          new TextRun({ text: cot.atencion, size: 24, color: '3182CE', font: 'Arial' }),
        ],
        spacing: { after: 30 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Empresa: `, bold: true, size: 24, color: '3182CE', font: 'Arial' }),
          new TextRun({ text: cot.cliente, size: 24, color: '3182CE', font: 'Arial' }),
        ],
        spacing: { after: 200 }
      })
    );
  } else {
    clientParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Cliente: `, bold: true, size: 24, color: '3182CE', font: 'Arial' }),
          new TextRun({ text: cot.cliente, size: 24, color: '3182CE', font: 'Arial' }),
        ],
        spacing: { after: 200 }
      })
    );
  }

  // Description block
  const descParagraphs: Paragraph[] = [];
  if (cot.descripcionServicio) {
    descParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'DESCRIPCIÓN DEL SERVICIO:', bold: true, size: 20, color: BLUE_TEXT, font: 'Arial' })
        ],
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: cot.descripcionServicio, size: 22, font: 'Arial' })
        ],
        spacing: { after: 200 }
      })
    );
  }

  // Items Table Cells Helpers
  const cellStyle = (shading?: string) => ({
    shading: shading ? { type: ShadingType.CLEAR, fill: shading } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    }
  });

  const headerCellStyle = () => ({
    shading: { type: ShadingType.CLEAR, fill: TABLE_HEADER_BG },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    }
  });

  // Build Table
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          ...headerCellStyle(),
          width: { size: 55, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Descripción', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })]
        }),
        new TableCell({
          ...headerCellStyle(),
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cantidad', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })]
        }),
        new TableCell({
          ...headerCellStyle(),
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Precio', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })]
        }),
        new TableCell({
          ...headerCellStyle(),
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Total', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })]
        }),
      ]
    })
  ];

  cot.items.forEach((item, i) => {
    const bg = i % 2 === 1 ? ROW_ALT_BG : undefined;
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            ...cellStyle(bg),
            children: [new Paragraph({ children: [new TextRun({ text: item.descripcion || '', size: 22, font: 'Arial' })] })]
          }),
          new TableCell({
            ...cellStyle(bg),
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.cantidad), size: 22, font: 'Arial' })] })]
          }),
          new TableCell({
            ...cellStyle(bg),
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtCLP(item.valorUnit), size: 22, font: 'Arial' })] })]
          }),
          new TableCell({
            ...cellStyle(bg),
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtCLP(item.cantidad * item.valorUnit), bold: true, size: 22, font: 'Arial' })] })]
          }),
        ]
      })
    );
  });

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  // Totales Table
  const totalsTable = new Table({
    width: { size: 35, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.RIGHT,
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL NETO', bold: true, size: 20, color: '475569', font: 'Arial' })] })]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtCLP(neto), size: 22, font: 'Arial' })] })]
          }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'IVA (19%)', bold: true, size: 20, color: '475569', font: 'Arial' })] })]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtCLP(iva), size: 22, font: 'Arial' })] })]
          }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: TABLE_HEADER_BG },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL:', bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })] })]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: TABLE_HEADER_BG },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtCLP(bruto), bold: true, color: 'FFFFFF', size: 24, font: 'Arial' })] })]
          }),
        ]
      }),
    ]
  });

  // Note Section
  const noteParagraphs: Paragraph[] = [];
  if (cot.nota) {
    noteParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Nota: ', bold: true, size: 22, color: BLUE_TEXT, font: 'Arial' }),
          new TextRun({ text: cot.nota, size: 22, font: 'Arial' })
        ],
        spacing: { before: 240, after: 120 }
      })
    );
  }

  // Header floating wave
  const pageHeader = new Header({
    children: topWaveBuffer ? [
      new Paragraph({
        children: [
          new ImageRun({
            data: topWaveBuffer,
            type: 'png',
            transformation: {
              width: 816, // fits letter width at 96 dpi
              height: 180,
            },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.LEFT,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.TOP,
              },
              wrap: {
                type: TextWrappingType.NONE,
              },
            },
          }),
        ],
      })
    ] : [],
  });

  // Footer floating wave + centered email
  const pageFooter = new Footer({
    children: bottomWaveBuffer ? [
      new Paragraph({
        children: [
          new ImageRun({
            data: bottomWaveBuffer,
            type: 'png',
            transformation: {
              width: 816,
              height: 180,
            },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.LEFT,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.BOTTOM,
              },
              wrap: {
                type: TextWrappingType.NONE,
              },
            },
          }),
        ],
      }),
      // Center the email on top of the dark blue wave area
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: [
          new TextRun({
            text: 'contacto@keytek.cl',
            bold: true,
            size: 24,
            color: 'FFFFFF',
            font: 'Arial',
          })
        ]
      })
    ] : [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'contacto@keytek.cl', size: 20, color: '475569', font: 'Arial' })
        ]
      })
    ],
  });

  // Document Assembly
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        headers: {
          default: pageHeader,
        },
        footers: {
          default: pageFooter,
        },
        children: [
          headerTable,
          dividerLine,
          ...clientParagraphs,
          ...descParagraphs,
          itemsTable,
          new Paragraph({ spacing: { after: 120 } }),
          totalsTable,
          ...noteParagraphs,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

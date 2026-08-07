import { generarDocx } from './src/lib/generarDocx';

const mockInforme: any = {
  numeroOT: '10895',
  destinatario: 'Cliente Test',
  direccion: 'Calle Falsa 123',
  ubicacion: 'Frente',
  comuna: 'Santiago',
  numeroATM: '123',
  serieATM: 'ABC',
  modeloMMBB: 'M1',
  serieMMBB: 'S1',
  solicitante: 'Solicitante Test',
  tecnicoSupervisor: 'Tecnico Test',
  fechaInicio: '2026-06-15T10:00:00Z',
  fechaFin: '2026-06-15T12:00:00Z',
  valorServicio: '1000',
  detalle: 'Detalle del problema',
  resumenTrabajo: 'Resumen de solucion',
  imagenes: []
};

async function test() {
  try {
    const buffer = await generarDocx(mockInforme);
    console.log('Success! Buffer length:', buffer.length);
  } catch (error) {
    console.error('Error in generarDocx:');
    console.error(error);
  }
}

test();

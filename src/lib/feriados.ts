// Cálculo da Páscoa pelo algoritmo de Meeus/Jones/Butcher
function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function adicionarDias(data: Date, dias: number): Date {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

export interface Feriado {
  data: Date;
  nome: string;
  tipo: 'fixo' | 'movel';
}

export function getFeriadosBrasileiros(ano: number): Feriado[] {
  const pascoa = calcularPascoa(ano);
  const carnaval = adicionarDias(pascoa, -47);
  const sextaSanta = adicionarDias(pascoa, -2);
  const corpusChristi = adicionarDias(pascoa, 60);

  return [
    { data: new Date(ano, 0, 1), nome: 'Confraternização Universal', tipo: 'fixo' },
    { data: adicionarDias(carnaval, -1), nome: 'Carnaval (Segunda)', tipo: 'movel' },
    { data: carnaval, nome: 'Carnaval (Terça)', tipo: 'movel' },
    { data: adicionarDias(carnaval, 1), nome: 'Quarta-feira de Cinzas', tipo: 'movel' },
    { data: sextaSanta, nome: 'Sexta-feira Santa', tipo: 'movel' },
    { data: pascoa, nome: 'Páscoa', tipo: 'movel' },
    { data: new Date(ano, 3, 21), nome: 'Tiradentes', tipo: 'fixo' },
    { data: new Date(ano, 4, 1), nome: 'Dia do Trabalho', tipo: 'fixo' },
    { data: corpusChristi, nome: 'Corpus Christi', tipo: 'movel' },
    { data: new Date(ano, 8, 7), nome: 'Independência do Brasil', tipo: 'fixo' },
    { data: new Date(ano, 9, 12), nome: 'Nossa Senhora Aparecida', tipo: 'fixo' },
    { data: new Date(ano, 10, 2), nome: 'Finados', tipo: 'fixo' },
    { data: new Date(ano, 10, 15), nome: 'Proclamação da República', tipo: 'fixo' },
    { data: new Date(ano, 11, 25), nome: 'Natal', tipo: 'fixo' },
  ];
}

export function getFeriadoDoDia(data: Date, feriados: Feriado[]): Feriado | undefined {
  return feriados.find(f =>
    f.data.getDate() === data.getDate() &&
    f.data.getMonth() === data.getMonth() &&
    f.data.getFullYear() === data.getFullYear()
  );
}

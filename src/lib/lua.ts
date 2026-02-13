export type FaseLua = 'nova' | 'crescente' | 'cheia' | 'minguante';

export interface InfoLua {
  fase: FaseLua;
  emoji: string;
  nome: string;
  iluminacao: number; // 0-100
}

// Cálculo simplificado da fase da lua baseado no ciclo sinódico
export function getFaseLua(data: Date): InfoLua {
  // Lua nova de referência: 6 de janeiro de 2000
  const ref = new Date(2000, 0, 6, 18, 14, 0);
  const cicloSinodico = 29.53058867;

  const diff = (data.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
  const ciclos = diff / cicloSinodico;
  const fase = ciclos - Math.floor(ciclos);
  const iluminacao = Math.round((1 - Math.cos(fase * 2 * Math.PI)) / 2 * 100);

  if (fase < 0.0625 || fase >= 0.9375) {
    return { fase: 'nova', emoji: '🌑', nome: 'Lua Nova', iluminacao };
  } else if (fase < 0.3125) {
    return { fase: 'crescente', emoji: '🌓', nome: 'Lua Crescente', iluminacao };
  } else if (fase < 0.5625) {
    return { fase: 'cheia', emoji: '🌕', nome: 'Lua Cheia', iluminacao };
  } else {
    return { fase: 'minguante', emoji: '🌗', nome: 'Lua Minguante', iluminacao };
  }
}

// Retorna as datas das fases principais no mês
export function getFasesPrincipaisMes(ano: number, mes: number): { data: Date; info: InfoLua }[] {
  const fases: { data: Date; info: InfoLua }[] = [];
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  let faseAnterior = '';
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const d = new Date(ano, mes, dia);
    const info = getFaseLua(d);
    if (info.fase !== faseAnterior) {
      fases.push({ data: d, info });
      faseAnterior = info.fase;
    }
  }

  return fases;
}

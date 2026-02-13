export function getDiasDoMes(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  // 0 = Domingo
  const diaSemanaInicio = primeiroDia.getDay();

  const dias: (Date | null)[] = [];

  // Preencher dias vazios antes do primeiro dia
  for (let i = 0; i < diaSemanaInicio; i++) {
    dias.push(null);
  }

  // Dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    dias.push(new Date(ano, mes, dia));
  }

  return dias;
}

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function isHoje(data: Date): boolean {
  const hoje = new Date();
  return data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear();
}

export function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

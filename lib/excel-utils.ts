import * as XLSX from "xlsx";

/**
 * Convierte el formato de fecha serie de Excel a string legible DD-MM-YYYY HH:MM:SS
 */
export const formatExcelDate = (value: any): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    const day = String(date.d).padStart(2, '0');
    const month = String(date.m).padStart(2, '0');
    return `${day}-${month}-${date.y} ${String(date.H).padStart(2, '0')}:${String(date.M).padStart(2, '0')}:${String(date.S).padStart(2, '0')}`;
  }
  return String(value);
};

/**
 * Valida una fila individual y retorna un hash para detectar duplicados
 */
export const validateExcelRow = (row: any, rowNum: number, idsValidos: string[], lastTime: number) => {
  const required = ["Ronda", "Participante", "Contenido", "Timestamp"];
  const regexTS = /^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2}$/;

  // Campos obligatorios
  if (required.some(field => !row[field])) {
    throw new Error(`Fila ${rowNum}: Faltan datos obligatorios.`);
  }

  // Formato de fecha
  const currentTS = String(row.Timestamp).trim();
  if (!regexTS.test(currentTS)) {
    throw new Error(`Fila ${rowNum}: Formato de fecha incorrecto.`);
  }

  // Validación de ID de participante
  if (!idsValidos.includes(row.Participante)) {
    throw new Error(`Fila ${rowNum}: El participante "${row.Participante}" no está en la lista.`);
  }

  // Validación cronológica
  const [datePart, timePart] = currentTS.split(" ");
  const [d, m, y] = datePart.split("-");
  const currentTime = new Date(`${y}-${m}-${d}T${timePart}`).getTime();

  if (currentTime < lastTime) {
    throw new Error(`Fila ${rowNum}: Los registros deben estar ordenados cronológicamente.`);
  }

  return {
    currentTime,
    hash: `${row.Participante}|${row.Contenido}|${currentTS}`
  };
};
// Subset of common CIE-10 codes for the selector
export const CIE10_CODES = [
  { code: "J00", description: "Rinofaringitis aguda (resfriado común)" },
  { code: "J06.9", description: "Infección aguda de las vías respiratorias superiores" },
  { code: "J18.9", description: "Neumonía, no especificada" },
  { code: "J20.9", description: "Bronquitis aguda, no especificada" },
  { code: "J45.9", description: "Asma, no especificada" },
  { code: "K29.7", description: "Gastritis, no especificada" },
  { code: "K21.0", description: "Enfermedad por reflujo gastroesofágico con esofagitis" },
  { code: "K57.9", description: "Enfermedad diverticular del intestino, parte no especificada" },
  { code: "K92.1", description: "Melena" },
  { code: "I10", description: "Hipertensión esencial (primaria)" },
  { code: "I25.1", description: "Enfermedad aterosclerótica del corazón" },
  { code: "I50.9", description: "Insuficiencia cardíaca, no especificada" },
  { code: "E11.9", description: "Diabetes mellitus tipo 2 sin complicaciones" },
  { code: "E10.9", description: "Diabetes mellitus tipo 1 sin complicaciones" },
  { code: "E66.9", description: "Obesidad, no especificada" },
  { code: "E03.9", description: "Hipotiroidismo, no especificado" },
  { code: "E05.9", description: "Tirotoxicosis, no especificada" },
  { code: "E78.5", description: "Hiperlipidemia, no especificada" },
  { code: "F32.9", description: "Episodio depresivo, no especificado" },
  { code: "F41.1", description: "Trastorno de ansiedad generalizada" },
  { code: "F10.2", description: "Trastornos mentales y del comportamiento debidos al alcohol" },
  { code: "G43.9", description: "Migraña, no especificada" },
  { code: "G40.9", description: "Epilepsia, no especificada" },
  { code: "M54.5", description: "Lumbalgia (dolor lumbar)" },
  { code: "M54.4", description: "Lumbago con ciática" },
  { code: "M06.9", description: "Artritis reumatoide, no especificada" },
  { code: "M81.9", description: "Osteoporosis, no especificada" },
  { code: "N18.9", description: "Enfermedad renal crónica, no especificada" },
  { code: "N39.0", description: "Infección de vías urinarias, sitio no especificado" },
  { code: "N93.9", description: "Hemorragia uterina irregular, no especificada" },
  { code: "C34.9", description: "Tumor maligno del bronquio o del pulmón" },
  { code: "C18.9", description: "Tumor maligno del colon" },
  { code: "C50.9", description: "Tumor maligno de la mama" },
  { code: "C61", description: "Tumor maligno de la próstata" },
  { code: "Z00.0", description: "Examen médico general" },
  { code: "Z30.0", description: "Asesoramiento general sobre anticoncepción" },
  { code: "Z34.0", description: "Supervisión de embarazo normal, primero" },
  { code: "R50.9", description: "Fiebre, no especificada" },
  { code: "R05", description: "Tos" },
  { code: "R07.0", description: "Dolor de garganta" },
  { code: "R51", description: "Cefalea (dolor de cabeza)" },
  { code: "R10.4", description: "Otros dolores abdominales y los no especificados" },
  { code: "R11", description: "Náusea y vómito" },
  { code: "R19.7", description: "Diarrea, no especificada" },
  { code: "R06.0", description: "Disnea" },
  { code: "R00.0", description: "Taquicardia, no especificada" },
  { code: "R55", description: "Síncope y colapso" },
  { code: "S72.0", description: "Fractura del cuello del fémur" },
  { code: "S52.5", description: "Fractura de la extremidad distal del radio" },
  { code: "T14.9", description: "Lesión no especificada" },
  { code: "B34.9", description: "Infección vírica, no especificada" },
  { code: "A09", description: "Otras gastroenteritis y colitis de origen infeccioso" },
];

export function searchCIE10(query: string, limit = 10) {
  const q = query.toLowerCase().trim();
  if (!q) return CIE10_CODES.slice(0, limit);
  return CIE10_CODES.filter(
    (item) =>
      item.code.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
  ).slice(0, limit);
}

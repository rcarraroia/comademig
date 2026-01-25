// Debug do teste específico
const customMemberTypes = [
  {
    id: 'custom-1',
    name: 'Pastor Titular'
  },
  {
    id: 'custom-2', 
    name: 'Pastor Auxiliar'
  },
  {
    id: 'custom-3',
    name: 'Diácono Permanente'
  },
  {
    id: 'custom-4',
    name: 'Ministro Extraordinário'
  },
  {
    id: 'custom-5',
    name: 'Coordenador de Pastoral'
  }
];

function mapToPaymentFirstFlow(type) {
  const name = type.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  console.log(`Testando: "${type.name}" -> normalizado: "${name}"`);
  
  // Correspondências exatas primeiro (mais específicas)
  if (name === 'ministro extraordinario') {
    console.log('  ✅ Correspondência exata: ministro extraordinario -> membro');
    return 'membro';
  }
  
  // Correspondências por inclusão
  if (name.includes('bispo')) {
    console.log('  ✅ Contém "bispo" -> bispo');
    return 'bispo';
  }
  if (name.includes('pastor')) {
    console.log('  ✅ Contém "pastor" -> pastor');
    return 'pastor';
  }
  if (name.includes('diacono') || name.includes('diácono')) {
    console.log('  ✅ Contém "diacono" -> diacono');
    return 'diacono';
  }
  
  // Catch-all para membro
  console.log('  ✅ Catch-all -> membro');
  return 'membro';
}

const expectedMappings = [
  { type: customMemberTypes[0], expected: 'pastor' }, // Pastor Titular
  { type: customMemberTypes[1], expected: 'pastor' }, // Pastor Auxiliar
  { type: customMemberTypes[2], expected: 'diacono' }, // Diácono Permanente
  { type: customMemberTypes[3], expected: 'membro' }, // Ministro Extraordinário (mapeado como membro)
  { type: customMemberTypes[4], expected: 'membro' } // Coordenador de Pastoral
];

console.log('=== TESTE DE MAPEAMENTO ===\n');

expectedMappings.forEach(({ type, expected }, index) => {
  const result = mapToPaymentFirstFlow(type);
  const status = result === expected ? '✅ PASS' : '❌ FAIL';
  console.log(`${index + 1}. ${status} - "${type.name}": esperado "${expected}", obtido "${result}"\n`);
});
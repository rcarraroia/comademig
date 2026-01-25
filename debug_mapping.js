// Debug do mapeamento de tipos
const MEMBER_TYPE_MAPPINGS = [
  // Bispo - Prioridade alta
  {
    keywords: ['bispo', 'bishop', 'episcopal'],
    paymentFirstFlowType: 'bispo',
    priority: 100
  },
  
  // Pastor - Prioridade alta
  {
    keywords: ['pastor', 'padre', 'reverendo', 'rev.', 'pe.', 'pastor titular', 'pastor auxiliar'],
    paymentFirstFlowType: 'pastor',
    priority: 90
  },
  
  // Diácono - Prioridade média-alta
  {
    keywords: [
      'diacono', 'diácono', 'deacon', 
      'diacono permanente', 'diácono permanente',
      'diacono transitorio', 'diácono transitório',
      'diacono transicional', 'diácono transicional'
    ],
    paymentFirstFlowType: 'diacono',
    priority: 80
  },
  
  // Membro - Prioridade baixa (catch-all)
  {
    keywords: [
      'membro', 'member', 'fiel', 'leigo', 'laico',
      'membro comum', 'membro regular', 'membro ativo',
      'congregado', 'congregante', 'cristao', 'cristão',
      'ministro extraordinario', 'ministro extraordinário',
      'coordenador', 'lider', 'líder'
    ],
    paymentFirstFlowType: 'membro',
    priority: 10
  }
];

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .trim();
}

function calculateMatchScore(normalizedName, mapping) {
  let score = 0;
  console.log(`\nTestando mapping "${mapping.paymentFirstFlowType}" (prioridade ${mapping.priority}):`);

  for (const keyword of mapping.keywords) {
    const normalizedKeyword = normalizeName(keyword);
    
    // Correspondência exata
    if (normalizedName === normalizedKeyword) {
      score += mapping.priority * 2;
      console.log(`  ✅ Correspondência exata: "${normalizedKeyword}" -> +${mapping.priority * 2} (total: ${score})`);
      continue;
    }
    
    // Correspondência por inclusão
    if (normalizedName.includes(normalizedKeyword)) {
      score += mapping.priority;
      console.log(`  ✅ Correspondência por inclusão: "${normalizedKeyword}" -> +${mapping.priority} (total: ${score})`);
      continue;
    }
    
    // Correspondência por palavra
    const nameWords = normalizedName.split(/\s+/);
    const keywordWords = normalizedKeyword.split(/\s+/);
    
    for (const nameWord of nameWords) {
      for (const keywordWord of keywordWords) {
        if (nameWord === keywordWord) {
          score += mapping.priority * 0.5;
          console.log(`  ✅ Correspondência por palavra: "${nameWord}" = "${keywordWord}" -> +${mapping.priority * 0.5} (total: ${score})`);
        }
      }
    }
  }

  console.log(`  Score final: ${score}`);
  return score;
}

function mapToPaymentFirstFlow(memberTypeName) {
  console.log(`🔄 Mapeando tipo de membro: "${memberTypeName}"`);
  
  // Normalizar nome para comparação
  const normalized = normalizeName(memberTypeName);
  console.log(`Normalizado: "${normalized}"`);
  
  // Encontrar melhor correspondência
  let bestMatch = null;
  let bestScore = 0;
  
  for (const mapping of MEMBER_TYPE_MAPPINGS) {
    const score = calculateMatchScore(normalized, mapping);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping;
      console.log(`🏆 Nova melhor correspondência: "${mapping.paymentFirstFlowType}" com score ${score}`);
    }
  }
  
  const result = bestMatch?.paymentFirstFlowType || 'membro';
  
  console.log(`\n✅ Resultado final: "${memberTypeName}" → "${result}" (score: ${bestScore})`);
  
  return result;
}

// Testar "Ministro Extraordinário"
mapToPaymentFirstFlow('Ministro Extraordinário');
// ============================================================
// SPITZ LINEAGE MANAGER v2.2 - CENTRALIZADO
// Genética, Estado, UI e Pedigree em um único arquivo
// ============================================================

// ============================================================
// SEÇÃO 1: ESTADO GLOBAL E PERSISTÊNCIA
// ============================================================

const state = {
  allDogs: [],
  myDogs: [],
  externalDogs: [],
  father: null,
  mother: null,
  simulationResults: [],
  editingDogId: null,
  selectedFatherDogId: null,
  selectedMotherDogId: null,
  appVersion: '2.2',
  schemaVersion: 2,
  provenColorsOptions: [
    'preto',
    'chocolate',
    'laranja',
    'creme',
    'branco',
    'beaver',
    'merle',
    'tan_points',
    'particolor',
    'tricolor',
    'chocolate_tan',
    'irish_setter'
  ]
};

/**
 * Carrega dados do localStorage
 */
function loadDatabase() {
  try {
    const saved = localStorage.getItem('spitzDatabase');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      if (parsed.schemaVersion !== state.schemaVersion) {
        console.warn(`⚠️ Schema mismatch. Migrando de v${parsed.schemaVersion} para v${state.schemaVersion}`);
      }

      state.allDogs = parsed.allDogs || [];
      updateComputedArrays();
      console.log('✅ Database carregado:', state.allDogs.length, 'cães');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar database:', error);
  }
  return false;
}

/**
 * Salva dados no localStorage
 */
function saveDatabase() {
  try {
    const dataToSave = {
      version: state.appVersion,
      schemaVersion: state.schemaVersion,
      lastSaved: new Date().toISOString(),
      allDogs: state.allDogs
    };
    localStorage.setItem('spitzDatabase', JSON.stringify(dataToSave));
    updateComputedArrays();
    console.log('✅ Database salvo');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar database:', error);
    return false;
  }
}

/**
 * Atualiza arrays computados
 */
function updateComputedArrays() {
  state.myDogs = state.allDogs.filter(dog => dog.belongsToMe !== false);
  state.externalDogs = state.allDogs.filter(dog => dog.belongsToMe === false);
}

/**
 * Busca um cão pelo ID
 */
function getDogById(dogId) {
  return state.allDogs.find(d => d.id === dogId);
}

/**
 * Busca cães por critério
 */
function searchDogs(criteria = {}) {
  return state.allDogs.filter(dog => {
    if (criteria.sex && dog.sex !== criteria.sex) return false;
    if (criteria.belongsToMe !== undefined && dog.belongsToMe !== criteria.belongsToMe) return false;
    if (criteria.nameIncludes && !dog.name.toLowerCase().includes(criteria.nameIncludes.toLowerCase())) return false;
    return true;
  });
}

/**
 * CORRIGIDO v2.2: Adiciona ou atualiza um cão com proteção de dados
 * Evita sobrescrever campos existentes com valores vazios
 */
function upsertDog(dog) {
  const existingIndex = state.allDogs.findIndex(d => d.id === dog.id);
  
  if (existingIndex >= 0) {
    // Ao atualizar, preserva campos existentes se os novos estiverem vazios
    const existingDog = state.allDogs[existingIndex];
    const mergedDog = {};
    
    // Copia todos os campos do cão existente
    Object.keys(existingDog).forEach(key => {
      mergedDog[key] = existingDog[key];
    });
    
    // Sobrescreve apenas com campos do novo cão que NÃO estão vazios
    Object.keys(dog).forEach(key => {
      const value = dog[key];
      // Considera vazio: null, undefined, string vazia, array vazio
      const isEmpty = value === null || 
                      value === undefined || 
                      value === '' || 
                      (Array.isArray(value) && value.length === 0);
      
      if (!isEmpty) {
        mergedDog[key] = value;
      }
    });
    
    state.allDogs[existingIndex] = mergedDog;
    console.log(`✅ Cão ${mergedDog.name} atualizado (campos vazios preservados)`);
  } else {
    state.allDogs.push(dog);
    console.log(`✅ Novo cão ${dog.name} criado`);
  }
  
  saveDatabase();
  return dog;
}

/**
 * Remove um cão
 */
function removeDog(dogId) {
  state.allDogs = state.allDogs.filter(d => d.id !== dogId);
  saveDatabase();
}

/**
 * Exporta dados para JSON
 */
function exportDatabaseAsJSON() {
  const dataStr = JSON.stringify({
    version: state.appVersion,
    schemaVersion: state.schemaVersion,
    exportedAt: new Date().toISOString(),
    allDogs: state.allDogs
  }, null, 2);
  
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `spitz-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa dados de JSON
 */
function importDatabaseFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        state.allDogs = imported.allDogs || [];
        saveDatabase();
        resolve(state.allDogs.length);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ============================================================
// SEÇÃO 2: BANCO DE DADOS GENÉTICO
// ============================================================

const geneticsDB = {
  loci: {
    Locus_A: {
      nome: "Agouti",
      alelos: [
        { simbolo: "Ay", nome: "Sable", dominancia: 1 },
        { simbolo: "Aw", nome: "Wolf Sable", dominancia: 2 },
        { simbolo: "at", nome: "Tan Points", dominancia: 3 },
        { simbolo: "a", nome: "Preto Recessivo", dominancia: 4 }
      ]
    },
    Locus_K: {
      nome: "Dominant Black",
      alelos: [
        { simbolo: "K", nome: "Preto Sólido", dominancia: 1 },
        { simbolo: "Kbr", nome: "Tigrado", dominancia: 2 },
        { simbolo: "k", nome: "Não-Preto (Agouti)", dominancia: 3 }
      ]
    },
    Locus_E: {
      nome: "Extension",
      alelos: [
        { simbolo: "Em", nome: "Máscara Negra", dominancia: 1 },
        { simbolo: "E", nome: "Extensão Normal", dominancia: 2 },
        { simbolo: "e", nome: "Recessivo Vermelho", dominancia: 3 }
      ]
    },
    Locus_B: {
      nome: "Brown",
      alelos: [
        { simbolo: "B", nome: "Preto", dominancia: 1 },
        { simbolo: "b", nome: "Chocolate", dominancia: 2 }
      ]
    },
    Locus_D: {
      nome: "Dilution",
      alelos: [
        { simbolo: "D", nome: "Cor Densa", dominancia: 1 },
        { simbolo: "d", nome: "Diluído", dominancia: 2 }
      ]
    },
    Locus_I: {
      nome: "Intensidade",
      tipo: "Dominância Incompleta",
      alelos: [
        { simbolo: "I", nome: "Intenso", dominancia: 1 },
        { simbolo: "i", nome: "Diluído", dominancia: 2 }
      ]
    },
    Locus_M: {
      nome: "Merle",
      alelos: [
        { simbolo: "Mh", nome: "Harlequin Merle", dominancia: 1 },
        { simbolo: "M", nome: "Merle Padrão", dominancia: 2 },
        { simbolo: "Mc", nome: "Merle Cripto", dominancia: 3 },
        { simbolo: "m", nome: "Não-Merle", dominancia: 4 }
      ]
    },
    Locus_S: {
      nome: "Spotting",
      alelos: [
        { simbolo: "S", nome: "Sólido", dominancia: 1 },
        { simbolo: "si", nome: "Irlandês", dominancia: 2 },
        { simbolo: "sp", nome: "Piebald", dominancia: 3 },
        { simbolo: "sw", nome: "Branco Extremo", dominancia: 4 }
      ]
    },
    Locus_T: {
      nome: "Ticking",
      alelos: [
        { simbolo: "T", nome: "Com sardas", dominancia: 1 },
        { simbolo: "t", nome: "Sem pintas", dominancia: 2 }
      ]
    }
  }
};

// ============================================================
// SEÇÃO 3: MOTOR GENÉTICO - INFERÊNCIA DE GENÓTIPO
// ============================================================

/**
 * CORRIGIDO v2.2: Inferência de genótipo BASE com proteção do Locus A
 * Respeita a observação visual do criador sobre Tan Points vs Sable
 */
function inferGenotype(characteristics) {
  const genotype = {
    Locus_A: ['a', 'a'],
    Locus_K: ['k', 'k'],
    Locus_E: ['E', 'E'],
    Locus_B: ['B', 'B'],
    Locus_D: ['D', 'D'],
    Locus_I: ['I', 'I'],
    Locus_M: ['m', 'm'],
    Locus_S: ['S', 'S'],
    Locus_T: ['T', 't']
  };

  // Cor Base
  switch (characteristics.baseColor) {
    case 'preto':
      genotype.Locus_K = ['K', 'k'];
      genotype.Locus_B = ['B', 'B'];
      genotype.Locus_E = ['E', 'E'];
      break;
    case 'chocolate':
      genotype.Locus_K = ['k', 'k'];
      genotype.Locus_B = ['b', 'b'];
      genotype.Locus_E = ['E', 'E'];
      break;
    case 'laranja':
      genotype.Locus_K = ['k', 'k'];
      genotype.Locus_B = ['B', 'B'];
      genotype.Locus_E = ['E', 'E'];
      break;
    case 'creme':
      genotype.Locus_E = ['e', 'e'];
      genotype.Locus_I = ['i', 'i'];
      genotype.Locus_K = ['k', 'k'];
      break;
    case 'branco':
      genotype.Locus_E = ['e', 'e'];
      genotype.Locus_I = ['i', 'i'];
      genotype.Locus_K = ['k', 'k'];
      break;
    case 'wolf_sable':
      genotype.Locus_K = ['k', 'k'];
      genotype.Locus_A = ['Aw', 'Aw'];
      genotype.Locus_E = ['E', 'E'];
      break;
  }

  // Diluição
  genotype.Locus_D = characteristics.dilution === 'diluida' ? ['d', 'd'] : ['D', 'D'];

  // ============================================================
  // LOCI INDEPENDENTES: Tan Points (A) e Particolor (S)
  // PRIORIDADE: Observação Visual do Criador > Pedigree
  // ============================================================
  
  const hasTanPoints = characteristics.marking === 'tan_points' || 
                       characteristics.marking === 'tricolor' ||
                       (characteristics.marking === 'black_tan') ||
                       (characteristics.marking === 'chocolate_tan');
  
  const hasParticolor = characteristics.marking === 'particolor' || 
                        characteristics.marking === 'tricolor' ||
                        characteristics.marking === 'irish_setter' ||
                        characteristics.marking === 'branco_extremo';

  // LOCUS A: Tan Points (com proteção de observação visual)
  // CORRIGIDO v2.2: Se o criador marcou Tan Points visualmente, 
  // respeita isso mesmo que o pedigree sugira Sable
  if (hasTanPoints) {
    genotype.Locus_A = ['at', 'at'];  // Força Tan Points conforme observação
    console.log('🔥 Tan Points detectado via fenótipo → Locus A: at/at');
  } else if (characteristics.marking === 'sable') {
    genotype.Locus_A = ['Ay', 'Ay'];
  } else if (characteristics.marking === 'solido') {
    // Para sólido, não força Sable se não houver indicação
    genotype.Locus_A = ['Ay', 'Ay'];
  }

  // LOCUS S: Spotting (Particolor, Manchas Brancas)
  if (hasParticolor) {
    if (characteristics.marking === 'tricolor') {
      genotype.Locus_S = ['sp', 'sp'];
    } else if (characteristics.marking === 'irish_setter') {
      genotype.Locus_S = ['si', 'si'];
    } else if (characteristics.marking === 'branco_extremo') {
      genotype.Locus_S = ['sw', 'sw'];
    } else if (characteristics.marking === 'particolor') {
      genotype.Locus_S = ['sp', 'sp'];
    }
  } else if (characteristics.marking === 'irlandesa') {
    genotype.Locus_S = ['si', 'si'];
  } else if (characteristics.marking === 'branco_extremo') {
    genotype.Locus_S = ['sw', 'sw'];
  } else {
    genotype.Locus_S = ['S', 'S'];  // Sólido
  }

  // Máscara
  if (characteristics.mask === 'mascara_negra') {
    genotype.Locus_E = ['Em', 'Em'];
  }

  // Intensidade
  switch (characteristics.intensity) {
    case 'vermelho_intenso':
      genotype.Locus_I = ['I', 'I'];
      break;
    case 'laranja_padrao':
      genotype.Locus_I = ['I', 'i'];
      break;
    case 'creme_branco':
      genotype.Locus_I = ['i', 'i'];
      break;
  }

  // Merle
  switch (characteristics.merle) {
    case 'nao':
      genotype.Locus_M = ['m', 'm'];
      break;
    case 'merle':
      genotype.Locus_M = ['M', 'm'];
      break;
    case 'harlequin':
      genotype.Locus_M = ['Mh', 'm'];
      break;
    case 'oculto':
      genotype.Locus_M = ['Mc', 'm'];
      break;
  }

  // Trufa
  switch (characteristics.nose) {
    case 'preta':
      genotype.Locus_B = ['B', 'B'];
      genotype.Locus_D = ['D', 'D'];
      break;
    case 'marrom':
      genotype.Locus_B = ['b', 'b'];
      break;
    case 'azul':
      genotype.Locus_B = ['B', 'B'];
      genotype.Locus_D = ['d', 'd'];
      break;
    case 'lilas_beaver':
      genotype.Locus_B = ['b', 'b'];
      genotype.Locus_D = ['d', 'd'];
      break;
  }

  // Pintas
  genotype.Locus_T = characteristics.ticking === 'com_pintas' ? ['T', 't'] : ['t', 't'];

  return genotype;
}

// ============================================================
// SEÇÃO 3B: VALIDADOR DE PEDIGREE (NOVO v2.2)
// Previne recursividade infinita
// ============================================================

/**
 * NOVO v2.2: Valida se há referências circulares na árvore genealógica
 * Retorna true se a árvore é válida, false se houver ciclo
 */
function validatePedigreeAcyclicity(dog, visited = new Set(), depth = 0) {
  // Limita profundidade para evitar stack overflow
  const MAX_DEPTH = 20;
  if (depth > MAX_DEPTH) {
    console.warn(`⚠️ Árvore genealógica excedeu profundidade máxima (${MAX_DEPTH})`);
    return false;
  }

  // Se o ID já foi visitado, há um ciclo
  if (visited.has(dog.id)) {
    console.error(`❌ CICLO DETECTADO! ${dog.name} aparece múltiplas vezes na árvore`);
    return false;
  }

  // Marca como visitado
  const newVisited = new Set(visited);
  newVisited.add(dog.id);

  // Valida pai
  if (dog.fatherDogId) {
    const father = getDogById(dog.fatherDogId);
    if (father) {
      if (!validatePedigreeAcyclicity(father, newVisited, depth + 1)) {
        return false;
      }
    }
  }

  // Valida mãe
  if (dog.motherDogId) {
    const mother = getDogById(dog.motherDogId);
    if (mother) {
      if (!validatePedigreeAcyclicity(mother, newVisited, depth + 1)) {
        return false;
      }
    }
  }

  return true;
}

// ============================================================
// SEÇÃO 3C: FUNÇÕES AUXILIARES DE BUSCA NO PEDIGREE
// ============================================================

function checkChocolateInPedigree(dog) {
  if (!dog) return false;
  if (dog.baseColor === 'chocolate') return true;
  if (dog.genotype?.Locus_B?.includes('b')) return true;

  const father = dog.fatherDogId ? getDogById(dog.fatherDogId) : null;
  const mother = dog.motherDogId ? getDogById(dog.motherDogId) : null;

  return checkChocolateInPedigree(father) || checkChocolateInPedigree(mother);
}

function checkDilutionInPedigree(dog) {
  if (!dog) return false;
  if (dog.dilution === 'diluida') return true;
  if (dog.genotype?.Locus_D?.includes('d')) return true;

  const father = dog.fatherDogId ? getDogById(dog.fatherDogId) : null;
  const mother = dog.motherDogId ? getDogById(dog.motherDogId) : null;

  return checkDilutionInPedigree(father) || checkDilutionInPedigree(mother);
}

function checkCreamInPedigree(dog) {
  if (!dog) return false;
  if (dog.baseColor === 'creme' || dog.baseColor === 'branco') return true;
  if (dog.genotype?.Locus_E?.includes('e')) return true;

  const father = dog.fatherDogId ? getDogById(dog.fatherDogId) : null;
  const mother = dog.motherDogId ? getDogById(dog.motherDogId) : null;

  return checkCreamInPedigree(father) || checkCreamInPedigree(mother);
}

// ============================================================
// SEÇÃO 3D: MOTOR GENÉTICO - INFERÊNCIA COM PEDIGREE + HISTÓRICO
// ============================================================

/**
 * FUNÇÃO PRINCIPAL: Inferência com Pedigree + Histórico de Cores
 * PRIORIDADE: Histórico de Cores > Pedigree > Fenótipo
 */
function inferGenotypeWithPedigreeAndProvenColors(
  characteristics,
  fatherId = null,
  motherId = null,
  provenColors = []
) {
  let genotype = inferGenotype(characteristics);

  const father = fatherId ? getDogById(fatherId) : null;
  const mother = motherId ? getDogById(motherId) : null;

  // ===== PRIORIDADE 1: HISTÓRICO DE CORES =====
  if (provenColors && provenColors.length > 0) {
    console.log(`🧬 Ajustando genótipo via Histórico de Cores:`, provenColors);

    if (provenColors.includes('chocolate') && characteristics.baseColor !== 'chocolate') {
      genotype.Locus_B = ['B', 'b'];
      console.log('  ✓ Produziu Chocolate → Genótipo: B/b');
    }

    if (provenColors.includes('beaver') && characteristics.baseColor !== 'chocolate') {
      genotype.Locus_B = ['B', 'b'];
      genotype.Locus_D = ['D', 'd'];
      console.log('  ✓ Produziu Beaver → Genótipo: B/b, D/d');
    }

    if ((provenColors.includes('creme') || provenColors.includes('branco')) && 
        characteristics.baseColor !== 'creme' && characteristics.baseColor !== 'branco') {
      genotype.Locus_E = ['E', 'e'];
      console.log('  ✓ Produziu Creme/Branco → Genótipo: E/e');
    }

    if (provenColors.includes('merle') && characteristics.merle === 'nao') {
      genotype.Locus_M = ['M', 'm'];
      console.log('  ✓ Produziu Merle → Genótipo: M/m');
    }

    if (provenColors.includes('tan_points') && characteristics.marking !== 'tan_points' && characteristics.marking !== 'tricolor') {
      genotype.Locus_A = ['Ay', 'at'];
      console.log('  ✓ Produziu Tan Points → Genótipo Locus A: Ay/at');
    }

    if (provenColors.includes('particolor') && 
        characteristics.marking !== 'particolor' && 
        characteristics.marking !== 'tricolor' &&
        characteristics.marking !== 'irlandesa') {
      genotype.Locus_S = ['sp', 'S'];
      console.log('  ✓ Produziu Particolor → Genótipo Locus S: sp/S');
    }

    if (provenColors.includes('tricolor')) {
      genotype.Locus_A = ['at', 'at'];
      genotype.Locus_S = ['sp', 'sp'];
      console.log('  ✓ Produziu Tricolor → Genótipo Locus A: at/at, Locus S: sp/sp');
    }

    if (provenColors.includes('chocolate_tan')) {
      genotype.Locus_B = ['b', 'b'];
      genotype.Locus_A = ['at', 'at'];
      console.log('  ✓ Produziu Chocolate Tan → Genótipo: B/b, Locus A: at/at');
    }

    return genotype;
  }

  // ===== PRIORIDADE 2: PEDIGREE =====
  if (father || mother) {
    console.log(`🧬 Ajustando genótipo via Pedigree`);

    if (checkChocolateInPedigree(father) || checkChocolateInPedigree(mother)) {
      if (characteristics.baseColor !== 'chocolate') {
        genotype.Locus_B = ['B', 'b'];
        console.log('  ✓ Ancestral Chocolate detectado → Genótipo: B/b');
      }
    }

    if (checkDilutionInPedigree(father) || checkDilutionInPedigree(mother)) {
      if (characteristics.dilution === 'densa') {
        genotype.Locus_D = ['D', 'd'];
        console.log('  ✓ Ancestral Diluído detectado → Genótipo: D/d');
      }
    }

    if (checkCreamInPedigree(father) || checkCreamInPedigree(mother)) {
      if (characteristics.baseColor !== 'creme' && characteristics.baseColor !== 'branco') {
        genotype.Locus_E = ['E', 'e'];
        console.log('  ✓ Ancestral Creme detectado → Genótipo: E/e');
      }
    }
  }

  return genotype;
}

// ============================================================
// SEÇÃO 3E: FENÓTIPO, SAÚDE E FORMATAÇÃO
// ============================================================

/**
 * Converte genótipo para fenótipo visual
 */
function genotypeToPhenotype(genotype) {
  const phenotype = {};

  const K = genotype.Locus_K;
  const B = genotype.Locus_B;
  const E = genotype.Locus_E;
  const D = genotype.Locus_D;
  const I = genotype.Locus_I;
  const A = genotype.Locus_A;
  const S = genotype.Locus_S;
  const M = genotype.Locus_M;
  const T = genotype.Locus_T;

  const isEpistatic = E[0] === 'e' && E[1] === 'e';
  
  // ===== COR BASE =====
  if (isEpistatic) {
    phenotype.baseColor = 'Vermelho/Creme (Epistático ee)';
  } else if (K[0] === 'K' || K[1] === 'K') {
    if (B[0] === 'b' && B[1] === 'b') {
      phenotype.baseColor = 'Chocolate';
    } else {
      phenotype.baseColor = 'Preto';
    }
  } else {
    if (B[0] === 'b' && B[1] === 'b') {
      phenotype.baseColor = 'Chocolate Agouti';
    } else {
      if (A[0] === 'Ay' || A[1] === 'Ay') {
        phenotype.baseColor = 'Sable (Agouti)';
      } else if (A[0] === 'Aw' || A[1] === 'Aw') {
        phenotype.baseColor = 'Wolf Sable';
      } else if (A[0] === 'at' || A[1] === 'at') {
        phenotype.baseColor = 'Laranja/Agouti';
      } else {
        phenotype.baseColor = 'Laranja/Agouti';
      }
    }
  }

  phenotype.dilution = (D[0] === 'd' && D[1] === 'd') 
    ? 'Diluída (Azul/Lilac)' 
    : 'Densa';

  const hasWarmColors = !isEpistatic && (K[0] === 'k' && K[1] === 'k');
  
  if (hasWarmColors && (E[0] === 'Em' || E[1] === 'Em')) {
    phenotype.mask = 'Com Máscara Negra';
  } else if (hasWarmColors) {
    phenotype.mask = 'Sem Máscara';
  } else {
    phenotype.mask = 'N/A (Cor Escura)';
  }

  if (isEpistatic || (K[0] === 'K' || K[1] === 'K')) {
    if (I[0] === 'I' && I[1] === 'I') {
      phenotype.intensity = 'N/A - Portador: Vermelho Intenso (II)';
    } else if ((I[0] === 'I' && I[1] === 'i') || (I[0] === 'i' && I[1] === 'I')) {
      phenotype.intensity = 'N/A - Portador: Laranja Padrão (Ii)';
    } else {
      phenotype.intensity = 'N/A - Portador: Creme/Branco (ii)';
    }
  } else {
    if (I[0] === 'I' && I[1] === 'I') {
      phenotype.intensity = 'Vermelho Intenso (II)';
    } else if ((I[0] === 'I' && I[1] === 'i') || (I[0] === 'i' && I[1] === 'I')) {
      phenotype.intensity = 'Laranja Padrão (Ii)';
    } else {
      phenotype.intensity = 'Creme/Branco (ii)';
    }
  }

  // ===== MARCAÇÕES: LOCI INDEPENDENTES (TAN POINTS + PARTICOLOR) =====
  const hasTanPoints = A[0] === 'at' || A[1] === 'at';
  const hasParticolor = S.includes('sp');
  const hasIrish = S.includes('si');
  const hasExtremeWhite = S[0] === 'sw' && S[1] === 'sw';
  
  if (hasTanPoints && hasParticolor) {
    phenotype.marking = 'Tricolor (Tan Points + Particolor)';
  } else if (hasTanPoints && hasIrish) {
    phenotype.marking = 'Tricolor (Tan Points + Irish)';
  } else if (hasTanPoints && (S[0] === 'S' && S[1] === 'S')) {
    phenotype.marking = 'Tan Points';
  } else if (!hasTanPoints && hasParticolor) {
    phenotype.marking = 'Particolor (Piebald)';
  } else if (!hasTanPoints && hasIrish) {
    phenotype.marking = 'Mancha Irlandesa';
  } else if (hasExtremeWhite) {
    phenotype.marking = 'Branco Extremo';
  } else if (S[0] === 'S' && S[1] === 'S') {
    phenotype.marking = 'Sólido';
  } else {
    phenotype.marking = 'Misto';
  }

  // ===== MERLE =====
  if (M[0] === 'm' && M[1] === 'm') {
    phenotype.merle = 'Sem Merle';
  } else if (M.includes('Mh')) {
    phenotype.merle = 'Harlequin Merle';
  } else if (M.includes('M')) {
    phenotype.merle = 'Merle Padrão';
  } else if (M.includes('Mc')) {
    phenotype.merle = 'Merle Cripto';
  }

  // ===== TICKING =====
  const hasWhiteMarkings = !S.every(s => s === 'S');
  
  if (!hasWhiteMarkings) {
    phenotype.ticking = 'N/A (Invisível)';
  } else {
    phenotype.ticking = (T[0] === 'T' || T[1] === 'T')
      ? 'Com Pintas/Sardas'
      : 'Sem Pintas';
  }

  // ===== TRUFA =====
  if (B[0] === 'b' && B[1] === 'b') {
    if (D[0] === 'd' && D[1] === 'd') {
      phenotype.nose = 'Lilás/Beaver';
    } else {
      phenotype.nose = 'Marrom';
    }
  } else {
    if (D[0] === 'd' && D[1] === 'd') {
      phenotype.nose = 'Azul (Cinza)';
    } else {
      phenotype.nose = 'Preta';
    }
  }

  return phenotype;
}

/**
 * Formata genótipo para exibição
 */
function formatGenotype(genotype) {
  const loci = Object.keys(genotype);
  return loci
    .map(locus => `${locus}: ${genotype[locus][0]}/${genotype[locus][1]}`)
    .join(' | ');
}

/**
 * Verifica alertas de saúde genética
 */
function checkHealthAlerts(genotype) {
  const alerts = [];

  const M = genotype.Locus_M;
  const D = genotype.Locus_D;

  const merleCount = M.filter(a => a !== 'm').length;
  if (merleCount === 2) {
    alerts.push({
      risk: 'Double Merle (MM ou variante dupla)',
      consequence: 'Cegueira, Sordez, Microftalmia - ALTO RISCO GENÉTICO',
      severity: 'CRÍTICA',
      icon: '🚨'
    });
  }

  if (D[0] === 'd' && D[1] === 'd') {
    alerts.push({
      risk: 'Alopecia por Diluição (dd)',
      consequence: 'Queda de pelo crônica, displasia folicular',
      severity: 'Média',
      icon: '⚠️'
    });
  }

  return alerts;
}

/**
 * Gera informações de "Portador de..."
 */
function getCarrierStatus(genotype, baseColor, dilution) {
  const carriers = [];

  if (genotype.Locus_B.includes('b') && baseColor !== 'chocolate') {
    carriers.push('Portador de Chocolate');
  }

  if (genotype.Locus_D.includes('d') && dilution !== 'diluida') {
    carriers.push('Portador de Diluição (Azul/Lilac)');
  }

  if (genotype.Locus_E.includes('e') && baseColor !== 'creme' && baseColor !== 'branco') {
    carriers.push('Portador de Creme/Branco');
  }

  if (genotype.Locus_M.some(a => a !== 'm') && genotype.Locus_M[0] === 'm') {
    carriers.push('Portador de Merle');
  }

  if ((genotype.Locus_A[0] === 'at' || genotype.Locus_A[1] === 'at') && 
      !(genotype.Locus_A[0] === 'at' && genotype.Locus_A[1] === 'at')) {
    carriers.push('Portador de Tan Points');
  }

  if ((genotype.Locus_S[0] === 'sp' || genotype.Locus_S[1] === 'sp') && 
      !(genotype.Locus_S[0] === 'sp' && genotype.Locus_S[1] === 'sp')) {
    carriers.push('Portador de Particolor');
  }

  return carriers;
}

// ============================================================
// SEÇÃO 4: SIMULADOR GENÉTICO
// ============================================================

/**
 * Obtém probabilidades do Quadrado de Punnett
 */
function getLocusProbabilities(parent1Alleles, parent2Alleles) {
  const outcomes = [];
  parent1Alleles.forEach(a1 => {
    parent2Alleles.forEach(a2 => {
      outcomes.push([a1, a2]);
    });
  });
  return outcomes;
}

/**
 * Gera prole com probabilidades
 */
function generateOffspringWithProbabilities(father, mother, count = 20) {
  const loci = Object.keys(father.genotype);
  const offspring = [];

  const allCombinations = [];
  
  for (let locusIdx = 0; locusIdx < loci.length; locusIdx++) {
    const locus = loci[locusIdx];
    const fatherAlleles = father.genotype[locus];
    const motherAlleles = mother.genotype[locus];
    
    const possibilities = getLocusProbabilities(fatherAlleles, motherAlleles);
    allCombinations.push(possibilities);
  }

  for (let i = 0; i < count; i++) {
    const genotype = {};
    
    loci.forEach((locus, locusIdx) => {
      const possibilities = allCombinations[locusIdx];
      const randomCombination = possibilities[Math.floor(Math.random() * possibilities.length)];
      genotype[locus] = randomCombination;
    });

    offspring.push({
      genotype: genotype,
      sex: Math.random() > 0.5 ? 'M' : 'F'
    });
  }

  return offspring;
}

// ============================================================
// SEÇÃO 5: PEDIGREE - ÁRVORE GENEALÓGICA
// ============================================================

/**
 * CORRIGIDO v2.2: Constrói árvore genealógica com validação de ciclos
 */
function buildPedigreeTree(dog, depth = 0, maxDepth = 10, visited = new Set()) {
  if (depth > maxDepth || !dog) {
    return null;
  }

  // Valida ciclo
  if (visited.has(dog.id)) {
    console.warn(`⚠️ Ciclo detectado em ${dog.name}`);
    return null;
  }

  const newVisited = new Set(visited);
  newVisited.add(dog.id);

  const father = dog.fatherDogId ? getDogById(dog.fatherDogId) : null;
  const mother = dog.motherDogId ? getDogById(dog.motherDogId) : null;

  return {
    id: dog.id,
    name: dog.name,
    baseColor: dog.baseColor,
    sex: dog.sex,
    genotype: dog.genotype,
    fatherName: dog.fatherName,
    motherName: dog.motherName,
    father: father ? buildPedigreeTree(father, depth + 1, maxDepth, newVisited) : null,
    mother: mother ? buildPedigreeTree(mother, depth + 1, maxDepth, newVisited) : null,
    depth: depth
  };
}

/**
 * Renderiza HTML da árvore genealógica
 */
function renderPedigreeTree(node, parentX = 0, depth = 0) {
  if (!node) return '';

  const baseSpacing = 280;
  const spacing = baseSpacing - (depth * 20);
  const levelHeight = 140;

  let html = '';

  if (node.father) {
    const fatherX = parentX - spacing / 2;
    const fatherY = (node.depth + 1) * levelHeight;

    html += `
      <div class="tree-node father-node" style="--x: ${fatherX}px; --y: ${fatherY}px;">
        <div class="node-content">
          <strong>${node.father.name}</strong><br>
          <small>${node.father.baseColor}</small><br>
          <small>${node.father.sex === 'M' ? '♂' : '♀'}</small>
        </div>
        <button class="btn-expand" onclick="showTreeModal('${node.father.id}')" title="Ver árvore completa">↗️</button>
      </div>
      <div class="tree-line-connector" style="--from-x: ${parentX}px; --from-y: 0px; --to-x: ${fatherX}px; --to-y: ${fatherY}px;"></div>
    `;

    html += renderPedigreeTree(node.father, fatherX, depth + 1);
  }

  if (node.mother) {
    const motherX = parentX + spacing / 2;
    const motherY = (node.depth + 1) * levelHeight;

    html += `
      <div class="tree-node mother-node" style="--x: ${motherX}px; --y: ${motherY}px;">
        <div class="node-content">
          <strong>${node.mother.name}</strong><br>
          <small>${node.mother.baseColor}</small><br>
          <small>${node.mother.sex === 'M' ? '♂' : '♀'}</small>
        </div>
        <button class="btn-expand" onclick="showTreeModal('${node.mother.id}')" title="Ver árvore completa">↗️</button>
      </div>
      <div class="tree-line-connector" style="--from-x: ${parentX}px; --from-y: 0px; --to-x: ${motherX}px; --to-y: ${motherY}px;"></div>
    `;

    html += renderPedigreeTree(node.mother, motherX, depth + 1);
  }

  return html;
}

/**
 * Busca de cães para autocomplete
 */
function searchDogsByNameAndSex(query, sex) {
  if (query.length < 1) return [];
  
  const lowerQuery = query.toLowerCase();
  return state.allDogs.filter(dog => 
    dog.sex === sex && 
    dog.name.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}

/**
 * Auto-preenche dados dos ancestrais
 */
function autoFillAncestorsInfo(dogId) {
  const dog = getDogById(dogId);
  if (!dog) return null;

  const ancestors = {
    direct: dog,
    parents: {
      father: dog.fatherDogId ? getDogById(dog.fatherDogId) : null,
      mother: dog.motherDogId ? getDogById(dog.motherDogId) : null
    },
    grandparents: {
      paternal: {
        grandfather: null,
        grandmother: null
      },
      maternal: {
        grandfather: null,
        grandmother: null
      }
    }
  };

  if (ancestors.parents.father) {
    const f = ancestors.parents.father;
    ancestors.grandparents.paternal.grandfather = f.fatherDogId ? getDogById(f.fatherDogId) : null;
    ancestors.grandparents.paternal.grandmother = f.motherDogId ? getDogById(f.motherDogId) : null;
  }

  if (ancestors.parents.mother) {
    const m = ancestors.parents.mother;
    ancestors.grandparents.maternal.grandfather = m.fatherDogId ? getDogById(m.fatherDogId) : null;
    ancestors.grandparents.maternal.grandmother = m.motherDogId ? getDogById(m.motherDogId) : null;
  }

  return ancestors;
}

/**
 * Valida pedigree
 */
function validatePedigree(dog) {
  const issues = [];

  const father = dog.fatherDogId ? getDogById(dog.fatherDogId) : null;
  const mother = dog.motherDogId ? getDogById(dog.motherDogId) : null;

  if (father && father.sex !== 'M') {
    issues.push('Pai não é macho');
  }

  if (mother && mother.sex !== 'F') {
    issues.push('Mãe não é fêmea');
  }

  if (father && dog.registeredDate && father.registeredDate > dog.registeredDate) {
    issues.push('Pai registrado DEPOIS do filho');
  }

  if (mother && dog.registeredDate && mother.registeredDate > dog.registeredDate) {
    issues.push('Mãe registrada DEPOIS do filho');
  }

  // NOVO v2.2: Valida ciclos
  if (!validatePedigreeAcyclicity(dog)) {
    issues.push('Ciclo detectado na árvore genealógica!');
  }

  return issues;
}

// ============================================================
// SEÇÃO 6: INTERFACE - CHIPS DE CORES (NOVO v2.2 - Mobile Friendly)
// ============================================================

/**
 * NOVO v2.2: Renderiza checkboxes de cores produzidas em vez de select multiple
 * Solução mobile-friendly sem necessidade de Ctrl
 */
function renderProvenColorsChips() {
  const container = document.getElementById('provenColorsChips');
  if (!container) return;

  const colorLabels = {
    'preto': 'Preto',
    'chocolate': 'Chocolate',
    'laranja': 'Laranja',
    'creme': 'Creme',
    'branco': 'Branco',
    'beaver': 'Beaver',
    'merle': 'Merle',
    'tan_points': 'Tan Points',
    'particolor': 'Particolor',
    'tricolor': 'Tricolor',
    'chocolate_tan': 'Chocolate Tan',
    'irish_setter': 'Irish Setter'
  };

  let html = '<div class="chips-grid">';

  state.provenColorsOptions.forEach(colorValue => {
    const label = colorLabels[colorValue] || colorValue;
    html += `
      <label class="chip-label">
        <input type="checkbox" name="provenColor" value="${colorValue}" class="chip-input">
        <span class="chip-text">${label}</span>
      </label>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * NOVO v2.2: Obtém cores selecionadas dos chips
 */
function getSelectedProvenColors() {
  const checkboxes = document.querySelectorAll('input[name="provenColor"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * NOVO v2.2: Marca chips como selecionados ao editar
 */
function setProvenColorsSelection(provenColors) {
  if (!provenColors || provenColors.length === 0) return;

  const checkboxes = document.querySelectorAll('input[name="provenColor"]');
  checkboxes.forEach(cb => {
    cb.checked = provenColors.includes(cb.value);
  });
}

// ============================================================
// SEÇÃO 7: ATALHOS DE COR (NOVO v2.2)
// ============================================================

/**
 * NOVO v2.2: Aplica atalhos de cor pré-configurados
 */
function applyColorShortcut(shortcut) {
  switch (shortcut) {
    case 'beaver':
      // Beaver: Chocolate + Diluído + Trufa Lilás
      document.getElementById('dogBaseColor').value = 'chocolate';
      document.getElementById('dogDilution').value = 'diluida';
      document.getElementById('dogNose').value = 'lilas_beaver';
      document.getElementById('dogMarking').value = 'solido';
      alert('✓ Configuração Beaver aplicada: Chocolate + Diluído + Trufa Lilás');
      break;

    case 'chocolate_tan':
      // Chocolate Tan: Chocolate + Tan Points + Trufa Marrom
      document.getElementById('dogBaseColor').value = 'chocolate';
      document.getElementById('dogMarking').value = 'tan_points';
      document.getElementById('dogNose').value = 'marrom';
      document.getElementById('dogDilution').value = 'densa';
      alert('✓ Configuração Chocolate Tan aplicada: Chocolate + Tan Points + Trufa Marrom');
      break;

    case 'merle_blue':
      // Blue Merle: Preto + Merle + Diluído
      document.getElementById('dogBaseColor').value = 'preto';
      document.getElementById('dogMerle').value = 'merle';
      document.getElementById('dogDilution').value = 'diluida';
      document.getElementById('dogNose').value = 'azul';
      alert('✓ Configuração Blue Merle aplicada: Preto + Merle + Diluído');
      break;
  }

  updateDogMaskVisibility();
  updateDogIntensityLabel();
  updateMarkingDescription();
}

// ============================================================
// SEÇÃO 8: INTERFACE - PEDIGREE BUILDER ABAS
// ============================================================

function switchPedigreeTab(tabName) {
  document.querySelectorAll('.pedigree-tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.pedigree-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const tabElement = document.getElementById(tabName + 'Tab');
  if (tabElement) {
    tabElement.classList.add('active');
  }
  
  document.querySelector(`[data-pedigree-tab="${tabName}"]`).classList.add('active');
}

function toggleFatherMode(mode) {
  const existingSection = document.getElementById('existingFatherSection');
  const newSection = document.getElementById('newFatherSection');
  
  if (mode === 'existing') {
    existingSection.style.display = 'block';
    newSection.style.display = 'none';
    state.selectedFatherDogId = null;
  } else {
    existingSection.style.display = 'none';
    newSection.style.display = 'block';
  }
}

function toggleMotherMode(mode) {
  const existingSection = document.getElementById('existingMotherSection');
  const newSection = document.getElementById('newMotherSection');
  
  if (mode === 'existing') {
    existingSection.style.display = 'block';
    newSection.style.display = 'none';
    state.selectedMotherDogId = null;
  } else {
    existingSection.style.display = 'none';
    newSection.style.display = 'block';
  }
}

function createNewParent(parentType) {
  const isNameField = parentType === 'father' ? 'newFatherName' : 'newMotherName';
  const isColorField = parentType === 'father' ? 'newFatherColor' : 'newMotherColor';
  
  const name = document.getElementById(isNameField).value.trim();
  const color = document.getElementById(isColorField).value;
  
  if (!name || !color) {
    alert('Por favor, preencha o nome e a cor!');
    return;
  }
  
  const newParent = {
    id: Date.now().toString(),
    name: name,
    sex: parentType === 'father' ? 'M' : 'F',
    baseColor: color,
    coat: 'curta',
    dilution: 'densa',
    marking: 'solido',
    mask: 'sem_mascara',
    intensity: 'laranja_padrao',
    merle: 'nao',
    nose: 'preta',
    ticking: 'sem_pintas',
    belongsToMe: false,
    fatherName: null,
    fatherDogId: null,
    motherName: null,
    motherDogId: null,
    provenColors: [],
    registeredDate: new Date().toISOString(),
    genotype: inferGenotype({
      baseColor: color,
      dilution: 'densa',
      marking: 'solido',
      mask: 'sem_mascara',
      intensity: 'laranja_padrao',
      merle: 'nao',
      nose: 'preta',
      ticking: 'sem_pintas'
    })
  };
  
  upsertDog(newParent);
  
  if (parentType === 'father') {
    state.selectedFatherDogId = newParent.id;
    document.getElementById('dogFatherName').value = newParent.name;
    document.getElementById('fatherDataContainer').style.display = 'block';
    document.getElementById('fatherDataDisplay').textContent = `${newParent.name} - ${newParent.baseColor}`;
  } else {
    state.selectedMotherDogId = newParent.id;
    document.getElementById('dogMotherName').value = newParent.name;
    document.getElementById('motherDataContainer').style.display = 'block';
    document.getElementById('motherDataDisplay').textContent = `${newParent.name} - ${newParent.baseColor}`;
  }
  
  document.getElementById(isNameField).value = '';
  document.getElementById(isColorField).value = '';
  
  alert(`✓ ${newParent.name} criado com sucesso!`);
}

function resetPedigreeBuilder() {
  switchPedigreeTab('puppy');
  
  document.querySelector('input[name="fatherSource"][value="existing"]').checked = true;
  document.querySelector('input[name="motherSource"][value="existing"]').checked = true;
  
  toggleFatherMode('existing');
  toggleMotherMode('existing');
  
  document.getElementById('dogFatherName').value = '';
  document.getElementById('dogMotherName').value = '';
  document.getElementById('fatherDataContainer').style.display = 'none';
  document.getElementById('motherDataContainer').style.display = 'none';
  
  ['grandparentPGF', 'grandparentPGM', 'grandparentMGF', 'grandparentMGM'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['grandparentPGFColor', 'grandparentPGMColor', 'grandparentMGFColor', 'grandparentMGMColor'].forEach(id => {
    document.getElementById(id).value = '';
  });

  // Limpa chips de cores
  setProvenColorsSelection([]);
}

// ============================================================
// SEÇÃO 9: INTERFACE - REGISTRO DE CÃO
// ============================================================

function toggleRegisterDog(dogId = null) {
  const form = document.getElementById('registerDogForm');
  
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    renderProvenColorsChips();
    resetPedigreeBuilder();
    
    if (dogId) {
      state.editingDogId = dogId;
      const dog = getDogById(dogId);
      populateFormWithDog(dog);
    } else {
      state.editingDogId = null;
      document.getElementById('newDogForm').reset();
      document.getElementById('dogId').value = '';
      updateDogMaskVisibility();
      updateDogIntensityLabel();
    }
  } else {
    form.style.display = 'none';
    resetFormUI();
  }
}

function populateFormWithDog(dog) {
  document.getElementById('dogId').value = dog.id;
  document.getElementById('dogName').value = dog.name;
  document.getElementById('dogSex').value = dog.sex;
  document.getElementById('dogCoat').value = dog.coat;
  document.getElementById('dogBaseColor').value = dog.baseColor;
  document.getElementById('dogDilution').value = dog.dilution;
  document.getElementById('dogMarking').value = dog.marking;
  document.getElementById('dogIntensity').value = dog.intensity;
  document.getElementById('dogMerle').value = dog.merle;
  document.getElementById('dogNose').value = dog.nose;
  document.getElementById('dogTicking').value = dog.ticking;
  document.getElementById('dogBelongsToMe').checked = dog.belongsToMe !== false;
  
  if (dog.mask) document.getElementById('dogMask').value = dog.mask;
  
  document.getElementById('dogFatherName').value = dog.fatherName || '';
  document.getElementById('dogMotherName').value = dog.motherName || '';
  
  // NOVO v2.2: Seleciona chips de cores produzidas
  setProvenColorsSelection(dog.provenColors);

  updateDogMaskVisibility();
  updateDogIntensityLabel();
  updateMarkingDescription();
}

function resetFormUI() {
  const maskGroup = document.getElementById('dogMaskGroup');
  const intensityHint = document.getElementById('dogIntensityHint');
  maskGroup.style.display = 'none';
  intensityHint.style.display = 'none';
  document.getElementById('fatherDataContainer').style.display = 'none';
  document.getElementById('motherDataContainer').style.display = 'none';
}

function updateDogMaskVisibility() {
  const baseColor = document.getElementById('dogBaseColor').value;
  const maskGroup = document.getElementById('dogMaskGroup');
  
  if (['laranja', 'wolf_sable'].includes(baseColor)) {
    maskGroup.style.display = 'block';
  } else {
    maskGroup.style.display = 'none';
    document.getElementById('dogMask').value = '';
  }
}

function updateDogIntensityLabel() {
  const baseColor = document.getElementById('dogBaseColor').value;
  const intensityHint = document.getElementById('dogIntensityHint');
  
  if (baseColor === 'preto' || baseColor === 'chocolate') {
    intensityHint.style.display = 'block';
  } else {
    intensityHint.style.display = 'none';
  }
}

// ============================================================
// SEÇÃO 10: FUNÇÕES AUXILIARES DE INTERFACE
// ============================================================

/**
 * Mostra descrição da marcação selecionada
 */
function updateMarkingDescription() {
  const markingSelect = document.getElementById('dogMarking');
  const descriptionDiv = document.getElementById('markingDescription');
  
  if (!markingSelect.value) {
    descriptionDiv.style.display = 'none';
    return;
  }

  const descriptions = {
    'solido': 'Cor sólida, sem marcações ou manchas brancas.',
    'sable': 'Fundo escuro com pêlos dourados (Agouti dominante).',
    'tan_points': 'Marcações de fogo em sobrancelhas, bochechas e patas. Genótipo: at/at (Locus A)',
    'particolor': 'Manchas brancas significativas sobre cor base. Genótipo: sp/sp (Locus S)',
    'tricolor': 'COMBINAÇÃO INDEPENDENTE: Tan Points (fogo) + Particolor (manchas brancas). Genótipo: at/at (Locus A) + sp/sp (Locus S)',
    'irish_setter': 'Mancha branca no peito/patas. Genótipo: si/si (Locus S)',
    'branco_extremo': 'Predomínio de branco. Genótipo: sw/sw (Locus S)'
  };

  const desc = descriptions[markingSelect.value] || '';
  if (desc) {
    descriptionDiv.textContent = desc;
    descriptionDiv.style.display = 'block';
  } else {
    descriptionDiv.style.display = 'none';
  }
}

/**
 * Valida combinações de marcação
 */
function validateMarkingCombinations() {
  const marking = document.getElementById('dogMarking').value;
  const baseColor = document.getElementById('dogBaseColor').value;
  
  const issues = [];

  if (marking === 'tricolor' && !baseColor) {
    issues.push('Tricolor requer uma cor base definida');
  }

  if (marking === 'chocolate_tan' && baseColor !== 'chocolate' && baseColor !== '') {
    issues.push('Chocolate Tan Points é específico para cães Chocolate');
  }

  return issues;
}

// ============================================================
// SEÇÃO 11: AUTOCOMPLETE DE PEDIGREE
// ============================================================

function setupAutocomplete() {
  const fatherInput = document.getElementById('dogFatherName');
  const motherInput = document.getElementById('dogMotherName');

  fatherInput.addEventListener('input', (e) => handleAutocomplete(e, 'M', 'fatherSuggestions', 'father'));
  motherInput.addEventListener('input', (e) => handleAutocomplete(e, 'F', 'motherSuggestions', 'mother'));
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#dogFatherName') && !e.target.closest('#fatherSuggestions')) {
      document.getElementById('fatherSuggestions').style.display = 'none';
    }
    if (!e.target.closest('#dogMotherName') && !e.target.closest('#motherSuggestions')) {
      document.getElementById('motherSuggestions').style.display = 'none';
    }
  });
}

function handleAutocomplete(event, sex, suggestionsId, parentType) {
  const input = event.target.value.toLowerCase();
  const suggestionsDiv = document.getElementById(suggestionsId);

  if (input.length < 1) {
    suggestionsDiv.style.display = 'none';
    document.getElementById(`${parentType}DataContainer`).style.display = 'none';
    return;
  }

  const matches = searchDogsByNameAndSex(input, sex);

  if (matches.length === 0) {
    suggestionsDiv.style.display = 'none';
    return;
  }

  suggestionsDiv.style.display = 'block';
  suggestionsDiv.innerHTML = matches.map(dog => `
    <div class="suggestion-item" onclick="selectParent('${dog.id}', '${parentType}')">
      <strong>${dog.name}</strong> (${dog.baseColor})
    </div>
  `).join('');
}

function selectParent(dogId, parentType) {
  const dog = getDogById(dogId);
  const inputId = parentType === 'father' ? 'dogFatherName' : 'dogMotherName';
  const dataContainerId = `${parentType}DataContainer`;
  const dataDisplayId = `${parentType}DataDisplay`;
  const suggestionsId = `${parentType}Suggestions`;

  document.getElementById(inputId).value = dog.name;
  document.getElementById(suggestionsId).style.display = 'none';

  const parentData = `
    ${dog.name} - ${dog.baseColor} 
    ${dog.fatherName ? `(Pai: ${dog.fatherName})` : ''} 
    ${dog.motherName ? `(Mãe: ${dog.motherName})` : ''}
  `;

  document.getElementById(dataDisplayId).textContent = parentData;
  document.getElementById(dataContainerId).style.display = 'block';

  // Auto-fill ancestrais
  const ancestors = autoFillAncestorsInfo(dogId);
  if (ancestors && ancestors.grandparents) {
    if (ancestors.grandparents.paternal.grandfather) {
      document.getElementById(`grandparent${parentType === 'father' ? 'PGF' : 'MGF'}`).value = ancestors.grandparents.paternal.grandfather.name;
      document.getElementById(`grandparent${parentType === 'father' ? 'PGFColor' : 'MGFColor'}`).value = ancestors.grandparents.paternal.grandfather.baseColor;
    }
    if (ancestors.grandparents.paternal.grandmother) {
      document.getElementById(`grandparent${parentType === 'father' ? 'PGM' : 'MGM'}`).value = ancestors.grandparents.paternal.grandmother.name;
      document.getElementById(`grandparent${parentType === 'father' ? 'PGMColor' : 'MGMColor'}`).value = ancestors.grandparents.paternal.grandmother.baseColor;
    }
  }

  if (parentType === 'father') {
    state.selectedFatherDogId = dogId;
  } else {
    state.selectedMotherDogId = dogId;
  }
}

// ============================================================
// SEÇÃO 12: SALVAR CÃO COM PEDIGREE
// ============================================================

function saveDogWithPedigree() {
  const validationIssues = validateMarkingCombinations();
  if (validationIssues.length > 0) {
    alert('⚠️ Avisos de validação:\n' + validationIssues.join('\n'));
  }

  const dogId = document.getElementById('dogId').value || Date.now().toString();
  
  // NOVO v2.2: Usa chips em vez de select
  const provenColors = getSelectedProvenColors();

  const newDog = {
    id: dogId,
    name: document.getElementById('dogName').value,
    sex: document.getElementById('dogSex').value,
    coat: document.getElementById('dogCoat').value,
    baseColor: document.getElementById('dogBaseColor').value,
    dilution: document.getElementById('dogDilution').value,
    marking: document.getElementById('dogMarking').value,
    mask: document.getElementById('dogMask')?.value || 'sem_mascara',
    intensity: document.getElementById('dogIntensity').value,
    merle: document.getElementById('dogMerle').value,
    nose: document.getElementById('dogNose').value,
    ticking: document.getElementById('dogTicking').value,
    belongsToMe: document.getElementById('dogBelongsToMe').checked,
    fatherName: document.getElementById('dogFatherName').value || null,
    fatherDogId: state.selectedFatherDogId || null,
    motherName: document.getElementById('dogMotherName').value || null,
    motherDogId: state.selectedMotherDogId || null,
    provenColors: provenColors,
    registeredDate: new Date().toISOString()
  };
  
  const characteristics = {
    baseColor: newDog.baseColor,
    dilution: newDog.dilution,
    marking: newDog.marking,
    mask: newDog.mask,
    intensity: newDog.intensity,
    merle: newDog.merle,
    nose: newDog.nose,
    ticking: newDog.ticking
  };
  
  newDog.genotype = inferGenotypeWithPedigreeAndProvenColors(
    characteristics,
    newDog.fatherDogId,
    newDog.motherDogId,
    newDog.provenColors
  );
  
  const grandparentsData = {
    paternal: {
      grandfather: {
        name: document.getElementById('grandparentPGF').value,
        color: document.getElementById('grandparentPGFColor').value
      },
      grandmother: {
        name: document.getElementById('grandparentPGM').value,
        color: document.getElementById('grandparentPGMColor').value
      }
    },
    maternal: {
      grandfather: {
        name: document.getElementById('grandparentMGF').value,
        color: document.getElementById('grandparentMGFColor').value
      },
      grandmother: {
        name: document.getElementById('grandparentMGM').value,
        color: document.getElementById('grandparentMGMColor').value
      }
    }
  };
  
  const father = newDog.fatherDogId ? getDogById(newDog.fatherDogId) : null;
  const mother = newDog.motherDogId ? getDogById(newDog.motherDogId) : null;
  
  if (father) {
    if (!father.fatherDogId && grandparentsData.paternal.grandfather.name) {
      father.fatherName = grandparentsData.paternal.grandfather.name;
    }
    if (!father.motherDogId && grandparentsData.paternal.grandmother.name) {
      father.motherName = grandparentsData.paternal.grandmother.name;
    }
  }
  
  if (mother) {
    if (!mother.fatherDogId && grandparentsData.maternal.grandfather.name) {
      mother.fatherName = grandparentsData.maternal.grandfather.name;
    }
    if (!mother.motherDogId && grandparentsData.maternal.grandmother.name) {
      mother.motherName = grandparentsData.maternal.grandmother.name;
    }
  }
  
  // CORRIGIDO v2.2: Valida pedigree antes de salvar
  const pedigreeIssues = validatePedigree(newDog);
  if (pedigreeIssues.length > 0) {
    console.warn('⚠️ Problemas no pedigree:', pedigreeIssues);
    // Continua mesmo com avisos, mas loga
  }

  upsertDog(newDog);
  
  toggleRegisterDog();
  renderKennelList();
  renderDatabaseList();
  updateSelectionSelects();
  state.selectedFatherDogId = null;
  state.selectedMotherDogId = null;
  
  alert(`✓ ${newDog.name} ${state.editingDogId ? 'atualizado' : 'registrado'} com sucesso!`);
}

// ============================================================
// SEÇÃO 13: RENDERIZAR LISTAS
// ============================================================

function renderKennelList() {
  const list = document.getElementById('kennelList');
  
  if (state.myDogs.length === 0) {
    list.innerHTML = '<p class="placeholder">Nenhum cão registrado. Clique em "Registrar Novo Cão" para começar!</p>';
    return;
  }

  let html = '<div class="dogs-list">';
  
  state.myDogs.forEach(dog => {
    const father = dog.fatherDogId ? getDogById(dog.fatherDogId) : null;
    const mother = dog.motherDogId ? getDogById(dog.motherDogId) : null;
    const carriers = getCarrierStatus(dog.genotype, dog.baseColor, dog.dilution);

    html += `
      <div class="dog-card-kennel">
        <div class="dog-header-kennel">
          <h4>${dog.name} ${dog.sex === 'M' ? '♂' : '♀'}</h4>
          <div class="dog-actions">
            <button class="btn-action" onclick="toggleRegisterDog('${dog.id}')" title="Editar">✏️</button>
            <button class="btn-action" onclick="showTreeModal('${dog.id}')" title="Árvore genealógica">🌳</button>
            <button class="btn-action btn-delete" onclick="deleteDog('${dog.id}')" title="Deletar">🗑️</button>
          </div>
        </div>

        <div class="dog-details">
          <p><strong>Cor:</strong> ${dog.baseColor}</p>
          <p><strong>Marcação:</strong> ${dog.marking}</p>
          <p><strong>Diluição:</strong> ${dog.dilution}</p>
          <p><strong>Merle:</strong> ${dog.merle}</p>
        </div>

        ${father || mother ? `
          <div class="dog-pedigree">
            <strong>Pedigree:</strong><br>
            Pai: ${father ? father.name : dog.fatherName || 'Não registrado'}<br>
            Mãe: ${mother ? mother.name : dog.motherName || 'Não registrada'}
          </div>
        ` : ''}

        ${carriers.length > 0 ? `
          <div class="dog-carrier-status">
            <strong>Carga Genética:</strong><br>
            ${carriers.join('<br>')}
          </div>
        ` : ''}

        ${dog.provenColors && dog.provenColors.length > 0 ? `
          <div class="dog-proven-colors">
            <strong>Cores Comprovadas:</strong><br>
            ${dog.provenColors.join(', ')}
          </div>
        ` : ''}

        <div class="dog-genotype-display">
          <strong>Genótipo:</strong><br>
          <small>${formatGenotype(dog.genotype)}</small>
        </div>
      </div>
    `;
  });

  html += '</div>';
  list.innerHTML = html;
}

function renderDatabaseList() {
  const list = document.getElementById('databaseList');
  
  if (state.externalDogs.length === 0) {
    list.innerHTML = '<p class="placeholder">Nenhum cão externo registrado.</p>';
    return;
  }

  let html = '<div class="dogs-list">';
  
  state.externalDogs.forEach(dog => {
    const carriers = getCarrierStatus(dog.genotype, dog.baseColor, dog.dilution);

    html += `
      <div class="dog-card-kennel" style="opacity: 0.85;">
        <div class="dog-header-kennel">
          <h4>${dog.name} ${dog.sex === 'M' ? '♂' : '♀'}</h4>
          <div class="dog-actions">
            <button class="btn-action" onclick="toggleRegisterDog('${dog.id}')" title="Editar">✏️</button>
            <button class="btn-action btn-delete" onclick="deleteDog('${dog.id}')" title="Deletar">🗑️</button>
          </div>
        </div>

        <div class="dog-details">
          <p><strong>Cor:</strong> ${dog.baseColor}</p>
          <p><strong>Marcação:</strong> ${dog.marking}</p>
          <p><strong>Trufa:</strong> ${dog.nose}</p>
          <p><strong>Merle:</strong> ${dog.merle}</p>
        </div>

        ${carriers.length > 0 ? `
          <div class="dog-carrier-status">
            <strong>Carga Genética:</strong><br>
            ${carriers.join('<br>')}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div>';
  list.innerHTML = html;
}

function deleteDog(dogId) {
  if (confirm('Tem certeza que deseja deletar este cão?')) {
    removeDog(dogId);
    renderKennelList();
    renderDatabaseList();
    updateSelectionSelects();
  }
}

function updateSelectionSelects() {
  const fatherSelect = document.getElementById('selectedFather');
  const motherSelect = document.getElementById('selectedMother');

  fatherSelect.innerHTML = '<option value="">Selecione um macho...</option>';
  motherSelect.innerHTML = '<option value="">Selecione uma fêmea...</option>';

  state.myDogs.filter(dog => dog.sex === 'M').forEach(dog => {
    const option = document.createElement('option');
    option.value = dog.id;
    option.textContent = dog.name;
    fatherSelect.appendChild(option);
  });

  state.myDogs.filter(dog => dog.sex === 'F').forEach(dog => {
    const option = document.createElement('option');
    option.value = dog.id;
    option.textContent = dog.name;
    motherSelect.appendChild(option);
  });
}

function updateFatherInfo() {
  const dogId = document.getElementById('selectedFather').value;
  const infoDiv = document.getElementById('fatherInfo');

  if (!dogId) {
    infoDiv.style.display = 'none';
    return;
  }

  const dog = getDogById(dogId);
  if (dog) {
    const carriers = getCarrierStatus(dog.genotype, dog.baseColor, dog.dilution);
    infoDiv.innerHTML = `
      <p><strong>${dog.name}</strong></p>
      <p>Cor: ${dog.baseColor}</p>
      <p>Marcação: ${dog.marking}</p>
      <p>Merle: ${dog.merle}</p>
      ${carriers.length > 0 ? `<p><strong>Carga Genética:</strong> ${carriers.join(', ')}</p>` : ''}
      <p>Genótipo: <small>${formatGenotype(dog.genotype)}</small></p>
    `;
    infoDiv.style.display = 'block';
  }
}

function updateMotherInfo() {
  const dogId = document.getElementById('selectedMother').value;
  const infoDiv = document.getElementById('motherInfo');

  if (!dogId) {
    infoDiv.style.display = 'none';
    return;
  }

  const dog = getDogById(dogId);
  if (dog) {
    const carriers = getCarrierStatus(dog.genotype, dog.baseColor, dog.dilution);
    infoDiv.innerHTML = `
      <p><strong>${dog.name}</strong></p>
      <p>Cor: ${dog.baseColor}</p>
      <p>Marcação: ${dog.marking}</p>
      <p>Merle: ${dog.merle}</p>
      ${carriers.length > 0 ? `<p><strong>Carga Genética:</strong> ${carriers.join(', ')}</p>` : ''}
      <p>Genótipo: <small>${formatGenotype(dog.genotype)}</small></p>
    `;
    infoDiv.style.display = 'block';
  }
}

// ============================================================
// SEÇÃO 14: ÁRVORE GENEALÓGICA MODAL
// ============================================================

let treeZoom = 1;

function showTreeModal(dogId) {
  const dog = getDogById(dogId);
  if (!dog) return;
  
  const modal = document.getElementById('treeModal');
  const treeViz = document.getElementById('treeVisualization');

  const treeData = buildPedigreeTree(dog);
  const treeHTML = renderPedigreeTree(treeData, 600);

  treeViz.innerHTML = `
    <div class="pedigree-tree-container">
      <div class="tree-root">
        <div class="tree-node current-dog" style="position: relative; left: auto; top: auto; transform: none; width: 220px; margin: 0 auto;">
          <div class="node-content">
            <strong>${dog.name}</strong><br>
            ${dog.baseColor}<br>
            ${dog.sex === 'M' ? '♂ Macho' : '♀ Fêmea'}
          </div>
        </div>
      </div>
      <div class="tree-lines">
        ${treeHTML}
      </div>
    </div>
  `;

  modal.style.display = 'block';
  treeZoom = 1;
  
  setTimeout(() => {
    const container = treeViz.querySelector('.pedigree-tree-container');
    if (container) {
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = 50;
    }
  }, 100);
  
  setupTreeInteractions();
}

function setupTreeInteractions() {
  const treeContainer = document.querySelector('.pedigree-tree-container');
  
  if (!treeContainer) return;

  treeContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      treeZoom *= delta;
      treeZoom = Math.max(0.5, Math.min(2, treeZoom));
      
      treeContainer.style.transform = `scale(${treeZoom})`;
      treeContainer.style.transformOrigin = 'top center';
    }
  });

  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let scrollLeftStart = 0;
  let scrollTopStart = 0;

  treeContainer.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanning = true;
      startX = e.pageX;
      startY = e.pageY;
      scrollLeftStart = treeContainer.scrollLeft;
      scrollTopStart = treeContainer.scrollTop;
      treeContainer.style.cursor = 'grabbing';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      treeContainer.scrollLeft = scrollLeftStart - dx;
      treeContainer.scrollTop = scrollTopStart - dy;
    }
  });

  document.addEventListener('mouseup', () => {
    isPanning = false;
    treeContainer.style.cursor = 'auto';
  });
}

function closeTreeModal() {
  document.getElementById('treeModal').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('treeModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

// ============================================================
// SEÇÃO 15: SIMULADOR
// ============================================================

function validateAndSimulate() {
  const fatherId = document.getElementById('selectedFather').value;
  const motherId = document.getElementById('selectedMother').value;

  if (!fatherId || !motherId) {
    alert('Por favor, selecione um macho e uma fêmea!');
    return;
  }

  state.father = null;
  state.mother = null;
  state.simulationResults = [];

  const father = getDogById(fatherId);
  const mother = getDogById(motherId);

  state.father = {
    name: father.name,
    characteristics: father,
    genotype: father.genotype
  };

  state.mother = {
    name: mother.name,
    characteristics: mother,
    genotype: mother.genotype
  };

  const litterSize = parseInt(document.getElementById('litterSize').value) || 20;

  const offspring = generateOffspringWithProbabilities(state.father, state.mother, litterSize);
  
  const puppiesWithInfo = offspring.map(pup => ({
    ...pup,
    phenotype: genotypeToPhenotype(pup.genotype),
    alerts: checkHealthAlerts(pup.genotype)
  }));

  state.simulationResults = puppiesWithInfo;

  displayResults(puppiesWithInfo, state.father.name, state.mother.name, litterSize);

  document.getElementById('results').style.display = 'block';
  document.getElementById('simulator').style.display = 'none';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.tab === 'results') b.classList.add('active');
  });
}

function displayResults(puppies, fatherName, motherName, litterSize) {
  const container = document.getElementById('resultsContainer');
  
  const summaryStats = {
    totalPuppies: puppies.length,
    males: puppies.filter(p => p.sex === 'M').length,
    females: puppies.filter(p => p.sex === 'F').length,
    withAlerts: puppies.filter(p => p.alerts.length > 0).length
  };

  let html = `
    <div class="results-summary">
      <h2>📊 Resumo da Simulação</h2>
      <p><strong>Cruzamento:</strong> ${fatherName} (Pai) × ${motherName} (Mãe)</p>
      <div class="summary-grid">
        <div class="summary-item">
          <label>Total de Filhotes</label>
          <div class="value">${summaryStats.totalPuppies}</div>
        </div>
        <div class="summary-item">
          <label>Machos</label>
          <div class="value">${summaryStats.males}</div>
        </div>
        <div class="summary-item">
          <label>Fêmeas</label>
          <div class="value">${summaryStats.females}</div>
        </div>
        <div class="summary-item">
          <label>Com Alertas</label>
          <div class="value" style="color: var(--danger-color);">${summaryStats.withAlerts}</div>
        </div>
      </div>
    </div>
  `;

  html += '<div class="puppies-grid">';

  puppies.forEach((puppy, idx) => {
    const alertClass = puppy.alerts.length > 0 ? 'alert' : '';
    html += `
      <div class="puppy-card ${alertClass}">
        <div class="puppy-header">
          <span class="puppy-number">Filhote #${idx + 1}</span>
          <span class="puppy-gender">${puppy.sex === 'M' ? '♂ Macho' : '♀ Fêmea'}</span>
        </div>

        <div class="puppy-phenotype">
          <div class="phenotype-item">
            <span class="phenotype-label">Cor Base:</span>
            <span class="phenotype-value">${puppy.phenotype.baseColor}</span>
          </div>
          <div class="phenotype-item">
            <span class="phenotype-label">Marcação:</span>
            <span class="phenotype-value">${puppy.phenotype.marking}</span>
          </div>
          <div class="phenotype-item">
            <span class="phenotype-label">Diluição:</span>
            <span class="phenotype-value">${puppy.phenotype.dilution}</span>
          </div>
          
          ${!puppy.phenotype.mask.includes('N/A') ? `
            <div class="phenotype-item">
              <span class="phenotype-label">Máscara:</span>
              <span class="phenotype-value">${puppy.phenotype.mask}</span>
            </div>
          ` : ''}
          
          ${!puppy.phenotype.intensity.includes('N/A') ? `
            <div class="phenotype-item">
              <span class="phenotype-label">Intensidade:</span>
              <span class="phenotype-value">${puppy.phenotype.intensity}</span>
            </div>
          ` : ''}
          
          <div class="phenotype-item">
            <span class="phenotype-label">Merle:</span>
            <span class="phenotype-value">${puppy.phenotype.merle}</span>
          </div>
          
          ${!puppy.phenotype.ticking.includes('N/A') ? `
            <div class="phenotype-item">
              <span class="phenotype-label">Pintas:</span>
              <span class="phenotype-value">${puppy.phenotype.ticking}</span>
            </div>
          ` : ''}
          
          <div class="phenotype-item">
            <span class="phenotype-label">Trufa:</span>
            <span class="phenotype-value">${puppy.phenotype.nose}</span>
          </div>
        </div>

        ${document.getElementById('showGenotype')?.checked ? `
          <div class="puppy-genotype">
            <h4>Genótipo (Alelos)</h4>
            <div class="genotype-content">${formatGenotype(puppy.genotype)}</div>
          </div>
        ` : ''}

        ${puppy.alerts.length > 0 && document.getElementById('showHealthAlerts')?.checked ? `
          <div class="health-alerts">
            <h5>Alertas de Saúde</h5>
            ${puppy.alerts.map(alert => `
              <p><strong>${alert.icon} ${alert.risk}</strong><br><em style="color: var(--text-light);">(${alert.severity})</em><br>${alert.consequence}</p>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ============================================================
// SEÇÃO 16: INICIALIZAÇÃO
// ============================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('✅ Service Worker registered'))
    .catch(err => console.log('❌ Service Worker registration failed:', err));
}

function updateOfflineStatus() {
  const statusEl = document.getElementById('offlineStatus');
  if (!statusEl) return;

  if (navigator.onLine) {
    statusEl.textContent = '🟢 Online';
    statusEl.style.color = '#00B894';
  } else {
    statusEl.textContent = '🔴 Offline';
    statusEl.style.color = '#E74C3C';
  }
}

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// Tab Navigation
document.addEventListener('DOMContentLoaded', () => {
  loadDatabase();
  updateOfflineStatus();
  renderKennelList();
  renderDatabaseList();
  renderProvenColorsChips();
  setupAutocomplete();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(tabName).style.display = 'block';

      if (tabName === 'simulator') {
        updateSelectionSelects();
      }
    });
  });
});
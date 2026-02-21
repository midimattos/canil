// ============================================================
// SPITZ GENETIC PREDICTOR - Script Principal (Versão Completa)
// ============================================================

// Genetic Database - Lócus e Alelos
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

// Global State
let state = {
  father: null,
  mother: null,
  simulationResults: []
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => {
      console.log('Service Worker registered');
      updateOfflineStatus();
    })
    .catch(err => console.log('Service Worker registration failed'));
}

function updateOfflineStatus() {
  const statusEl = document.getElementById('offlineStatus');
  if (navigator.onLine) {
    statusEl.textContent = '🟢 Online';
    statusEl.style.color = 'var(--secondary-color)';
  } else {
    statusEl.textContent = '🔴 Offline';
    statusEl.style.color = 'var(--warning-color)';
  }
}

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  });
});

// ============================================================
// FUNÇÕES DE INTERFACE
// ============================================================

function resetForm(formId) {
  document.getElementById(formId).reset();
  const parent = formId === 'fatherForm' ? 'father' : 'mother';
  updateMaskVisibility(parent);
  updateIntensityLabel(parent);
}

function updateMaskVisibility(parent) {
  const baseColorId = parent === 'father' ? 'fatherBaseColor' : 'motherBaseColor';
  const maskGroupId = parent === 'father' ? 'fatherMaskGroup' : 'motherMaskGroup';
  const maskId = parent === 'father' ? 'fatherMask' : 'motherMask';
  
  const baseColor = document.getElementById(baseColorId).value;
  const maskGroup = document.getElementById(maskGroupId);
  const maskSelect = document.getElementById(maskId);
  
  // Máscara visível apenas para Laranja, Vermelho ou Wolf Sable
  if (['laranja', 'wolf_sable'].includes(baseColor)) {
    maskGroup.style.display = 'block';
    maskSelect.required = true;
  } else {
    maskGroup.style.display = 'none';
    maskSelect.required = false;
    maskSelect.value = '';
  }
}

function updateIntensityLabel(parent) {
  const baseColorId = parent === 'father' ? 'fatherBaseColor' : 'motherBaseColor';
  const intensityHintId = parent === 'father' ? 'fatherIntensityHint' : 'motherIntensityHint';
  
  const baseColor = document.getElementById(baseColorId).value;
  const intensityHint = document.getElementById(intensityHintId);
  
  // Se for cor escura (Preto ou Chocolate), mostrar aviso
  if (baseColor === 'preto' || baseColor === 'chocolate') {
    intensityHint.style.display = 'block';
  } else {
    intensityHint.style.display = 'none';
  }
}

// ============================================================
// MAPEAMENTO FENÓTIPO → GENÓTIPO (CORRIGIDO)
// ============================================================

function inferGenotype(characteristics) {
  const genotype = {
    A: ['a', 'a'],
    K: ['k', 'k'],
    E: ['E', 'E'],
    B: ['B', 'B'],
    D: ['D', 'D'],
    I: ['I', 'I'],
    M: ['m', 'm'],
    S: ['S', 'S'],
    T: ['T', 't']
  };

  // ========== COLORAÇÃO BASE ==========
  switch (characteristics.baseColor) {
    case 'preto':
      genotype.K = ['K', 'k'];
      genotype.B = ['B', 'B'];
      genotype.E = ['E', 'E'];
      break;

    case 'chocolate':
      genotype.K = ['k', 'k'];
      genotype.B = ['b', 'b'];
      genotype.E = ['E', 'E'];
      break;

    case 'laranja':
      genotype.K = ['k', 'k'];
      genotype.B = ['B', 'B'];
      genotype.E = ['E', 'E'];
      break;

    case 'creme':
      genotype.E = ['e', 'e'];
      genotype.I = ['i', 'i'];
      genotype.K = ['k', 'k'];
      break;

    case 'branco':
      genotype.E = ['e', 'e'];
      genotype.I = ['i', 'i'];
      genotype.K = ['k', 'k'];
      break;

    case 'wolf_sable':
      genotype.K = ['k', 'k'];
      genotype.A = ['Aw', 'Aw'];
      genotype.E = ['E', 'E'];
      break;
  }

  // ========== DILUIÇÃO (Locus D) ==========
  genotype.D = characteristics.dilution === 'diluida' ? ['d', 'd'] : ['D', 'D'];

  // ========== MARCAÇÃO (Locus A e S) ==========
  switch (characteristics.marking) {
    case 'solido':
      genotype.K = ['K', 'K'];
      genotype.A = ['Ay', 'Ay'];
      genotype.S = ['S', 'S'];
      break;

    case 'tan_points':
      genotype.A = ['at', 'at'];
      genotype.S = ['si', 'si'];
      break;

    case 'sable':
      genotype.A = ['Ay', 'Ay'];
      genotype.S = ['S', 'S'];
      break;

    case 'particolor':
      genotype.S = ['sp', 'sp'];
      break;

    case 'irlandesa':
      genotype.S = ['si', 'si'];
      break;

    case 'branco_extremo':
      genotype.S = ['sw', 'sw'];
      break;
  }

  // ========== MÁSCARA (Locus E) ==========
  if (characteristics.mask === 'mascara_negra') {
    genotype.E = ['Em', 'Em'];
  }

  // ========== INTENSIDADE (Locus I - Dominância Incompleta) ==========
  switch (characteristics.intensity) {
    case 'vermelho_intenso':
      genotype.I = ['I', 'I'];
      break;

    case 'laranja_padrao':
      genotype.I = ['I', 'i'];
      break;

    case 'creme_branco':
      genotype.I = ['i', 'i'];
      break;
  }

  // ========== MARMOREIO (Locus M) ==========
  switch (characteristics.merle) {
    case 'nao':
      genotype.M = ['m', 'm'];
      break;

    case 'merle':
      genotype.M = ['M', 'm'];
      break;

    case 'harlequin':
      genotype.M = ['Mh', 'm'];
      break;

    case 'oculto':
      genotype.M = ['Mc', 'm'];
      break;
  }

  // ========== TRUFAGEM (Cor do Nariz - Locus B e D) ==========
  switch (characteristics.nose) {
    case 'preta':
      genotype.B = ['B', 'B'];
      genotype.D = ['D', 'D'];
      break;

    case 'marrom':
      genotype.B = ['b', 'b'];
      break;

    case 'azul':
      genotype.B = ['B', 'B'];
      genotype.D = ['d', 'd'];
      break;

    case 'lilas_beaver':
      genotype.B = ['b', 'b'];
      genotype.D = ['d', 'd'];
      break;
  }

  // ========== PIGMENTAÇÃO (Locus T) ==========
  genotype.T = characteristics.ticking === 'com_pintas' ? ['T', 't'] : ['t', 't'];

  return genotype;
}

// ============================================================
// LEITURA DO FORMULÁRIO
// ============================================================

function readDogForm(formId) {
  const parent = formId === 'fatherForm' ? 'father' : 'mother';
  const nameId = parent === 'father' ? 'fatherName' : 'motherName';
  
  const name = document.getElementById(nameId).value || 
               (parent === 'father' ? 'Cão Pai' : 'Cão Mãe');
  
  const characteristics = {
    name: name,
    coat: document.getElementById(`${parent}Coat`).value,
    baseColor: document.getElementById(`${parent}BaseColor`).value,
    dilution: document.getElementById(`${parent}Dilution`).value,
    marking: document.getElementById(`${parent}Marking`).value,
    mask: document.getElementById(`${parent}Mask`)?.value || 'sem_mascara',
    intensity: document.getElementById(`${parent}Intensity`).value,
    merle: document.getElementById(`${parent}Merle`).value,
    nose: document.getElementById(`${parent}Nose`).value,
    ticking: document.getElementById(`${parent}Ticking`).value
  };

  return {
    name: characteristics.name,
    characteristics: characteristics,
    genotype: inferGenotype(characteristics)
  };
}

// ============================================================
// QUADRADO DE PUNNETT - CÁLCULO DE PROBABILIDADES
// ============================================================

function getLocusProbabilities(parent1Alleles, parent2Alleles) {
  const outcomes = [];
  parent1Alleles.forEach(a1 => {
    parent2Alleles.forEach(a2 => {
      outcomes.push([a1, a2]);
    });
  });
  return outcomes; // Sempre 4 combinações
}

function generateOffspringWithProbabilities(father, mother, count = 20) {
  const loci = Object.keys(father.genotype);
  const offspring = [];

  // Calcular todas as combinações possíveis para cada locus
  const allCombinations = [];
  
  for (let locusIdx = 0; locusIdx < loci.length; locusIdx++) {
    const locus = loci[locusIdx];
    const fatherAlleles = father.genotype[locus];
    const motherAlleles = mother.genotype[locus];
    
    const possibilities = getLocusProbabilities(fatherAlleles, motherAlleles);
    allCombinations.push(possibilities);
  }

  // Gerar filhotes usando as probabilidades calculadas
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
// GENÓTIPO → FENÓTIPO (COM REGRAS DE VISIBILIDADE)
// ============================================================

function genotypeToPhenotype(genotype) {
  const phenotype = {};

  const K = genotype.K;
  const B = genotype.B;
  const E = genotype.E;
  const D = genotype.D;
  const I = genotype.I;
  const A = genotype.A;
  const S = genotype.S;
  const M = genotype.M;
  const T = genotype.T;

  // ========== COR BASE ==========
  const isEpistatic = E[0] === 'e' && E[1] === 'e';
  
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
      phenotype.baseColor = 'Laranja/Agouti';
    }
  }

  // ========== DILUIÇÃO ==========
  phenotype.dilution = (D[0] === 'd' && D[1] === 'd') 
    ? 'Diluída (Azul/Lilac)' 
    : 'Densa';

  // ========== MÁSCARA (Só visível em cores quentes) ==========
  const hasWarmColors = !isEpistatic && (K[0] === 'k' && K[1] === 'k');
  
  if (hasWarmColors && (E[0] === 'Em' || E[1] === 'Em')) {
    phenotype.mask = 'Com Máscara Negra';
  } else if (hasWarmColors) {
    phenotype.mask = 'Sem Máscara';
  } else {
    phenotype.mask = 'N/A (Cor Escura)';
  }

  // ========== INTENSIDADE (Dominância Incompleta) ==========
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

  // ========== MARCAÇÃO ==========
  if (S[0] === 'S' && S[1] === 'S') {
    phenotype.marking = 'Sólido';
  } else if (S.includes('sp')) {
    phenotype.marking = 'Particolor (Piebald)';
  } else if (S.includes('si')) {
    phenotype.marking = 'Mancha Irlandesa';
  } else if (S[0] === 'sw' && S[1] === 'sw') {
    phenotype.marking = 'Branco Extremo';
  } else {
    phenotype.marking = 'Misto';
  }

  // ========== MARMOREIO ==========
  if (M[0] === 'm' && M[1] === 'm') {
    phenotype.merle = 'Sem Merle';
  } else if (M.includes('Mh')) {
    phenotype.merle = 'Harlequin Merle';
  } else if (M.includes('M')) {
    phenotype.merle = 'Merle Padrão';
  } else if (M.includes('Mc')) {
    phenotype.merle = 'Merle Cripto';
  }

  // ========== PINTAS/TICKING (Regra: Só visível com branco) ==========
  const hasWhiteMarkings = !S.every(s => s === 'S');
  
  if (!hasWhiteMarkings) {
    phenotype.ticking = 'N/A (Invisível)';
  } else {
    phenotype.ticking = (T[0] === 'T' || T[1] === 'T')
      ? 'Com Pintas/Sardas'
      : 'Sem Pintas';
  }

  // ========== TRUFA ==========
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

// ============================================================
// ALERTAS DE SAÚDE GENÉTICA
// ============================================================

function checkHealthAlerts(genotype) {
  const alerts = [];

  const M = genotype.M;
  const D = genotype.D;

  // ========== DOUBLE MERLE ==========
  const merleCount = M.filter(a => a !== 'm').length;
  if (merleCount === 2) {
    alerts.push({
      risk: 'Double Merle (MM ou variante dupla)',
      consequence: 'Cegueira, Sordez, Microftalmia - ALTO RISCO GENÉTICO',
      severity: 'CRÍTICA'
    });
  }

  // ========== ALOPECIA POR DILUIÇÃO ==========
  if (D[0] === 'd' && D[1] === 'd') {
    alerts.push({
      risk: 'Alopecia por Diluição (dd)',
      consequence: 'Queda de pelo crônica, displasia folicular',
      severity: 'Média'
    });
  }

  return alerts;
}

// ============================================================
// FORMATAÇÃO PARA EXIBIÇÃO
// ============================================================

function formatGenotype(genotype) {
  const loci = Object.keys(genotype);
  return loci.map(locus => `${locus}: ${genotype[locus][0]}/${genotype[locus][1]}`).join(' | ');
}

// ============================================================
// EXIBIÇÃO DE RESULTADOS
// ============================================================

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
          ` : `
            <div class="phenotype-item">
              <span class="phenotype-label">Intensidade:</span>
              <span class="phenotype-value" style="font-size: 0.85rem; color: var(--text-light);">${puppy.phenotype.intensity}</span>
            </div>
          `}
          
          <div class="phenotype-item">
            <span class="phenotype-label">Marcação:</span>
            <span class="phenotype-value">${puppy.phenotype.marking}</span>
          </div>
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
            <h5>⚠️ Alertas de Saúde</h5>
            ${puppy.alerts.map(alert => `
              <p><strong>${alert.risk}</strong><br><em style="color: var(--text-light);">(${alert.severity})</em><br>${alert.consequence}</p>
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
// VALIDAÇÃO E EVENTOS
// ============================================================

function validateForms() {
  const requiredFields = [
    'fatherCoat', 'fatherBaseColor', 'fatherDilution', 'fatherMarking',
    'fatherIntensity', 'fatherMerle', 'fatherNose', 'fatherTicking',
    'motherCoat', 'motherBaseColor', 'motherDilution', 'motherMarking',
    'motherIntensity', 'motherMerle', 'motherNose', 'motherTicking'
  ];

  for (let fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value) {
      alert(`Por favor, preencha todos os campos obrigatórios.`);
      return false;
    }
  }

  return true;
}

// Simulate button - CORRIGIDO PARA LIMPAR CACHE
document.getElementById('simulateBtn')?.addEventListener('click', () => {
  if (!validateForms()) return;

  // LIMPAR STATE ANTERIOR ANTES DE GERAR NOVOS DADOS
  state = {
    father: null,
    mother: null,
    simulationResults: []
  };

  // LER OS DADOS DOS FORMULÁRIOS (sempre fresco do DOM)
  state.father = readDogForm('fatherForm');
  state.mother = readDogForm('motherForm');

  const litterSize = parseInt(document.getElementById('litterSize').value) || 20;

  // Usar o novo método com probabilidades (Quadrado de Punnett)
  const offspring = generateOffspringWithProbabilities(state.father, state.mother, litterSize);
  
  const puppiesWithInfo = offspring.map(pup => ({
    ...pup,
    phenotype: genotypeToPhenotype(pup.genotype),
    alerts: checkHealthAlerts(pup.genotype)
  }));

  // Atualizar state com novos resultados
  state.simulationResults = puppiesWithInfo;

  // Exibir resultados
  displayResults(
    puppiesWithInfo,
    state.father.name,
    state.mother.name,
    litterSize
  );

  // Navegar para a aba de resultados
  document.querySelector('[data-tab="results"]').click();
});

// Export results
function exportResults() {
  const data = {
    timestamp: new Date().toISOString(),
    father: state.father,
    mother: state.mother,
    puppies: state.simulationResults
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spitz-prediction-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Print results
function printResults() {
  window.print();
}

// Add export/print buttons
document.addEventListener('DOMContentLoaded', () => {
  updateOfflineStatus();
  
  const resultsContainer = document.getElementById('resultsContainer');
  if (resultsContainer) {
    const observer = new MutationObserver(() => {
      if (resultsContainer.innerHTML.includes('Filhote') && !document.getElementById('exportBtn')) {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 1rem; margin-top: 2rem; justify-content: center; flex-wrap: wrap;';
        btnContainer.innerHTML = `
          <button id="exportBtn" class="btn-primary" onclick="exportResults()">📥 Exportar JSON</button>
          <button id="printBtn" class="btn-primary" onclick="printResults()" style="background: linear-gradient(135deg, #00B894 0%, #00866A 100%);">🖨️ Imprimir</button>
        `;
        resultsContainer.parentNode.insertBefore(btnContainer, resultsContainer);
      }
    });
    
    observer.observe(resultsContainer, { childList: true, subtree: true });
  }
});
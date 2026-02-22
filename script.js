// ============================================================
// SPITZ GENETIC PREDICTOR - Sistema Completo com Canil (VERSÃO FINAL)
// ============================================================

// Genetic Database
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
  kennel: [],
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

// LocalStorage Management
function saveKennelToLocalStorage() {
  localStorage.setItem('spitzKennel', JSON.stringify(state.kennel));
  console.log('Canil salvo:', state.kennel);
}

function loadKennelFromLocalStorage() {
  const saved = localStorage.getItem('spitzKennel');
  if (saved) {
    state.kennel = JSON.parse(saved);
    console.log('Canil carregado:', state.kennel);
  }
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
// KENNEL MANAGEMENT
// ============================================================

function toggleRegisterDog() {
  const form = document.getElementById('registerDogForm');
  const maskGroup = document.getElementById('dogMaskGroup');
  const intensityHint = document.getElementById('dogIntensityHint');
  
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    document.getElementById('newDogForm').reset();
    updateDogMaskVisibility();
    updateDogIntensityLabel();
    updateParentSelects();
  } else {
    form.style.display = 'none';
    maskGroup.style.display = 'none';
    intensityHint.style.display = 'none';
  }
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

function updateParentSelects() {
  const fatherSelect = document.getElementById('dogFather');
  const motherSelect = document.getElementById('dogMother');

  fatherSelect.innerHTML = '<option value="">Selecione um cão registrado...</option>';
  motherSelect.innerHTML = '<option value="">Selecione um cão registrado...</option>';

  state.kennel.filter(dog => dog.sex === 'M').forEach(dog => {
    const option = document.createElement('option');
    option.value = dog.id;
    option.textContent = `${dog.name} (${dog.baseColor})`;
    fatherSelect.appendChild(option);
  });

  state.kennel.filter(dog => dog.sex === 'F').forEach(dog => {
    const option = document.createElement('option');
    option.value = dog.id;
    option.textContent = `${dog.name} (${dog.baseColor})`;
    motherSelect.appendChild(option);
  });
}

// Register new dog
document.getElementById('newDogForm')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const newDog = {
    id: Date.now().toString(),
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
    fatherId: document.getElementById('dogFather').value || null,
    motherId: document.getElementById('dogMother').value || null,
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

  newDog.genotype = inferGenotypeWithPedigree(characteristics, newDog.fatherId, newDog.motherId);

  state.kennel.push(newDog);
  saveKennelToLocalStorage();

  toggleRegisterDog();
  renderKennelList();
  updateSelectionSelects();

  alert(`✓ ${newDog.name} registrado com sucesso!`);
});

function renderKennelList() {
  const list = document.getElementById('kennelList');
  
  if (state.kennel.length === 0) {
    list.innerHTML = '<p class="placeholder">Nenhum cão registrado ainda. Clique em "Registrar Novo Cão" para começar!</p>';
    return;
  }

  let html = '<div class="dogs-list">';
  
  state.kennel.forEach(dog => {
    const father = dog.fatherId ? state.kennel.find(d => d.id === dog.fatherId) : null;
    const mother = dog.motherId ? state.kennel.find(d => d.id === dog.motherId) : null;

    html += `
      <div class="dog-card-kennel">
        <div class="dog-header-kennel">
          <h4>${dog.name} ${dog.sex === 'M' ? '♂' : '♀'}</h4>
          <button class="btn-delete" onclick="deleteDog('${dog.id}')">🗑️</button>
        </div>

        <div class="dog-details">
          <p><strong>Cor:</strong> ${dog.baseColor}</p>
          <p><strong>Diluição:</strong> ${dog.dilution}</p>
          <p><strong>Marcação:</strong> ${dog.marking}</p>
          <p><strong>Merle:</strong> ${dog.merle}</p>
          <p><strong>Trufa:</strong> ${dog.nose}</p>
        </div>

        ${father || mother ? `
          <div class="dog-pedigree">
            <strong>Pedigree:</strong><br>
            Pai: ${father ? father.name : 'Não registrado'}<br>
            Mãe: ${mother ? mother.name : 'Não registrada'}
          </div>
        ` : ''}

        <div class="dog-genotype-display">
          <strong>Genótipo (Herdado):</strong><br>
          <small>${formatGenotype(dog.genotype)}</small>
        </div>
      </div>
    `;
  });

  html += '</div>';
  list.innerHTML = html;
}

function deleteDog(dogId) {
  if (confirm('Tem certeza que deseja deletar este cão?')) {
    state.kennel = state.kennel.filter(dog => dog.id !== dogId);
    saveKennelToLocalStorage();
    renderKennelList();
    updateSelectionSelects();
  }
}

function updateSelectionSelects() {
  const fatherSelect = document.getElementById('selectedFather');
  const motherSelect = document.getElementById('selectedMother');

  fatherSelect.innerHTML = '<option value="">Selecione um macho...</option>';
  motherSelect.innerHTML = '<option value="">Selecione uma fêmea...</option>';

  state.kennel.filter(dog => dog.sex === 'M').forEach(dog => {
    const option = document.createElement('option');
    option.value = dog.id;
    option.textContent = dog.name;
    fatherSelect.appendChild(option);
  });

  state.kennel.filter(dog => dog.sex === 'F').forEach(dog => {
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

  const dog = state.kennel.find(d => d.id === dogId);
  if (dog) {
    infoDiv.innerHTML = `
      <p><strong>${dog.name}</strong></p>
      <p>Cor: ${dog.baseColor}</p>
      <p>Merle: ${dog.merle}</p>
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

  const dog = state.kennel.find(d => d.id === dogId);
  if (dog) {
    infoDiv.innerHTML = `
      <p><strong>${dog.name}</strong></p>
      <p>Cor: ${dog.baseColor}</p>
      <p>Merle: ${dog.merle}</p>
      <p>Genótipo: <small>${formatGenotype(dog.genotype)}</small></p>
    `;
    infoDiv.style.display = 'block';
  }
}

// ============================================================
// FUNÇÕES DE BUSCA RECURSIVA EM PEDIGREE
// ============================================================

function checkChocolateInPedigree(dog) {
  if (!dog) return false;
  
  if (dog.baseColor === 'chocolate') {
    return true;
  }

  if (dog.genotype && dog.genotype.Locus_B && dog.genotype.Locus_B.includes('b')) {
    return true;
  }

  const father = dog.fatherId ? state.kennel.find(d => d.id === dog.fatherId) : null;
  const mother = dog.motherId ? state.kennel.find(d => d.id === dog.motherId) : null;

  return checkChocolateInPedigree(father) || checkChocolateInPedigree(mother);
}

function checkDilutionInPedigree(dog) {
  if (!dog) return false;
  
  if (dog.dilution === 'diluida' || dog.baseColor === 'azul' || dog.baseColor === 'lilás') {
    return true;
  }

  if (dog.genotype && dog.genotype.Locus_D && dog.genotype.Locus_D.includes('d')) {
    return true;
  }

  const father = dog.fatherId ? state.kennel.find(d => d.id === dog.fatherId) : null;
  const mother = dog.motherId ? state.kennel.find(d => d.id === dog.motherId) : null;

  return checkDilutionInPedigree(father) || checkDilutionInPedigree(mother);
}

function checkCreamInPedigree(dog) {
  if (!dog) return false;
  
  if (dog.baseColor === 'creme' || dog.baseColor === 'branco') {
    return true;
  }

  if (dog.genotype && dog.genotype.Locus_E && dog.genotype.Locus_E.includes('e')) {
    return true;
  }

  const father = dog.fatherId ? state.kennel.find(d => d.id === dog.fatherId) : null;
  const mother = dog.motherId ? state.kennel.find(d => d.id === dog.motherId) : null;

  return checkCreamInPedigree(father) || checkCreamInPedigree(mother);
}

function checkAgoutiInPedigree(dog) {
  if (!dog) return false;
  
  if (dog.genotype && dog.genotype.Locus_K && dog.genotype.Locus_K.includes('k')) {
    return true;
  }

  const father = dog.fatherId ? state.kennel.find(d => d.id === dog.fatherId) : null;
  const mother = dog.motherId ? state.kennel.find(d => d.id === dog.motherId) : null;

  return checkAgoutiInPedigree(father) || checkAgoutiInPedigree(mother);
}

function checkParticulorInPedigree(dog) {
  if (!dog) return false;
  
  if (dog.marking === 'particolor' || dog.genotype?.Locus_S?.includes('sp')) {
    return true;
  }

  const father = dog.fatherId ? state.kennel.find(d => d.id === dog.fatherId) : null;
  const mother = dog.motherId ? state.kennel.find(d => d.id === dog.motherId) : null;

  return checkParticulorInPedigree(father) || checkParticulorInPedigree(mother);
}

// ============================================================
// INFERÊNCIA DE GENÓTIPO COM ANÁLISE DE PEDIGREE (CORRIGIDO)
// ============================================================

function inferGenotypeWithPedigree(characteristics, fatherId, motherId) {
  // Passo 1: Inferir genótipo baseado nas características fenotípicas
  let genotype = inferGenotype(characteristics);

  // Passo 2: Analisar pedigree para genes recessivos escondidos
  const father = fatherId ? state.kennel.find(d => d.id === fatherId) : null;
  const mother = motherId ? state.kennel.find(d => d.id === motherId) : null;

  console.log('=== ANÁLISE DE PEDIGREE ===');
  console.log('Cão:', characteristics.baseColor, characteristics.marking);
  console.log('Pai:', father?.name, father?.baseColor);
  console.log('Mãe:', mother?.name, mother?.baseColor);

  // ========== VERIFICAÇÃO: CHOCOLATE (b recessivo) ==========
  if (checkChocolateInPedigree(father) || checkChocolateInPedigree(mother)) {
    if (characteristics.baseColor !== 'chocolate') {
      console.log('✓ Gene Chocolate detectado no pedigree');
      genotype.Locus_B = ['B', 'b']; // Preto portador de chocolate
    }
  }

  // ========== VERIFICAÇÃO: DILUIÇÃO (d recessivo) ==========
  if (checkDilutionInPedigree(father) || checkDilutionInPedigree(mother)) {
    if (characteristics.dilution === 'densa') {
      console.log('✓ Gene Diluição detectado no pedigree');
      genotype.Locus_D = ['D', 'd']; // Portador de diluição
    }
  }

  // ========== VERIFICAÇÃO: CREME/BRANCO (e recessivo) ==========
  if (checkCreamInPedigree(father) || checkCreamInPedigree(mother)) {
    if (characteristics.baseColor !== 'creme' && characteristics.baseColor !== 'branco') {
      console.log('✓ Gene Creme detectado no pedigree');
      genotype.Locus_E = ['E', 'e']; // Portador de creme
    }
  }

  // ========== VERIFICAÇÃO: AGOUTI (k recessivo) ==========
  if (checkAgoutiInPedigree(father) || checkAgoutiInPedigree(mother)) {
    if (characteristics.baseColor === 'preto' && characteristics.marking === 'solido') {
      // Cão preto que herda gene k de um pai agouti
      if (genotype.Locus_K[0] === 'K' && genotype.Locus_K[1] === 'K') {
        console.log('✓ Gene Agouti detectado no pedigree');
        genotype.Locus_K = ['K', 'k']; // Preto portador de agouti
      }
    }
  }

  // ========== VERIFICAÇÃO: PARTICOLOR (sp recessivo) ==========
  if (checkParticulorInPedigree(father) || checkParticulorInPedigree(mother)) {
    if (characteristics.marking === 'solido') {
      console.log('✓ Gene Particolor detectado no pedigree');
      genotype.Locus_S = ['S', 'sp']; // Portador de particolor
    }
  }

  console.log('Genótipo Final:', genotype);
  console.log('========================\n');

  return genotype;
}

// ============================================================
// INFERÊNCIA DE GENÓTIPO BASE (CORRIGIDO)
// ============================================================

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

  // ========== COLORAÇÃO BASE ==========
  switch (characteristics.baseColor) {
    case 'preto':
      genotype.Locus_K = ['K', 'k']; // Heterozigoto para permitir portadores
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

  // ========== DILUIÇÃO ==========
  genotype.Locus_D = characteristics.dilution === 'diluida' ? ['d', 'd'] : ['D', 'D'];

  // ========== MARCAÇÃO - NÃO SOBRESCREVE K SE JÁ FOI DEFINIDO ==========
  switch (characteristics.marking) {
    case 'solido':
      // Não sobrescrever se já foi definido como K/k pelo pedigree
      if (genotype.Locus_K[1] === 'k') {
        // Deixar como está (já é K/k do pedigree)
      } else {
        genotype.Locus_K = ['K', 'K'];
      }
      genotype.Locus_A = ['Ay', 'Ay'];
      genotype.Locus_S = ['S', 'S'];
      break;

    case 'tan_points':
      genotype.Locus_A = ['at', 'at'];
      genotype.Locus_S = ['si', 'si'];
      break;

    case 'sable':
      genotype.Locus_A = ['Ay', 'Ay'];
      genotype.Locus_S = ['S', 'S'];
      break;

    case 'particolor':
      genotype.Locus_S = ['sp', 'sp'];
      break;

    case 'irlandesa':
      genotype.Locus_S = ['si', 'si'];
      break;

    case 'branco_extremo':
      genotype.Locus_S = ['sw', 'sw'];
      break;
  }

  // ========== MÁSCARA ==========
  if (characteristics.mask === 'mascara_negra') {
    genotype.Locus_E = ['Em', 'Em'];
  }

  // ========== INTENSIDADE ==========
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

  // ========== MARMOREIO ==========
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

  // ========== TRUFAGEM ==========
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

  // ========== PIGMENTAÇÃO ==========
  genotype.Locus_T = characteristics.ticking === 'com_pintas' ? ['T', 't'] : ['t', 't'];

  return genotype;
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
  return outcomes;
}

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
// GENÓTIPO → FENÓTIPO (CORRIGIDO COM LOCUS_A)
// ============================================================

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

  // ========== COR BASE ==========
  const isEpistatic = E[0] === 'e' && E[1] === 'e';
  
  if (isEpistatic) {
    phenotype.baseColor = 'Vermelho/Creme (Epistático ee)';
  } else if (K[0] === 'K' || K[1] === 'K') {
    // Preto ou Chocolate
    if (B[0] === 'b' && B[1] === 'b') {
      phenotype.baseColor = 'Chocolate';
    } else {
      phenotype.baseColor = 'Preto';
    }
  } else {
    // kk - AGOUTI: verificar Locus_A
    if (B[0] === 'b' && B[1] === 'b') {
      phenotype.baseColor = 'Chocolate Agouti';
    } else {
      // Verificar Locus_A para determinar tipo de agouti
      if (A[0] === 'Ay' || A[1] === 'Ay') {
        phenotype.baseColor = 'Sable (Agouti)';
      } else if (A[0] === 'Aw' || A[1] === 'Aw') {
        phenotype.baseColor = 'Wolf Sable';
      } else if (A[0] === 'at' || A[1] === 'at') {
        phenotype.baseColor = 'Tan Points';
      } else {
        phenotype.baseColor = 'Laranja/Agouti';
      }
    }
  }

  // ========== DILUIÇÃO ==========
  phenotype.dilution = (D[0] === 'd' && D[1] === 'd') 
    ? 'Diluída (Azul/Lilac)' 
    : 'Densa';

  // ========== MÁSCARA ==========
  const hasWarmColors = !isEpistatic && (K[0] === 'k' && K[1] === 'k');
  
  if (hasWarmColors && (E[0] === 'Em' || E[1] === 'Em')) {
    phenotype.mask = 'Com Máscara Negra';
  } else if (hasWarmColors) {
    phenotype.mask = 'Sem Máscara';
  } else {
    phenotype.mask = 'N/A (Cor Escura)';
  }

  // ========== INTENSIDADE ==========
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

  // ========== PINTAS ==========
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
// ALERTAS DE SAÚDE
// ============================================================

function checkHealthAlerts(genotype) {
  const alerts = [];

  const M = genotype.Locus_M;
  const D = genotype.Locus_D;

  // DOUBLE MERLE
  const merleCount = M.filter(a => a !== 'm').length;
  if (merleCount === 2) {
    alerts.push({
      risk: 'Double Merle (MM ou variante dupla)',
      consequence: 'Cegueira, Sordez, Microftalmia - ALTO RISCO GENÉTICO',
      severity: 'CRÍTICA'
    });
  }

  // ALOPECIA
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
// FORMATAÇÃO
// ============================================================

function formatGenotype(genotype) {
  const loci = Object.keys(genotype);
  return loci.map(locus => `${locus}: ${genotype[locus][0]}/${genotype[locus][1]}`).join(' | ');
}

// ============================================================
// SIMULAÇÃO
// ============================================================

function validateAndSimulate() {
  const fatherId = document.getElementById('selectedFather').value;
  const motherId = document.getElementById('selectedMother').value;

  if (!fatherId || !motherId) {
    alert('Por favor, selecione um macho e uma fêmea!');
    return;
  }

  state = {
    kennel: state.kennel,
    father: null,
    mother: null,
    simulationResults: []
  };

  const father = state.kennel.find(d => d.id === fatherId);
  const mother = state.kennel.find(d => d.id === motherId);

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

  document.querySelector('[data-tab="results"]').click();
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

function printResults() {
  window.print();
}

document.addEventListener('DOMContentLoaded', () => {
  updateOfflineStatus();
  loadKennelFromLocalStorage();
  renderKennelList();
  updateSelectionSelects();
  updateParentSelects();
  
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
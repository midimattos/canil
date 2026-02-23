// ============================================================
// SPITZ LINEAGE MANAGER - Sistema de Gerenciamento de Linhagem
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
  allDogs: [],
  myDogs: [],
  externalDogs: [],
  father: null,
  mother: null,
  simulationResults: [],
  editingDogId: null,
  selectedFatherDogId: null,
  selectedMotherDogId: null
};

let treeZoom = 1;

// ============================================================
// INICIALIZAÇÃO
// ============================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('Service Worker registered'))
    .catch(err => console.log('Service Worker registration failed'));
}

// LocalStorage Management
function saveDatabaseToLocalStorage() {
  localStorage.setItem('spitzDatabase', JSON.stringify(state.allDogs));
  updateComputedArrays();
  console.log('Database salvo:', state.allDogs);
}

function loadDatabaseFromLocalStorage() {
  const saved = localStorage.getItem('spitzDatabase');
  if (saved) {
    state.allDogs = JSON.parse(saved);
    updateComputedArrays();
    console.log('Database carregado:', state.allDogs);
  }
}

function updateComputedArrays() {
  state.myDogs = state.allDogs.filter(dog => dog.belongsToMe !== false);
  state.externalDogs = state.allDogs.filter(dog => dog.belongsToMe === false);
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
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(tabName).style.display = 'block';
  });
});

// ============================================================
// PEDIGREE BUILDER - FUNÇÕES DE ABAS
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
  
  state.allDogs.push(newParent);
  saveDatabaseToLocalStorage();
  
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
}

// ============================================================
// KENNEL MANAGEMENT
// ============================================================

function toggleRegisterDog(dogId = null) {
  const form = document.getElementById('registerDogForm');
  
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    resetPedigreeBuilder();
    
    if (dogId) {
      state.editingDogId = dogId;
      const dog = state.allDogs.find(d => d.id === dogId);
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
  
  if (dog.provenColors && dog.provenColors.length > 0) {
    const provenSelect = document.getElementById('dogProvenColors');
    Array.from(provenSelect.options).forEach(option => {
      option.selected = dog.provenColors.includes(option.value);
    });
  }

  updateDogMaskVisibility();
  updateDogIntensityLabel();
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
// AUTOCOMPLETE DE PEDIGREE
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

  const matches = state.allDogs.filter(dog => 
    dog.sex === sex && dog.name.toLowerCase().includes(input)
  );

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
  const dog = state.allDogs.find(d => d.id === dogId);
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

  if (parentType === 'father') {
    state.selectedFatherDogId = dogId;
  } else {
    state.selectedMotherDogId = dogId;
  }
}

// ============================================================
// SAVE DOG WITH PEDIGREE
// ============================================================

function saveDogWithPedigree() {
  const dogId = document.getElementById('dogId').value || Date.now().toString();
  
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
    provenColors: Array.from(document.getElementById('dogProvenColors').selectedOptions).map(o => o.value),
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
  
  const father = newDog.fatherDogId ? state.allDogs.find(d => d.id === newDog.fatherDogId) : null;
  const mother = newDog.motherDogId ? state.allDogs.find(d => d.id === newDog.motherDogId) : null;
  
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
  
  if (state.editingDogId) {
    const index = state.allDogs.findIndex(d => d.id === state.editingDogId);
    state.allDogs[index] = newDog;
  } else {
    state.allDogs.push(newDog);
  }
  
  saveDatabaseToLocalStorage();
  toggleRegisterDog();
  renderKennelList();
  renderDatabaseList();
  updateSelectionSelects();
  state.selectedFatherDogId = null;
  state.selectedMotherDogId = null;
  
  alert(`✓ ${newDog.name} ${state.editingDogId ? 'atualizado' : 'registrado'} com sucesso!`);
}

// ============================================================
// RENDER KENNEL LIST
// ============================================================

function renderKennelList() {
  const list = document.getElementById('kennelList');
  
  if (state.myDogs.length === 0) {
    list.innerHTML = '<p class="placeholder">Nenhum cão registrado. Clique em "Registrar Novo Cão" para começar!</p>';
    return;
  }

  let html = '<div class="dogs-list">';
  
  state.myDogs.forEach(dog => {
    const father = dog.fatherDogId ? state.allDogs.find(d => d.id === dog.fatherDogId) : null;
    const mother = dog.motherDogId ? state.allDogs.find(d => d.id === dog.motherDogId) : null;

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
          <p><strong>Diluição:</strong> ${dog.dilution}</p>
          <p><strong>Marcação:</strong> ${dog.marking}</p>
          <p><strong>Merle:</strong> ${dog.merle}</p>
        </div>

        ${father || mother ? `
          <div class="dog-pedigree">
            <strong>Pedigree:</strong><br>
            Pai: ${father ? father.name : dog.fatherName || 'Não registrado'}<br>
            Mãe: ${mother ? mother.name : dog.motherName || 'Não registrada'}
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

// ============================================================
// RENDER DATABASE LIST
// ============================================================

function renderDatabaseList() {
  const list = document.getElementById('databaseList');
  
  if (state.externalDogs.length === 0) {
    list.innerHTML = '<p class="placeholder">Nenhum cão externo registrado.</p>';
    return;
  }

  let html = '<div class="dogs-list">';
  
  state.externalDogs.forEach(dog => {
    html += `
      <div class="dog-card-kennel" style="opacity: 0.8;">
        <div class="dog-header-kennel">
          <h4>${dog.name} ${dog.sex === 'M' ? '♂' : '♀'}</h4>
          <div class="dog-actions">
            <button class="btn-action" onclick="toggleRegisterDog('${dog.id}')" title="Editar">✏️</button>
            <button class="btn-action btn-delete" onclick="deleteDog('${dog.id}')" title="Deletar">🗑️</button>
          </div>
        </div>

        <div class="dog-details">
          <p><strong>Cor:</strong> ${dog.baseColor}</p>
          <p><strong>Fonte:</strong> Pedigree</p>
        </div>
      </div>
    `;
  });

  html += '</div>';
  list.innerHTML = html;
}

function deleteDog(dogId) {
  if (confirm('Tem certeza que deseja deletar este cão?')) {
    state.allDogs = state.allDogs.filter(dog => dog.id !== dogId);
    saveDatabaseToLocalStorage();
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

  const dog = state.allDogs.find(d => d.id === dogId);
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

  const dog = state.allDogs.find(d => d.id === dogId);
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
// PEDIGREE TREE VISUALIZATION - ÁRVORE COMPLETA RECURSIVA
// ============================================================

function showTreeModal(dogId) {
  const dog = state.allDogs.find(d => d.id === dogId);
  const modal = document.getElementById('treeModal');
  const treeViz = document.getElementById('treeVisualization');

  const treeData = buildPedigreeTree(dog);
  const treeHTML = renderPedigreeTree(treeData, 0);

  treeViz.innerHTML = `
    <div class="pedigree-tree-container">
      <div class="tree-root">
        <div class="tree-node current-dog">
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
  setupTreeInteractions();
}

function buildPedigreeTree(dog, depth = 0, maxDepth = 10) {
  if (depth > maxDepth || !dog) {
    return null;
  }

  const father = dog.fatherDogId ? state.allDogs.find(d => d.id === dog.fatherDogId) : null;
  const mother = dog.motherDogId ? state.allDogs.find(d => d.id === dog.motherDogId) : null;

  return {
    id: dog.id,
    name: dog.name,
    baseColor: dog.baseColor,
    sex: dog.sex,
    genotype: dog.genotype,
    fatherName: dog.fatherName,
    motherName: dog.motherName,
    father: father ? buildPedigreeTree(father, depth + 1, maxDepth) : null,
    mother: mother ? buildPedigreeTree(mother, depth + 1, maxDepth) : null,
    depth: depth
  };
}

function renderPedigreeTree(node, parentX = 0) {
  if (!node) return '';

  const nodeWidth = 200;
  const levelHeight = 140;
  const spacing = 280;

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

    html += renderPedigreeTree(node.father, fatherX);
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

    html += renderPedigreeTree(node.mother, motherX);
  }

  return html;
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
// INFERÊNCIA GENÉTICA COM PEDIGREE E HISTÓRICO DE CORES
// ============================================================

function inferGenotypeWithPedigreeAndProvenColors(characteristics, fatherId, motherId, provenColors = []) {
  let genotype = inferGenotype(characteristics);

  const father = fatherId ? state.allDogs.find(d => d.id === fatherId) : null;
  const mother = motherId ? state.allDogs.find(d => d.id === motherId) : null;

  if (checkChocolateInPedigree(father) || checkChocolateInPedigree(mother)) {
    if (characteristics.baseColor !== 'chocolate') {
      genotype.Locus_B = ['B', 'b'];
    }
  }

  if (checkDilutionInPedigree(father) || checkDilutionInPedigree(mother)) {
    if (characteristics.dilution === 'densa') {
      genotype.Locus_D = ['D', 'd'];
    }
  }

  if (checkCreamInPedigree(father) || checkCreamInPedigree(mother)) {
    if (characteristics.baseColor !== 'creme' && characteristics.baseColor !== 'branco') {
      genotype.Locus_E = ['E', 'e'];
    }
  }

  if (provenColors && provenColors.length > 0) {
    console.log('Histórico de cores:', provenColors);

    if (provenColors.includes('chocolate') && characteristics.baseColor !== 'chocolate') {
      genotype.Locus_B = ['B', 'b'];
    }

    if ((provenColors.includes('creme') || provenColors.includes('branco')) && 
        characteristics.baseColor !== 'creme' && characteristics.baseColor !== 'branco') {
      genotype.Locus_E = ['E', 'e'];
    }

    if (provenColors.includes('merle') && characteristics.merle === 'nao') {
      genotype.Locus_M = ['M', 'm'];
    }
  }

  return genotype;
}

// ============================================================
// FUNÇÕES DE BUSCA RECURSIVA EM PEDIGREE
// ============================================================

function checkChocolateInPedigree(dog) {
  if (!dog) return false;
  if (dog.baseColor === 'chocolate') return true;
  if (dog.genotype && dog.genotype.Locus_B && dog.genotype.Locus_B.includes('b')) return true;

  const father = dog.fatherDogId ? state.allDogs.find(d => d.id === dog.fatherDogId) : null;
  const mother = dog.motherDogId ? state.allDogs.find(d => d.id === dog.motherDogId) : null;

  return checkChocolateInPedigree(father) || checkChocolateInPedigree(mother);
}

function checkDilutionInPedigree(dog) {
  if (!dog) return false;
  if (dog.dilution === 'diluida') return true;
  if (dog.genotype && dog.genotype.Locus_D && dog.genotype.Locus_D.includes('d')) return true;

  const father = dog.fatherDogId ? state.allDogs.find(d => d.id === dog.fatherDogId) : null;
  const mother = dog.motherDogId ? state.allDogs.find(d => d.id === dog.motherDogId) : null;

  return checkDilutionInPedigree(father) || checkDilutionInPedigree(mother);
}

function checkCreamInPedigree(dog) {
  if (!dog) return false;
  if (dog.baseColor === 'creme' || dog.baseColor === 'branco') return true;
  if (dog.genotype && dog.genotype.Locus_E && dog.genotype.Locus_E.includes('e')) return true;

  const father = dog.fatherDogId ? state.allDogs.find(d => d.id === dog.fatherDogId) : null;
  const mother = dog.motherDogId ? state.allDogs.find(d => d.id === dog.motherDogId) : null;

  return checkCreamInPedigree(father) || checkCreamInPedigree(mother);
}

function checkAgoutiInPedigree(dog) {
  if (!dog) return false;
  if (dog.genotype && dog.genotype.Locus_K && dog.genotype.Locus_K.includes('k')) {
    return true;
  }

  const father = dog.fatherDogId ? state.allDogs.find(d => d.id === dog.fatherDogId) : null;
  const mother = dog.motherDogId ? state.allDogs.find(d => d.id === dog.motherDogId) : null;

  return checkAgoutiInPedigree(father) || checkAgoutiInPedigree(mother);
}

function checkParticulorInPedigree(dog) {
  if (!dog) return false;
  
  if (dog.marking === 'particolor' || dog.genotype?.Locus_S?.includes('sp')) {
    return true;
  }

  const father = dog.fatherDogId ? state.allDogs.find(d => d.id === dog.fatherDogId) : null;
  const mother = dog.motherDogId ? state.allDogs.find(d => d.id === dog.motherDogId) : null;

  return checkParticulorInPedigree(father) || checkParticulorInPedigree(mother);
}

// ============================================================
// INFERÊNCIA DE GENÓTIPO BASE
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

  genotype.Locus_D = characteristics.dilution === 'diluida' ? ['d', 'd'] : ['D', 'D'];

  switch (characteristics.marking) {
    case 'solido':
      if (genotype.Locus_K[1] === 'k') {
        // Deixar como está
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

  if (characteristics.mask === 'mascara_negra') {
    genotype.Locus_E = ['Em', 'Em'];
  }

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

  genotype.Locus_T = characteristics.ticking === 'com_pintas' ? ['T', 't'] : ['t', 't'];

  return genotype;
}

// ============================================================
// QUADRADO DE PUNNETT
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
// GENÓTIPO → FENÓTIPO
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

  if (M[0] === 'm' && M[1] === 'm') {
    phenotype.merle = 'Sem Merle';
  } else if (M.includes('Mh')) {
    phenotype.merle = 'Harlequin Merle';
  } else if (M.includes('M')) {
    phenotype.merle = 'Merle Padrão';
  } else if (M.includes('Mc')) {
    phenotype.merle = 'Merle Cripto';
  }

  const hasWhiteMarkings = !S.every(s => s === 'S');
  
  if (!hasWhiteMarkings) {
    phenotype.ticking = 'N/A (Invisível)';
  } else {
    phenotype.ticking = (T[0] === 'T' || T[1] === 'T')
      ? 'Com Pintas/Sardas'
      : 'Sem Pintas';
  }

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

  const merleCount = M.filter(a => a !== 'm').length;
  if (merleCount === 2) {
    alerts.push({
      risk: 'Double Merle (MM ou variante dupla)',
      consequence: 'Cegueira, Sordez, Microftalmia - ALTO RISCO GENÉTICO',
      severity: 'CRÍTICA'
    });
  }

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

  state.father = null;
  state.mother = null;
  state.simulationResults = [];

  const father = state.allDogs.find(d => d.id === fatherId);
  const mother = state.allDogs.find(d => d.id === motherId);

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

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  updateOfflineStatus();
  loadDatabaseFromLocalStorage();
  setupAutocomplete();
  renderKennelList();
  renderDatabaseList();
  updateSelectionSelects();
  
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
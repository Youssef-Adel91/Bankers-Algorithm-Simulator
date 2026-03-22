// Navigation active link
const navLinks = document.querySelectorAll('nav a');
navLinks.forEach(link => {
  link.addEventListener('click', function() {
    navLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');
  });
});

// Tab switching in simulator
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
  tab.addEventListener('click', function() {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    this.classList.add('active');
    document.querySelector(`.${this.dataset.tab}-tab`).classList.add('active');
  });
});

// Stepper for processes/resources
const procInput = document.getElementById('num-processes');
const resInput = document.getElementById('num-resources');
document.getElementById('dec-proc').onclick = () => {
  if (procInput.value > 1) procInput.value--;
};
document.getElementById('inc-proc').onclick = () => {
  if (procInput.value < 10) procInput.value++;
};
document.getElementById('dec-res').onclick = () => {
  if (resInput.value > 1) resInput.value--;
};
document.getElementById('inc-res').onclick = () => {
  if (resInput.value < 10) resInput.value++;
};

// --- Banker's Algorithm Class ---
class BankersAlgorithm {
  constructor(processes, resources) {
    this.processes = processes;
    this.resources = resources;
    this.max = Array.from({ length: processes }, () => Array(resources).fill(0));
    this.allocation = Array.from({ length: processes }, () => Array(resources).fill(0));
    this.available = Array(resources).fill(0);
    this.need = Array.from({ length: processes }, () => Array(resources).fill(0));
  }

  setMax(max) {
    this.max = max;
    this.calculateNeed();
  }

  setAllocation(allocation) {
    this.allocation = allocation;
    this.calculateNeed();
  }

  setAvailable(available) {
    this.available = available;
  }

  calculateNeed() {
    for (let i = 0; i < this.processes; i++) {
      for (let j = 0; j < this.resources; j++) {
        this.need[i][j] = this.max[i][j] - this.allocation[i][j];
      }
    }
  }

  isSafe() {
    const work = [...this.available];
    const finish = Array(this.processes).fill(false);
    const safeSeq = [];
    const steps = [];
    let count = 0;
    while (count < this.processes) {
      let found = false;
      for (let i = 0; i < this.processes; i++) {
        if (!finish[i]) {
          let possible = true;
          for (let j = 0; j < this.resources; j++) {
            if (this.need[i][j] > work[j]) {
              possible = false;
              break;
            }
          }
          if (possible) {
            steps.push(`Process P${i} can be satisfied (Need: [${this.need[i]}], Work: [${work}]).`);
            for (let j = 0; j < this.resources; j++) {
              work[j] += this.allocation[i][j];
            }
            safeSeq.push(i);
            finish[i] = true;
            found = true;
            count++;
            steps.push(`Process P${i} finishes, releases resources. New Work: [${work}].`);
          }
        }
      }
      if (!found) {
        steps.push('No further process can be satisfied. System is UNSAFE.');
        return { safe: false, sequence: [], steps };
      }
    }
    steps.push('All processes can finish. System is SAFE.');
    return { safe: true, sequence: safeSeq, steps };
  }
}

// --- UI Integration ---

const matrixArea = document.getElementById('simulator-matrix-area');
const checkSafetyBtn = document.getElementById('check-safety');
const resultsArea = document.getElementById('simulator-results');

function createTableBlock(title, id, rows, cols, editable, data, rowLabels, colLabels) {
  let html = `<div class="sim-table-block"><h4>${title}</h4><table class="sim-table" id="${id}"><thead><tr>`;
  if (rowLabels) html += '<th></th>';
  for (let j = 0; j < cols; j++) {
    html += `<th>${colLabels ? colLabels[j] : 'R'+j}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (let i = 0; i < rows; i++) {
    html += '<tr>';
    if (rowLabels) html += `<th>${rowLabels[i]}</th>`;
    for (let j = 0; j < cols; j++) {
      if (editable) {
        html += `<td><input type="number" min="0" value="${data ? data[i][j] : 0}" data-i="${i}" data-j="${j}"></td>`;
      } else {
        html += `<td>${data ? data[i][j] : 0}</td>`;
      }
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function createVectorBlock(title, id, cols, editable, data, colLabels) {
  let html = `<div class="sim-table-block"><h4>${title}</h4><table class="sim-table" id="${id}"><thead><tr>`;
  for (let j = 0; j < cols; j++) {
    html += `<th>${colLabels ? colLabels[j] : 'R'+j}</th>`;
  }
  html += '</tr></thead><tbody><tr>';
  for (let j = 0; j < cols; j++) {
    if (editable) {
      html += `<td><input type="number" min="0" value="${data ? data[j] : 0}" data-j="${j}"></td>`;
    } else {
      html += `<td>${data ? data[j] : 0}</td>`;
    }
  }
  html += '</tr></tbody></table></div>';
  return html;
}

function updateNeedMatrix() {
  const p = parseInt(procInput.value);
  const r = parseInt(resInput.value);
  const maxInputs = document.querySelectorAll('#max-matrix input');
  const allocInputs = document.querySelectorAll('#alloc-matrix input');
  const needTable = document.getElementById('need-matrix');
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < r; j++) {
      const maxVal = parseInt(maxInputs[i*r+j].value) || 0;
      const allocVal = parseInt(allocInputs[i*r+j].value) || 0;
      needTable.rows[i+1].cells[j+(needTable.rows[0].cells.length===r+1?1:0)].textContent = Math.max(maxVal - allocVal, 0);
    }
  }
}

document.getElementById('init-matrices').onclick = () => {
  const p = parseInt(procInput.value);
  const r = parseInt(resInput.value);
  const rowLabels = Array.from({length: p}, (_, i) => 'P'+i);
  const colLabels = Array.from({length: r}, (_, i) => 'R'+i);
  let html = '';
  html += createVectorBlock('Available Resources <span class="info" title="Resources available for allocation.">i</span>', 'avail-matrix', r, true, null, colLabels);
  html += createTableBlock('Maximum Demand <span class="info" title="Maximum resources each process may request.">i</span>', 'max-matrix', p, r, true, null, rowLabels, colLabels);
  html += createTableBlock('Current Allocation <span class="info" title="Resources currently allocated to each process.">i</span>', 'alloc-matrix', p, r, true, null, rowLabels, colLabels);
  html += createTableBlock('Need Matrix <span class="info" title="Resources each process still needs (Max - Allocation).">i</span>', 'need-matrix', p, r, false, null, rowLabels, colLabels);
  matrixArea.innerHTML = html;
  checkSafetyBtn.style.display = 'block';
  resultsArea.innerHTML = '';
  // Add listeners to update Need matrix
  document.querySelectorAll('#max-matrix input, #alloc-matrix input').forEach(input => {
    input.addEventListener('input', updateNeedMatrix);
  });
  updateNeedMatrix();
};

checkSafetyBtn.onclick = () => {
  const p = parseInt(procInput.value);
  const r = parseInt(resInput.value);
  // Gather matrices
  const alloc = Array.from({length: p}, () => Array(r).fill(0));
  const max = Array.from({length: p}, () => Array(r).fill(0));
  const available = Array(r).fill(0);
  const allocInputs = document.querySelectorAll('#alloc-matrix input');
  allocInputs.forEach(input => {
    const i = parseInt(input.dataset.i);
    const j = parseInt(input.dataset.j);
    alloc[i][j] = parseInt(input.value) || 0;
  });
  const maxInputs = document.querySelectorAll('#max-matrix input');
  maxInputs.forEach(input => {
    const i = parseInt(input.dataset.i);
    const j = parseInt(input.dataset.j);
    max[i][j] = parseInt(input.value) || 0;
  });
  const availInputs = document.querySelectorAll('#avail-matrix input');
  availInputs.forEach(input => {
    const j = parseInt(input.dataset.j);
    available[j] = parseInt(input.value) || 0;
  });
  // Run algorithm
  const ba = new BankersAlgorithm(p, r);
  ba.setAllocation(alloc);
  ba.setMax(max);
  ba.setAvailable(available);
  const result = ba.isSafe();
  // Build result card
  let html = '<div class="sim-result-card">';
  html += '<h3>Analysis Result</h3>';
  html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">
    <span></span>
    <span style="font-weight:700;color:${result.safe ? '#43d477' : '#ff6e6e'};font-size:1.1rem;">
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${result.safe ? '#43d477' : '#ff6e6e'};margin-right:0.5em;"></span>
      System is in a <span style="font-weight:900;">${result.safe ? 'SAFE' : 'UNSAFE'}</span> state
    </span>
  </div>`;
  html += '<div style="margin-bottom:1.2rem;"><b>Safe Sequence (if exists)</b><div class="safe-seq">';
  if (result.safe) {
    result.sequence.forEach(i => {
      html += `<span class="seq-pill">P${i}</span>`;
    });
  } else {
    html += '<span style="color:#ff6e6e;">No safe sequence</span>';
  }
  html += '</div></div>';
  html += '<b>Explanation</b><div class="explanation">';
  html += '<ul style="margin-top:1em;">';
  result.steps.forEach(step => {
    html += `<li>${step}</li>`;
  });
  html += '</ul></div>';
  html += '</div>';
  resultsArea.innerHTML = html;
  window.scrollTo({top: resultsArea.offsetTop-100, behavior: 'smooth'});
};

// Stepper for processes/resources
function updateStepperBtns() {
  document.getElementById('dec-proc').disabled = procInput.value <= 1;
  document.getElementById('inc-proc').disabled = procInput.value >= 10;
  document.getElementById('dec-res').disabled = resInput.value <= 1;
  document.getElementById('inc-res').disabled = resInput.value >= 10;
}
procInput.addEventListener('input', updateStepperBtns);
resInput.addEventListener('input', updateStepperBtns);
updateStepperBtns();

// Light/Dark mode toggle
const modeToggle = document.getElementById('mode-toggle');
modeToggle.addEventListener('change', function() {
  if (this.checked) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
  }
});
window.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    modeToggle.checked = true;
  } else {
    document.body.classList.remove('dark-mode');
    modeToggle.checked = false;
  }
});

// Collapsible panels for mobile (optional, for future expansion)
// ...

// Example data for each scenario
const EXAMPLES = {
  safe: {
    available: [3, 3, 2],
    max: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3]
    ],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2]
    ]
  },
  unsafe: {
    available: [0, 2, 0],
    max: [
      [2, 2, 2],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3]
    ],
    allocation: [
      [2, 0, 0],
      [0, 2, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2]
    ]
  },
  intensive: {
    available: [1, 1, 2],
    max: [
      [2, 1, 2],
      [1, 3, 5],
      [3, 2, 2],
      [4, 3, 3],
      [2, 2, 2]
    ],
    allocation: [
      [1, 0, 0],
      [0, 2, 2],
      [2, 1, 1],
      [1, 1, 2],
      [0, 0, 1]
    ]
  }
};

function fillExample(example) {
  procInput.value = 5;
  resInput.value = 3;
  document.getElementById('init-matrices').click();
  setTimeout(() => {
    // Fill Available
    const availInputs = document.querySelectorAll('#avail-matrix input');
    EXAMPLES[example].available.forEach((val, j) => {
      availInputs[j].value = val;
    });
    // Fill Max
    const maxInputs = document.querySelectorAll('#max-matrix input');
    EXAMPLES[example].max.forEach((row, i) => {
      row.forEach((val, j) => {
        maxInputs[i*3+j].value = val;
      });
    });
    // Fill Allocation
    const allocInputs = document.querySelectorAll('#alloc-matrix input');
    EXAMPLES[example].allocation.forEach((row, i) => {
      row.forEach((val, j) => {
        allocInputs[i*3+j].value = val;
      });
    });
    updateNeedMatrix();
    // Scroll to simulator
    document.getElementById('simulator').scrollIntoView({behavior: 'smooth'});
    // Run safety check
    setTimeout(() => checkSafetyBtn.click(), 200);
  }, 200);
}

document.querySelectorAll('.load-example').forEach(btn => {
  btn.onclick = () => {
    const ex = btn.dataset.example;
    fillExample(ex);
  };
}); 
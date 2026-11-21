const DEFAULT_CLINIC = {
  name: "Sua Odontologia",
  sub: "Odontologia Humanizada · CRO-SP",
  address: "Av. Paulista, 1420 · Convênio no local",
  whatsapp: "5511999999999",
  color: "#0F4C5C",
  dentists: [
    {
      id: "d1",
      name: "Dra. Camila Mendes",
      cro: "Ortodontia & Estética · CRO-SP 118.420",
      bio: "Especialista em alinhadores invisíveis e harmonização do sorriso pela USP, com foco em atendimento sem pressa."
    },
    {
      id: "d2",
      name: "Dr. Rafael Costa",
      cro: "Implantodontia & Prótese · CRO-SP 94.315",
      bio: "Mestre em reabilitação oral e cirurgia guiada por tomografia 3D, com mais de 12 anos de prática clínica."
    },
    {
      id: "d3",
      name: "Dra. Beatriz Lima",
      cro: "Clínica Geral & Endodontia · CRO-SP 126.804",
      bio: "Atua em prevenção, canal em sessão única com microscopia e atendimento acolhedor para pacientes com receio."
    },
    {
      id: "any",
      name: "Primeiro horário livre",
      cro: "Qualquer dentista disponível",
      bio: ""
    }
  ],
  treatments: [
    {
      id: "t1",
      category: "Prevencao",
      categoryLabel: "Prevenção",
      name: "Avaliação + Limpeza Completa",
      desc: "Mais do que uma limpeza comum: fazemos um check-up digital completo dente a dente, removemos tártaro e placa com ultrassom suave e finalizamos com polimento e flúor para proteger o esmalte.",
      why: "Você enxerga tudo na tela com nossa câmera intraoral e recebe um plano preventivo claro, sem empurrar procedimentos desnecessários.",
      price: 180,
      duration: 45
    },
    {
      id: "t2",
      category: "Estetica",
      categoryLabel: "Estética",
      name: "Clareamento Dental a Laser",
      desc: "Indicado para quem busca dentes visivelmente mais brancos em poucas sessões, removendo manchas causadas por café, vinho e tempo com controle rigoroso de tonalidade.",
      why: "Aplicamos barreira gengival protetora e gel dessensibilizante antes e depois da sessão para clarear com máximo conforto e mínima sensibilidade.",
      price: 490,
      duration: 60
    },
    {
      id: "t3",
      category: "Reabilitacao",
      categoryLabel: "Ortodontia & Implantes",
      name: "Ortodontia & Alinhadores Invisíveis",
      desc: "Alinhamento dentário discreto e previsível para corrigir mordida, apinhamento ou espaçamentos — com opções de alinhadores transparentes ou aparelhos estéticos.",
      why: "Substituímos a moldagem tradicional pelo escaneamento 3D e mostramos a simulação do seu novo sorriso antes mesmo de começar.",
      price: 160,
      duration: 40
    },
    {
      id: "t4",
      category: "Estetica",
      categoryLabel: "Estética",
      name: "Lentes de Contato Dental",
      desc: "Lâminas ultrafinas de porcelana ou resina esculpidas para harmonizar formato, proporção e cor dos dentes, mantendo o aspecto natural do seu rosto.",
      why: "Trabalhamos com planejamento digital do sorriso e desgaste mínimo, preservando ao máximo a estrutura saudável dos seus dentes.",
      price: 350,
      duration: 60
    },
    {
      id: "t5",
      category: "Reabilitacao",
      categoryLabel: "Ortodontia & Implantes",
      name: "Implante Dentário (Planejamento 3D)",
      desc: "Solução fixa e definitiva para repor um ou mais dentes perdidos, devolvendo segurança para mastigar, falar e sorrir sem próteses móveis.",
      why: "Cirurgia guiada por tomografia computadorizada e anestesia eletrônica, garantindo recuperação mais rápida e pós-operatório tranquilo.",
      price: 240,
      duration: 50
    },
    {
      id: "t6",
      category: "Prevencao",
      categoryLabel: "Urgência Hoje",
      name: "Urgência / Alívio de Dor",
      desc: "Atendimento prioritário no mesmo dia para dor aguda, dente quebrado, inchaço, cárie profunda ou restauração que soltou.",
      why: "Reservamos encaixes diários exclusivos para que você não precise passar a noite ou o fim de semana com dor.",
      price: 200,
      duration: 30
    }
  ]
};

const SLOTS = ["08:30", "09:15", "10:00", "10:45", "11:30", "14:00", "14:45", "15:30", "16:15", "17:00", "17:45", "18:30"];
const CFG_KEY = "odonto_editorial_cfg_v3";
const BKG_KEY = "odonto_editorial_bkg_v3";

function buildDays() {
  const days = [];
  const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: i === 0 ? "Hoje" : names[d.getDay()],
      shortDate: `${dd}/${mm}`
    });
  }
  return days;
}

const DAYS = buildDays();

function loadClinicConfig() {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return structuredClone(DEFAULT_CLINIC);
}

function loadClinicBookings(cfg) {
  try {
    const raw = localStorage.getItem(BKG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: "c1",
      patientName: "Juliana Martins",
      patientPhone: "(11) 98412-3300",
      treatmentName: cfg.treatments[0].name,
      price: cfg.treatments[0].price,
      dentistName: cfg.dentists[0].name,
      date: DAYS[0].iso,
      dateLabel: `${DAYS[0].label} (${DAYS[0].shortDate})`,
      time: "10:00",
      status: "Confirmado"
    },
    {
      id: "c2",
      patientName: "Roberto Almeida",
      patientPhone: "(11) 97123-8899",
      treatmentName: cfg.treatments[1].name,
      price: cfg.treatments[1].price,
      dentistName: cfg.dentists[1].name,
      date: DAYS[0].iso,
      dateLabel: `${DAYS[0].label} (${DAYS[0].shortDate})`,
      time: "15:30",
      status: "Pendente"
    }
  ];
}

let clinic = loadClinicConfig();
let appointments = loadClinicBookings(clinic);
let selectedTreatment = clinic.treatments[0];
let selectedDentist = clinic.dentists[0];
let selectedDay = DAYS[0];
let selectedSlot = null;
let treatmentCat = "all";
let statusFilter = "all";

function persist() {
  localStorage.setItem(CFG_KEY, JSON.stringify(clinic));
  localStorage.setItem(BKG_KEY, JSON.stringify(appointments));
}

function formatBRL(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function hexAlpha(hex, a) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) || 15;
  const g = parseInt(c.slice(2, 4), 16) || 76;
  const b = parseInt(c.slice(4, 6), 16) || 92;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "SO";
}

function applyClinicBrand() {
  document.documentElement.style.setProperty("--brand", clinic.color);
  document.documentElement.style.setProperty("--brand-soft", hexAlpha(clinic.color, 0.08));

  document.getElementById("clinic-logo").textContent = initials(clinic.name);
  document.getElementById("clinic-name").textContent = clinic.name;
  document.getElementById("clinic-sub").textContent = clinic.sub;
  document.getElementById("hero-clinic-span").textContent = clinic.name;
  document.getElementById("admin-clinic-name").textContent = clinic.name;
  document.getElementById("footer-name").textContent = clinic.name;
  document.getElementById("clinic-address").textContent = clinic.address;
  document.getElementById("footer-address").textContent = clinic.address;
  document.querySelectorAll(".clinic-inline-name").forEach((el) => {
    el.textContent = clinic.name;
  });
  document.title = `${clinic.name} | Odontologia & Agendamento`;

  const quickInput = document.getElementById("quick-clinic-name");
  if (document.activeElement !== quickInput) {
    quickInput.value = clinic.name === DEFAULT_CLINIC.name ? "" : clinic.name;
  }

  document.getElementById("cfg-name").value = clinic.name;
  document.getElementById("cfg-sub").value = clinic.sub;
  document.getElementById("cfg-address").value = clinic.address;
  document.getElementById("cfg-whatsapp").value = clinic.whatsapp;
  document.getElementById("cfg-color").value = clinic.color;
  renderTreatments();
}

function updateSummary() {
  document.getElementById("sum-service").textContent = selectedTreatment ? selectedTreatment.name : "Selecione um tratamento";
  document.getElementById("sum-dentist").textContent = selectedDentist ? selectedDentist.name : "—";
  document.getElementById("sum-datetime").textContent = selectedSlot
    ? `${selectedDay.label} (${selectedDay.shortDate}) às ${selectedSlot}`
    : `${selectedDay.label} · escolha o horário`;
  document.getElementById("sum-price").textContent = selectedTreatment ? formatBRL(selectedTreatment.price) : "R$ 0,00";
}

function renderTreatments() {
  const grid = document.getElementById("treatments-grid");
  grid.innerHTML = "";
  const list = clinic.treatments.filter((t) => treatmentCat === "all" || t.category === treatmentCat);

  list.forEach((t) => {
    const card = document.createElement("div");
    card.className = `treatment-card${selectedTreatment?.id === t.id ? " selected" : ""}`;
    card.innerHTML = `
      <div>
        <span class="treatment-cat">${t.categoryLabel}</span>
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
        ${
          t.why
            ? `<div class="treatment-why"><strong>Por que na ${clinic.name}?</strong>${t.why}</div>`
            : ""
        }
      </div>
      <div class="treatment-foot">
        <span class="treatment-price">${formatBRL(t.price)}</span>
        <span>${t.duration} min · Agendar este tratamento →</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectedTreatment = t;
      renderTreatments();
      updateSummary();
      document.getElementById("agendar").scrollIntoView({ behavior: "smooth" });
    });
    grid.appendChild(card);
  });
}

function renderDentists() {
  const list = document.getElementById("dentists-list");
  const team = document.getElementById("team-showcase");
  list.innerHTML = "";
  team.innerHTML = "";

  clinic.dentists.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `dentist-btn${selectedDentist?.id === d.id ? " selected" : ""}`;
    btn.innerHTML = `<strong>${d.name}</strong><span>${d.cro}</span>`;
    btn.addEventListener("click", () => {
      selectedDentist = d;
      renderDentists();
      updateSummary();
    });
    list.appendChild(btn);

    if (d.bio) {
      const card = document.createElement("article");
      card.className = "team-card";
      card.innerHTML = `
        <div class="team-monogram">${initials(d.name.replace(/^(Dr\.|Dra\.)\s+/i, ""))}</div>
        <h3>${d.name}</h3>
        <span class="team-cro">${d.cro}</span>
        <p>${d.bio}</p>
      `;
      team.appendChild(card);
    }
  });
}

function renderDays() {
  const grid = document.getElementById("days-grid");
  grid.innerHTML = "";
  DAYS.forEach((day) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `day-btn${selectedDay.iso === day.iso ? " selected" : ""}`;
    btn.innerHTML = `<span>${day.label}</span><strong>${day.shortDate}</strong>`;
    btn.addEventListener("click", () => {
      selectedDay = day;
      selectedSlot = null;
      renderDays();
      renderSlots();
      updateSummary();
    });
    grid.appendChild(btn);
  });
}

function renderSlots() {
  const grid = document.getElementById("slots-grid");
  grid.innerHTML = "";
  const busy = new Set(
    appointments
      .filter((a) => a.date === selectedDay.iso && a.status !== "Cancelado")
      .map((a) => a.time)
  );

  SLOTS.forEach((slot) => {
    const isBusy = busy.has(slot);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `slot-btn${isBusy ? " busy" : ""}${selectedSlot === slot ? " selected" : ""}`;
    btn.textContent = slot;
    btn.disabled = isBusy;
    if (!isBusy) {
      btn.addEventListener("click", () => {
        selectedSlot = slot;
        renderSlots();
        updateSummary();
      });
    }
    grid.appendChild(btn);
  });
}

function renderAgenda() {
  const active = appointments.filter((a) => a.status !== "Cancelado");
  const confirmed = appointments.filter((a) => a.status === "Confirmado");
  const pending = appointments.filter((a) => a.status === "Pendente");
  const revenue = active.reduce((sum, a) => sum + Number(a.price || 0), 0);

  document.getElementById("clinic-badge").textContent = active.length;
  document.getElementById("kpi-active").textContent = active.length;
  document.getElementById("kpi-confirmed").textContent = confirmed.length;
  document.getElementById("kpi-pending").textContent = pending.length;
  document.getElementById("kpi-revenue").textContent = formatBRL(revenue);

  const list = document.getElementById("agenda-list");
  list.innerHTML = "";
  const filtered = appointments.filter((a) => statusFilter === "all" || a.status === statusFilter);
  if (filtered.length === 0) {
    list.innerHTML = `<p style="color: var(--muted); margin: 0;">Nenhuma consulta nesta categoria.</p>`;
    return;
  }

  filtered.forEach((a) => {
    const item = document.createElement("div");
    item.className = "agenda-item";
    item.innerHTML = `
      <div class="agenda-info">
        <strong>${a.patientName} · ${a.treatmentName} (${formatBRL(a.price)})</strong>
        <span>${a.dateLabel} às ${a.time} · ${a.dentistName} · ${a.patientPhone}</span>
      </div>
      <div class="agenda-actions">
        <span class="status-badge status-${a.status}">${a.status}</span>
        ${a.status !== "Confirmado" ? `<button class="act-btn" data-act="confirm" data-id="${a.id}">Confirmar</button>` : ""}
        ${a.status !== "Cancelado" ? `<button class="act-btn" data-act="cancel" data-id="${a.id}">Cancelar</button>` : ""}
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll(".act-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = appointments.find((a) => a.id === btn.dataset.id);
      if (!target) return;
      target.status = btn.dataset.act === "confirm" ? "Confirmado" : "Cancelado";
      persist();
      renderAgenda();
      renderSlots();
    });
  });
}

// VIEW SWITCH
document.querySelectorAll(".switch-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".switch-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    const isPatient = btn.dataset.view === "patient";
    document.getElementById("patient-view").classList.toggle("hidden", !isPatient);
    document.getElementById("clinic-view").classList.toggle("hidden", isPatient);
  });
});

// TREATMENT CATEGORY TABS
document.querySelectorAll(".cat-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    treatmentCat = tab.dataset.cat;
    renderTreatments();
  });
});

// EMERGENCY JUMP
document.getElementById("emergency-jump").addEventListener("click", (e) => {
  e.preventDefault();
  const urgent = clinic.treatments.find((t) => t.id === "t6") || clinic.treatments[0];
  selectedTreatment = urgent;
  renderTreatments();
  updateSummary();
  document.getElementById("agendar").scrollIntoView({ behavior: "smooth" });
});

// QUICK CLINIC NAME INPUT
document.getElementById("quick-clinic-name").addEventListener("input", (e) => {
  clinic.name = e.target.value.trim() || DEFAULT_CLINIC.name;
  persist();
  applyClinicBrand();
});

// PATIENT FORM SUBMIT
document.getElementById("patient-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const errEl = document.getElementById("form-error");
  if (!selectedTreatment || !selectedSlot) {
    errEl.textContent = "Escolha o tratamento e um horário disponível antes de confirmar.";
    errEl.classList.remove("hidden");
    return;
  }
  errEl.classList.add("hidden");

  const patientName = document.getElementById("p-name").value.trim();
  const patientPhone = document.getElementById("p-phone").value.trim();
  const notes = document.getElementById("p-notes").value.trim();

  const record = {
    id: "c" + Date.now(),
    patientName,
    patientPhone,
    notes,
    treatmentName: selectedTreatment.name,
    price: selectedTreatment.price,
    dentistName: selectedDentist.name,
    date: selectedDay.iso,
    dateLabel: `${selectedDay.label} (${selectedDay.shortDate})`,
    time: selectedSlot,
    status: "Pendente"
  };

  appointments.unshift(record);
  persist();
  renderSlots();
  renderAgenda();

  const msg = encodeURIComponent(
    `Olá *${clinic.name}*! Acabei de agendar minha consulta pelo site:\n• Tratamento: ${record.treatmentName}\n• Dentista: ${record.dentistName}\n• Data: ${record.dateLabel} às ${record.time}\n• Paciente: ${record.patientName}`
  );
  const wa = clinic.whatsapp.replace(/\D/g, "") || "5511999999999";

  document.getElementById("success-text").textContent =
    `${record.treatmentName} com ${record.dentistName} em ${record.dateLabel} às ${record.time}.`;
  document.getElementById("wa-btn").href = `https://wa.me/${wa}?text=${msg}`;

  document.getElementById("patient-form").classList.add("hidden");
  document.getElementById("booking-success").classList.remove("hidden");
});

document.getElementById("another-btn").addEventListener("click", () => {
  selectedSlot = null;
  document.getElementById("patient-form").reset();
  document.getElementById("patient-form").classList.remove("hidden");
  document.getElementById("booking-success").classList.add("hidden");
  renderSlots();
  updateSummary();
});

// ADMIN FILTERS
document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    statusFilter = chip.dataset.status;
    renderAgenda();
  });
});

// DRAWER
const drawer = document.getElementById("customizer-drawer");
document.getElementById("open-customizer").addEventListener("click", () => drawer.classList.remove("hidden"));
document.getElementById("close-customizer").addEventListener("click", () => drawer.classList.add("hidden"));
document.getElementById("drawer-backdrop").addEventListener("click", () => drawer.classList.add("hidden"));

document.getElementById("cfg-name").addEventListener("input", (e) => {
  clinic.name = e.target.value.trim() || DEFAULT_CLINIC.name;
  persist();
  applyClinicBrand();
});
document.getElementById("cfg-sub").addEventListener("input", (e) => {
  clinic.sub = e.target.value;
  persist();
  applyClinicBrand();
});
document.getElementById("cfg-address").addEventListener("input", (e) => {
  clinic.address = e.target.value;
  persist();
  applyClinicBrand();
});
document.getElementById("cfg-whatsapp").addEventListener("input", (e) => {
  clinic.whatsapp = e.target.value;
  persist();
});
document.getElementById("cfg-color").addEventListener("input", (e) => {
  clinic.color = e.target.value;
  persist();
  applyClinicBrand();
});
document.querySelectorAll(".swatch").forEach((sw) => {
  sw.addEventListener("click", () => {
    clinic.color = sw.dataset.color;
    persist();
    applyClinicBrand();
  });
});

document.getElementById("add-proc-btn").addEventListener("click", () => {
  const name = document.getElementById("new-proc-name").value.trim();
  const price = Number(document.getElementById("new-proc-price").value);
  const duration = Number(document.getElementById("new-proc-dur").value) || 45;
  if (!name || !price) return;
  clinic.treatments.unshift({
    id: "t" + Date.now(),
    category: "Estetica",
    categoryLabel: "Personalizado",
    name,
    desc: "Procedimento personalizado da sua clínica.",
    price,
    duration
  });
  selectedTreatment = clinic.treatments[0];
  document.getElementById("new-proc-name").value = "";
  document.getElementById("new-proc-price").value = "";
  persist();
  renderTreatments();
  updateSummary();
});

document.getElementById("reset-btn").addEventListener("click", () => {
  clinic = structuredClone(DEFAULT_CLINIC);
  selectedTreatment = clinic.treatments[0];
  selectedDentist = clinic.dentists[0];
  selectedSlot = null;
  persist();
  applyClinicBrand();
  renderTreatments();
  renderDentists();
  renderSlots();
  updateSummary();
});

// INIT
applyClinicBrand();
renderTreatments();
renderDentists();
renderDays();
renderSlots();
updateSummary();
renderAgenda();

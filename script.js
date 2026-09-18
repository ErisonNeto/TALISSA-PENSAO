'use strict';

const WHATSAPP_NUMBER = '55XXXXXXXXXXX';

const state = {
  assunto: '',
  situacao: '',
  processo: ''
};

let currentStep = 1;
let lastFocusedElement = null;
let completionTracked = false;

const modal = document.getElementById('triageModal');
const modalCard = modal?.querySelector('.modal-card');
const progressBar = document.getElementById('progressBar');
const summary = document.getElementById('triageSummary');
const whatsappButton = document.getElementById('continueWhatsapp');
const situationOptions = document.getElementById('situationOptions');
const navbar = document.getElementById('navbar');
const menuButton = document.getElementById('menuButton');
const mobileMenu = document.getElementById('mobileMenu');
const waWidget = document.getElementById('waWidget');
const waFab = document.getElementById('waFab');
const waPopup = document.getElementById('waPopup');
const waClose = document.getElementById('waClose');
const year = document.getElementById('year');

const situationsByTopic = {
  'Pensão alimentícia': [
    ['Quero pedir pensão', 'Ainda não existe valor fixado'],
    ['A pensão está atrasada', 'Existem parcelas que não foram pagas'],
    ['Quero revisar o valor', 'O valor atual precisa ser reavaliado'],
    ['Outra situação com pensão', 'Quero explicar melhor no atendimento']
  ],
  'Pensão atrasada': [
    ['Existem parcelas em atraso', 'Quero entender como cobrar'],
    ['O pagamento é irregular', 'Alguns meses são pagos e outros não'],
    ['Não sei calcular o atraso', 'Preciso organizar os valores'],
    ['Outra situação', 'Quero explicar melhor no atendimento']
  ],
  'Revisão de pensão': [
    ['O valor ficou insuficiente', 'As necessidades mudaram'],
    ['Minha situação financeira mudou', 'Quero avaliar o valor atual'],
    ['A situação da outra parte mudou', 'Quero entender se cabe revisão'],
    ['Outra situação', 'Quero explicar melhor no atendimento']
  ],
  'Guarda e convivência': [
    ['Quero regularizar a guarda', 'Ainda não existe definição formal'],
    ['Existe conflito de convivência', 'Há dificuldade em organizar visitas ou convivência'],
    ['Já existe decisão e houve mudança', 'Quero avaliar a situação atual'],
    ['Outra situação', 'Quero explicar melhor no atendimento']
  ],
  'Divórcio': [
    ['Há acordo entre as partes', 'Quero entender o procedimento'],
    ['Não há acordo', 'Existem pontos de conflito'],
    ['Existem filhos ou patrimônio', 'Quero entender os reflexos do divórcio'],
    ['Outra situação', 'Quero explicar melhor no atendimento']
  ],
  'União estável': [
    ['Quero reconhecer a união', 'Preciso entender os efeitos jurídicos'],
    ['Quero encerrar a união', 'Preciso avaliar a dissolução'],
    ['Existe questão patrimonial', 'Há bens ou obrigações a analisar'],
    ['Outra situação', 'Quero explicar melhor no atendimento']
  ],
  'Outro assunto familiar': [
    ['Tenho uma dúvida familiar', 'Quero explicar a situação'],
    ['Já existe conflito ou processo', 'Preciso de orientação'],
    ['Preciso avaliar documentos', 'Quero entender os próximos passos']
  ]
};

function trackEvent(name, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}

function syncNavbarState() {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
}

function closeMobileMenu({ restoreFocus = false } = {}) {
  if (!mobileMenu || !menuButton) return;

  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');

  if (restoreFocus) menuButton.focus();
}

function toggleMobileMenu() {
  if (!mobileMenu || !menuButton) return;

  const willOpen = !mobileMenu.classList.contains('open');
  mobileMenu.classList.toggle('open', willOpen);
  mobileMenu.setAttribute('aria-hidden', String(!willOpen));
  menuButton.setAttribute('aria-expanded', String(willOpen));
  menuButton.setAttribute('aria-label', willOpen ? 'Fechar menu' : 'Abrir menu');
}

function setWhatsappPopup(open) {
  if (!waWidget || !waFab || !waPopup) return;

  waWidget.classList.toggle('open', open);
  waFab.setAttribute('aria-expanded', String(open));
  waPopup.setAttribute('aria-hidden', String(!open));
}

function clearSelected(field) {
  document.querySelectorAll(`.option[data-field="${field}"].selected`).forEach((element) => {
    element.classList.remove('selected');
  });
}

function syncTopicSelection() {
  clearSelected('assunto');
  if (!state.assunto) return;

  document
    .querySelector(`.option[data-field="assunto"][data-value="${CSS.escape(state.assunto)}"]`)
    ?.classList.add('selected');
}

function renderSituationOptions() {
  if (!situationOptions) return;

  const options = situationsByTopic[state.assunto] || situationsByTopic['Outro assunto familiar'];
  situationOptions.replaceChildren();

  options.forEach(([value, description]) => {
    const button = document.createElement('button');
    const title = document.createElement('span');
    const helper = document.createElement('small');

    button.type = 'button';
    button.className = 'option dynamic-option';
    button.dataset.value = value;
    title.textContent = value;
    helper.textContent = description;
    button.append(title, helper);

    if (state.situacao === value) button.classList.add('selected');

    button.addEventListener('click', () => {
      situationOptions.querySelectorAll('.selected').forEach((item) => item.classList.remove('selected'));
      state.situacao = value;
      button.classList.add('selected');

      window.setTimeout(() => {
        currentStep = 3;
        updateStep();
        focusActiveStep();
      }, 90);
    });

    situationOptions.appendChild(button);
  });
}

function getActiveStep() {
  return modal?.querySelector(`.triage-step[data-step="${currentStep}"]`);
}

function focusActiveStep() {
  const activeStep = getActiveStep();
  const target = activeStep?.querySelector('h2, button, [href], [tabindex]:not([tabindex="-1"])');
  target?.focus({ preventScroll: true });
}

function openModal(topic = '', trigger = null) {
  if (!modal) return;

  setWhatsappPopup(false);
  closeMobileMenu();
  lastFocusedElement = trigger || document.activeElement;
  completionTracked = false;

  state.assunto = topic || '';
  state.situacao = '';
  state.processo = '';
  currentStep = topic ? 2 : 1;

  document.querySelectorAll('.option.selected').forEach((element) => element.classList.remove('selected'));
  syncTopicSelection();
  if (topic) renderSituationOptions();

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  updateStep();
  window.requestAnimationFrame(focusActiveStep);

  trackEvent('triagem_iniciada', {
    lp: 'familia_pensao',
    origem: topic ? 'cta_contextual' : 'cta_geral',
    ...(topic ? { assunto_preselecionado: topic } : {})
  });
}

function closeModal() {
  if (!modal) return;

  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  if (lastFocusedElement instanceof HTMLElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function updateStep() {
  if (!modal || !progressBar) return;

  modal.querySelectorAll('.triage-step').forEach((step) => {
    const isActive = Number(step.dataset.step) === currentStep;
    step.classList.toggle('active', isActive);
    step.setAttribute('aria-hidden', String(!isActive));
  });

  progressBar.style.width = `${(currentStep / 4) * 100}%`;

  if (currentStep === 1) syncTopicSelection();
  if (currentStep === 2) renderSituationOptions();

  if (currentStep === 4 && summary) {
    summary.replaceChildren();

    [
      ['Assunto', state.assunto],
      ['Situação', state.situacao],
      ['Processo', state.processo]
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      const labelElement = document.createElement('span');
      const valueElement = document.createElement('strong');

      labelElement.textContent = label;
      valueElement.textContent = value;
      row.append(labelElement, valueElement);
      summary.appendChild(row);
    });

    if (!completionTracked) {
      completionTracked = true;
      trackEvent('triagem_concluida', {
        lp: 'familia_pensao',
        assunto: state.assunto,
        situacao: state.situacao,
        processo: state.processo
      });
    }
  }
}

function isWhatsappConfigured() {
  return /^55\d{10,11}$/.test(WHATSAPP_NUMBER);
}

function handleModalFocusTrap(event) {
  if (event.key !== 'Tab' || !modal?.classList.contains('open') || !modalCard) return;

  const focusable = Array.from(
    modalCard.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.offsetParent !== null);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function toggleFaq(question) {
  const item = question.closest('.faq-item');
  if (!item) return;

  const answer = item.querySelector('.faq-answer');
  const willOpen = !item.classList.contains('open');

  document.querySelectorAll('.faq-item.open').forEach((other) => {
    if (other === item) return;
    other.classList.remove('open');
    other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    other.querySelector('.faq-answer')?.setAttribute('aria-hidden', 'true');
  });

  item.classList.toggle('open', willOpen);
  question.setAttribute('aria-expanded', String(willOpen));
  answer?.setAttribute('aria-hidden', String(!willOpen));
}

if (year) year.textContent = String(new Date().getFullYear());

menuButton?.addEventListener('click', toggleMobileMenu);
mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => closeMobileMenu());
});

window.addEventListener('scroll', syncNavbarState, { passive: true });
syncNavbarState();

window.addEventListener('resize', () => {
  if (window.innerWidth > 940) closeMobileMenu();
});

document.querySelectorAll('.js-open-triage').forEach((element) => {
  element.addEventListener('click', (event) => {
    event.preventDefault();
    openModal(element.dataset.topic || '', element);
  });
});

document.querySelectorAll('[data-close-modal]').forEach((element) => {
  element.addEventListener('click', closeModal);
});

document.querySelectorAll('.option[data-field="assunto"]').forEach((button) => {
  button.addEventListener('click', () => {
    clearSelected('assunto');
    state.assunto = button.dataset.value || '';
    state.situacao = '';
    state.processo = '';
    button.classList.add('selected');

    window.setTimeout(() => {
      currentStep = 2;
      updateStep();
      focusActiveStep();
    }, 90);
  });
});

document.querySelectorAll('.option[data-field="processo"]').forEach((button) => {
  button.addEventListener('click', () => {
    clearSelected('processo');
    state.processo = button.dataset.value || '';
    button.classList.add('selected');

    window.setTimeout(() => {
      currentStep = 4;
      updateStep();
      focusActiveStep();
    }, 90);
  });
});

document.querySelectorAll('[data-back]').forEach((button) => {
  button.addEventListener('click', () => {
    currentStep = Math.max(1, currentStep - 1);
    updateStep();
    window.requestAnimationFrame(focusActiveStep);
  });
});

whatsappButton?.addEventListener('click', () => {
  if (!isWhatsappConfigured()) {
    window.alert('Configure o número do WhatsApp no arquivo script.js antes de publicar a página.');
    return;
  }

  const message = [
    'Olá, Dra. Talissa. Vim pelo site e gostaria de atendimento em Direito de Família.',
    '',
    `Assunto: ${state.assunto}`,
    `Situação: ${state.situacao}`,
    `Já existe processo em andamento: ${state.processo}`
  ].join('\n');

  trackEvent('whatsapp_apos_triagem', {
    lp: 'familia_pensao',
    assunto: state.assunto,
    situacao: state.situacao,
    processo: state.processo
  });

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
});

waFab?.addEventListener('click', () => {
  setWhatsappPopup(!waWidget?.classList.contains('open'));
});

waClose?.addEventListener('click', () => {
  setWhatsappPopup(false);
  waFab?.focus();
});

document.querySelectorAll('.faq-question').forEach((question) => {
  question.addEventListener('click', () => toggleFaq(question));
});

document.addEventListener('click', (event) => {
  if (waWidget && !waWidget.contains(event.target) && waWidget.classList.contains('open')) {
    setWhatsappPopup(false);
  }

  if (
    mobileMenu?.classList.contains('open') &&
    !mobileMenu.contains(event.target) &&
    !menuButton?.contains(event.target)
  ) {
    closeMobileMenu();
  }
});

document.addEventListener('keydown', (event) => {
  handleModalFocusTrap(event);

  if (event.key !== 'Escape') return;

  if (modal?.classList.contains('open')) {
    closeModal();
    return;
  }

  if (waWidget?.classList.contains('open')) {
    setWhatsappPopup(false);
    waFab?.focus();
    return;
  }

  if (mobileMenu?.classList.contains('open')) {
    closeMobileMenu({ restoreFocus: true });
  }
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -20px' }
  );

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
}

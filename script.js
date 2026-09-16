// CONFIGURAÇÃO: substitua pelo WhatsApp profissional da Talissa, apenas números.
// Exemplo: 5591999999999
const WHATSAPP_NUMBER = '55XXXXXXXXXXX';

const state = { assunto: '', situacao: '', processo: '' };
let currentStep = 1;

const modal = document.getElementById('triageModal');
const progressBar = document.getElementById('progressBar');
const summary = document.getElementById('triageSummary');
const whatsappButton = document.getElementById('continueWhatsapp');
const situationOptions = document.getElementById('situationOptions');
const navbar = document.getElementById('navbar');
const menuButton = document.getElementById('menuButton');
const mobileMenu = document.getElementById('mobileMenu');
const waWidget = document.getElementById('waWidget');
const waFab = document.getElementById('waFab');
const waClose = document.getElementById('waClose');

document.getElementById('year').textContent = new Date().getFullYear();

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
    ['Existe conflito de convivência', 'Há dificuldade em organizar visitas/convivência'],
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
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', () => {
  const open = !mobileMenu.classList.contains('open');
  mobileMenu.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
  menuButton.setAttribute('aria-expanded', String(open));
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20), { passive: true });

function renderSituationOptions() {
  const options = situationsByTopic[state.assunto] || situationsByTopic['Outro assunto familiar'];
  situationOptions.innerHTML = options.map(([value, sub]) => `
    <button type="button" class="option dynamic-option" data-value="${value.replace(/"/g, '&quot;')}">
      <span>${value}</span><small>${sub}</small>
    </button>`).join('');

  situationOptions.querySelectorAll('.dynamic-option').forEach(button => {
    button.addEventListener('click', () => {
      state.situacao = button.dataset.value;
      button.classList.add('selected');
      setTimeout(() => { currentStep = 3; updateStep(); }, 120);
    });
  });
}

function openModal(topic = '') {
  waWidget.classList.remove('open');
  waFab.setAttribute('aria-expanded', 'false');
  closeMobileMenu();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  state.assunto = topic || '';
  state.situacao = '';
  state.processo = '';
  document.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
  currentStep = topic ? 2 : 1;
  if (topic) renderSituationOptions();
  updateStep();
  trackEvent('triagem_iniciada', { lp: 'familia_pensao', origem: topic ? 'cta_contextual' : 'cta_geral', assunto_preselecionado: topic || undefined });
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function updateStep() {
  document.querySelectorAll('.triage-step').forEach(step => {
    step.classList.toggle('active', Number(step.dataset.step) === currentStep);
  });
  progressBar.style.width = `${(currentStep / 4) * 100}%`;

  if (currentStep === 2) renderSituationOptions();
  if (currentStep === 4) {
    summary.innerHTML = `
      <div><span>Assunto</span><strong>${state.assunto}</strong></div>
      <div><span>Situação</span><strong>${state.situacao}</strong></div>
      <div><span>Processo</span><strong>${state.processo}</strong></div>`;
    trackEvent('triagem_concluida', { lp: 'familia_pensao', assunto: state.assunto, situacao: state.situacao, processo: state.processo });
  }
}

function isWhatsappConfigured() {
  return /^55\d{10,11}$/.test(WHATSAPP_NUMBER);
}

document.querySelectorAll('.js-open-triage').forEach(el => {
  el.addEventListener('click', event => {
    event.preventDefault();
    openModal(el.dataset.topic || '');
  });
});

document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));

document.querySelectorAll('.option[data-field="assunto"]').forEach(button => {
  button.addEventListener('click', () => {
    state.assunto = button.dataset.value;
    button.classList.add('selected');
    setTimeout(() => { currentStep = 2; updateStep(); }, 120);
  });
});

document.querySelectorAll('.option[data-field="processo"]').forEach(button => {
  button.addEventListener('click', () => {
    state.processo = button.dataset.value;
    button.classList.add('selected');
    setTimeout(() => { currentStep = 4; updateStep(); }, 120);
  });
});

document.querySelectorAll('[data-back]').forEach(button => {
  button.addEventListener('click', () => {
    if (currentStep === 4) currentStep = 3;
    else if (currentStep === 3) currentStep = 2;
    else currentStep = 1;
    updateStep();
  });
});

whatsappButton.addEventListener('click', () => {
  if (!isWhatsappConfigured()) {
    alert('Configure o número do WhatsApp no arquivo script.js antes de publicar a página.');
    return;
  }

  const message = [
    'Olá, Dra. Talissa. Vim pelo site e gostaria de atendimento em Direito de Família.',
    '',
    `Assunto: ${state.assunto}`,
    `Situação: ${state.situacao}`,
    `Já existe processo em andamento: ${state.processo}`
  ].join('\n');

  trackEvent('whatsapp_apos_triagem', { lp: 'familia_pensao', assunto: state.assunto, situacao: state.situacao, processo: state.processo });
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

waFab.addEventListener('click', () => {
  const open = !waWidget.classList.contains('open');
  waWidget.classList.toggle('open', open);
  waFab.setAttribute('aria-expanded', String(open));
  document.getElementById('waPopup').setAttribute('aria-hidden', String(!open));
});
waClose.addEventListener('click', () => {
  waWidget.classList.remove('open');
  waFab.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.closest('.faq-item');
    const open = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      }
    });
    item.classList.toggle('open', !open);
    question.setAttribute('aria-expanded', String(!open));
  });
});

document.addEventListener('click', event => {
  if (!waWidget.contains(event.target) && waWidget.classList.contains('open')) {
    waWidget.classList.remove('open');
    waFab.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (modal.classList.contains('open')) closeModal();
    waWidget.classList.remove('open');
    closeMobileMenu();
  }
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

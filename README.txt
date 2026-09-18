Talissa Colares Advocacia — LP Família / Pensão
Versão revisada: responsividade, CSS, semântica e debugging.

ARQUIVOS
- index.html
- styles.css
- script.js
- assets/logo-talissa.png

ANTES DE PUBLICAR
1. Abra script.js.
2. Substitua 55XXXXXXXXXXX pelo WhatsApp profissional no formato 55DDDNUMERO, somente números.
3. Se usar GA4/Google Ads, mantenha o carregamento de gtag no projeto ou via Google Tag Manager. Os eventos existentes continuam:
   - triagem_iniciada
   - triagem_concluida
   - whatsapp_apos_triagem

PRINCIPAIS AJUSTES DESTA VERSÃO
- CSS reorganizado e reduzido, sem blocos duplicados de breakpoints.
- Layout responsivo para desktop, tablet e celular.
- Hero, cards, FAQ, rodapé e triagem protegidos contra overflow.
- CTA fixo no celular sem conflito com o botão flutuante do desktop.
- Modal convertido em bottom sheet no mobile.
- Navegação mobile e foco do modal corrigidos.
- Estado da triagem sincronizado ao voltar uma etapa.
- FAQ com aria-expanded e aria-hidden sincronizados.
- Animações respeitam prefers-reduced-motion.
- Hierarquia semântica e acessibilidade preservadas.

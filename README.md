# PMES Aplicativo 2026

Aplicativo pessoal de estudos para PMES Soldado Combatente 2026.

## Estrutura preservada
- Português
- Raciocínio Lógico-Matemático
- Geografia
- História
- temas com prioridade
- resumos
- flashcards com repetição espaçada
- quizzes e registro de erros
- pontos fracos e revisões
- treino de estilo IDECAN
- simulados
- modo de sobrevivência/reta final

A navegação principal do app mantém apenas essas quatro matérias e os módulos de estudo; **Redação não faz parte da navegação do aplicativo**, conforme definido para esta versão pessoal.

## PWA
O projeto usa React + Vite e já contém manifest, service worker, metatags para iOS e fallback de armazenamento para navegador. O arquivo original do Claude é mantido em `revisao-pmes-4materias.jsx` e é exposto ao Vite por `src/App.jsx`.

## Persistência
O app original foi construído para `window.storage`. Para uso web/PWA, `src/storage-polyfill.js` fornece a mesma interface sobre `localStorage`, preservando o progresso no iPhone/Android sem exigir uma arquitetura nova.

Existe também `src/supabase.js` preparado para o projeto Supabase. Configure somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; **nunca** use `service_role` no frontend.

## Deploy
O projeto está preparado para Vercel com `vercel.json` e `npm run build`.

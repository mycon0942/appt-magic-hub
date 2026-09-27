# agendo — Hub Completo de Agendamento, Estética e Gestão

Aplicativo completo de agendamento profissional, fichas de anamnese, gestão de serviços, produtos e promoções, conectado em tempo real com **Lovable**, **Supabase** e **GitHub**.

## 🚀 Funcionalidades Recentes

- **Banners Promocionais Estilo "Link da Bio" (90x400px)**:
  - Upload de fotos diretamente da galeria do dispositivo (sem necessidade de URL externa).
  - Banners com link clicável e ícone indicador.
  - Alternância de exibição instantânea: **Modo Lista** ou **Scroll Horizontal** (carrossel snap).
  - Posicionamento dinâmico no site público: **Topo**, **Entre seções** ou **Rodapé**.
- **Ficha Completa do Cliente com 3 Abas**:
  - **Anamnese**: Histórico clínico, alergias, procedimentos anteriores, cuidados diários e queixas.
  - **Dados da Agenda**: Telefone/WhatsApp com atalhos de discagem direta, nascimento, data de adesão e histórico de agendamentos (campos desnecessários de tipo sanguíneo e medidas físicas foram removidos).
  - **Galeria de Mídias**: Registro fotográfico de antes/depois e evolução do tratamento com suporte a lightbox em tela cheia e upload da galeria.
- **Navegação Inteligente**:
  - Fechamento automático de qualquer modal ativo ao trocar de aba na barra de navegação inferior.
- **Integração Supabase & Lovable**:
  - Configuração de métodos de pagamento, autenticação e sincronização contínua.

## 🛠️ Tecnologias
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend / Persistência**: Supabase, PostgreSQL
- **Integração**: Lovable Sync & GitHub Actions

## 📦 Desenvolvimento Local
```sh
npm install
npm run dev
```

# Relatório Técnico: Implementação Real da Wedrop via RPA (Fase 7)

## 1. Resumo da Implementação
A integração com a Wedrop foi completamente reescrita para utilizar **Automação de Navegador (RPA)** através da biblioteca `Playwright`. O sistema agora acessa o painel web da Wedrop exatamente como um usuário humano, respeitando integralmente a arquitetura, as interfaces (`IWedropProvider`) e as regras de negócio estabelecidas nas fases anteriores.

## 2. Fluxo Implementado
1.  **Login Controlado:** O `WedropAuthenticationProvider` abre um navegador Chromium, acessa a página de login, preenche e-mail e senha, e clica em entrar.
2.  **Tratamento de Captcha:** O sistema verifica a presença de iframes do reCAPTCHA/hCaptcha. Se detectado, lança um erro específico que é capturado pelo `ExceptionHandler` global, pausando a fila e solicitando intervenção humana.
3.  **Persistência de Sessão:** Após o login bem-sucedido, o estado completo do navegador (`storageState`, contendo cookies e localStorage) é serializado e salvo de forma segura no banco de dados via `CredentialManager`.
4.  **Reutilização e Auto-Login:** Nas execuções subsequentes, o `SessionManager` injeta o `storageState` no navegador, pulando a tela de login. Se a sessão expirar, o Auto-Login é acionado silenciosamente.
5.  **Extração de Dados (Scraping):** O `WedropWebProvider` navega até a página de produtos, avalia o DOM (`page.evaluate`) e extrai todos os campos exigidos (SKU, título, descrição, preço, estoque, imagens, atributos, etc.).
6.  **Filtros Nativos:** A extração já filtra produtos não publicados e com preço até R$ 200,00, otimizando o uso de memória antes mesmo de devolver os dados para o `WedropSyncManager`.

## 3. Tratamento de Erros e Debug
*   **Screenshots Automáticos:** Em caso de qualquer falha (timeout, seletor não encontrado, erro de login), o sistema tira um screenshot de página inteira e salva na pasta `logs/screenshots/` para auditoria.
*   **Modos de Execução:** O sistema respeita a variável `NODE_ENV`. Em `production`, o navegador roda em modo `headless` (invisível). Em `development`, o navegador abre visualmente para facilitar o debug.
*   **Resiliência:** Quedas de conexão ou alterações drásticas de layout disparam erros que são capturados pelo `RetryEngine` global.

## 4. Páginas Automatizadas e Seletores
*   **Páginas:** `/login` e `/produtos?page=X`.
*   **Seletores Utilizados:** Foram utilizados seletores genéricos (ex: `input[type="email"]`, `.product-item`, `.price`). 
*   *Atenção:* Estes seletores são *placeholders estruturais*. Eles precisarão ser inspecionados e ajustados para corresponder exatamente ao HTML real do painel da Wedrop.

## 5. Limitações Encontradas e Pontos de Atenção
*   **Dependência de Layout:** Como qualquer solução RPA, o scraper é sensível a mudanças no HTML da Wedrop. Se a Wedrop mudar a classe `.product-item` para `.item-card`, a extração falhará e exigirá manutenção no seletor.
*   **Performance:** O RPA é inerentemente mais lento e consome mais CPU/RAM do que uma API REST. O processamento em lotes (já implementado) é vital para não sobrecarregar o servidor Node.js.
*   **Credenciais Reais:** Para que o sistema funcione, é necessário inserir um E-mail e Senha reais de uma conta Wedrop ativa através da interface do sistema.

## 6. Validação da Arquitetura
A arquitetura provou sua robustez. A troca de uma API REST simulada por um robô complexo de navegação web ocorreu **sem alterar uma única linha de código** nos módulos de IA, Precificação, Amazon, Bling ou no Orquestrador Global. O contrato `IWedropProvider` foi perfeitamente respeitado.

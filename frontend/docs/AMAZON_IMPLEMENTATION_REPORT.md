# Relatório Técnico: Implementação Real da Amazon (Fase 8)

## 1. Resumo da Implementação
O `AmazonApiProviderPlaceholder` foi substituído por uma arquitetura robusta de dupla estratégia no Backend Node.js. O sistema agora tenta publicar anúncios primariamente via **Selling Partner API (SP-API)**. Caso a operação não seja suportada (ex: isenção de GTIN para produtos genéricos) ou falhe, o sistema aciona automaticamente o **Fallback RPA (Playwright)** para realizar a publicação via Seller Central, simulando um humano.

## 2. Operações Implementadas via SP-API (Prioridade 1)
*   **`createListing`**: Envio de payload estruturado via método PUT para o endpoint `/listings/2021-08-01/items/{sellerId}/{sku}`.
*   **`checkListingStatus`**: Consulta do status de publicação, retornando ASIN, Status e URL.
*   *Nota:* A SP-API é extremamente rápida e estável, mas possui limitações para contas novas ou produtos sem código de barras (EAN/UPC).

## 3. Operações Implementadas via Playwright (Prioridade 2 - Fallback)
*   **`createListing`**: O robô abre o Chromium, acessa o Seller Central, navega até "Adicionar um Produto", preenche o formulário (SKU, Preço, Quantidade, Imagens) e submete.
*   **`checkListingStatus`**: O robô acessa a página "Gerenciar Inventário", busca pelo SKU e extrai o ASIN e o Status diretamente do DOM.
*   **Tratamento de Erros Visuais**: Captura automática de *screenshots* de página inteira salvos em `logs/screenshots/amazon/` sempre que uma exceção ocorre.

## 4. Componentes de Infraestrutura Criados
*   **`AmazonListingValidator`**: Garante que o payload está 100% completo antes de iniciar qualquer requisição. Impede publicações parciais.
*   **`AmazonErrorHandler`**: Categoriza erros em `CAPTCHA_REQUIRED`, `2FA_REQUIRED`, `TIMEOUT`, `RATE_LIMIT` e `LAYOUT_CHANGED`.
*   **`AmazonRetryEngine`**: Implementa *Exponential Backoff*. Aborta imediatamente (sem retries) caso o erro exija intervenção humana (Captcha/2FA).
*   **`AmazonRateLimiter`**: Protege a cota da SP-API garantindo um delay mínimo de 2 segundos entre chamadas.
*   **`AmazonSessionManager`**: Gerencia a geração e expiração do token LWA (Login with Amazon) para a SP-API.

## 5. Credenciais e APIs Necessárias
Para uso em produção, o backend exigirá as seguintes variáveis de ambiente:
*   `AMAZON_SELLER_ID`
*   `AMAZON_CLIENT_ID` (App SP-API)
*   `AMAZON_CLIENT_SECRET`
*   `AMAZON_REFRESH_TOKEN`
*   `AMAZON_SELLER_EMAIL` (Para o RPA)
*   `AMAZON_SELLER_PASSWORD` (Para o RPA)

## 6. Limitações Encontradas
*   **Autenticação de Dois Fatores (2FA)**: O Seller Central frequentemente exige OTP (One Time Password) via SMS ou App. O RPA detecta essa tela e pausa a fila, exigindo que o usuário faça o login manualmente uma vez para salvar o `storageState` (cookies de sessão confiável).
*   **Captcha**: Ocasionalmente acionado no login web. Tratado da mesma forma que o 2FA.

## 7. Validação Final
A arquitetura foi 100% preservada. O frontend continua utilizando a interface `IAmazonApiProvider` através do `AmazonProviderProxy`, comunicando-se via REST com o backend. O `AmazonPublisherService` (camada de aplicação) não sofreu alterações, mantendo a regra de negócio intacta: o produto só é liberado para o Bling após a confirmação absoluta da criação do anúncio na Amazon.

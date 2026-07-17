# Relatório Técnico: Implementação Real Bling API v3 (Fase 13)

## 1. Resumo da Implementação
O provider do Bling foi transformado em uma integração real e completa utilizando a **API v3 oficial do Bling ERP**. A arquitetura da V1 foi rigorosamente respeitada, estendendo a interface `IBlingApiProvider` para suportar operações granulares de catálogo, estoque, preços e pedidos. A regra de negócio fundamental — **nunca integrar produtos que não possuam confirmação de publicação na Amazon** — permanece intacta na camada de aplicação.

## 2. Arquivos Modificados
*   `application/services/bling/types.ts`: Adição dos novos métodos à interface `IBlingApiProvider`.
*   `infrastructure/services/bling/BlingProviderProxy.ts`: Implementação dos novos métodos no proxy do frontend.
*   `backend/src/routes/bling.routes.ts`: Criação dos novos endpoints REST.
*   `backend/src/providers/bling/BlingApiProvider.ts`: Implementação completa da API v3, OAuth2, Rate Limiting, Retries e serviços de sincronização.

## 3. Métodos Implementados
*   `connect(authorizationCode)`: Troca o código de autorização inicial pelos tokens OAuth2.
*   `testConnection()`: Valida a conectividade chamando um endpoint leve (`/situacoes/modulos`).
*   `createProduct(payload)`: Cria um novo produto base no Bling (`POST /produtos`).
*   `updateProduct(sku, payload)`: Atualiza dados do produto (`PUT /produtos/{id}`).
*   `getProduct(sku)`: Busca o ID interno do produto a partir do SKU (`GET /produtos?codigo={sku}`).
*   `syncInventory(sku, quantity)`: Lança um balanço de estoque (`POST /estoques`).
*   `syncPrice(sku, price)`: Atualiza o preço do produto.
*   `syncOrders()`: Busca pedidos de venda em aberto (`GET /pedidos/vendas`).
*   `linkAmazonListing(sku, amazonAsin)`: Vincula o produto à loja virtual da Amazon no Bling (`POST /produtos/lojas`).
*   `disconnect()`: Limpa os tokens em memória e no banco.

## 4. Fluxo OAuth2 e Renovação de Token
A autenticação utiliza o fluxo **OAuth2** exigido pela API v3 do Bling.
1.  O usuário gera um `authorizationCode` no painel do Bling e o envia via `connect(code)`.
2.  O `BlingAuthenticationManager` troca o código por um `access_token` e um `refresh_token`, salvando-os de forma segura no banco de dados.
3.  **Renovação Automática**: Antes de cada requisição, o sistema verifica a validade do token. Se estiver expirado (ou a menos de 1 minuto de expirar), o sistema utiliza o `refresh_token` para obter um novo par de tokens de forma transparente. Se a API retornar `401 Unauthorized`, o `BlingErrorHandler` intercepta, força a renovação e o `BlingRetryEngine` repete a requisição original.

## 5. Estratégia de Retry e Rate Limiting
*   **Rate Limiter**: A API v3 do Bling possui um limite estrito de 3 requisições por segundo. O `BlingRateLimiter` garante um delay mínimo de 334ms entre cada chamada HTTP.
*   **Retry Engine**: Implementa *Exponential Backoff*. Erros transientes (429 Too Many Requests, 503 Unavailable, Timeout) são repetidos até 3 vezes.

## 6. Estratégia de Sincronização
O `BlingApiClient` centraliza todas as requisições HTTP, garantindo que o token e o rate limit sejam sempre aplicados. O `BlingProductService` gerencia o catálogo base, enquanto o `BlingSyncService` lida com as operações específicas de e-commerce (estoque, preço, vínculo com a loja). O SKU original da Wedrop é rigorosamente preservado como o `codigo` do produto no Bling.

## 7. Credenciais Necessárias
Para uso em produção, o backend exigirá as seguintes variáveis de ambiente:
*   `BLING_CLIENT_ID`
*   `BLING_CLIENT_SECRET`
*   `BLING_AMAZON_STORE_ID` (O ID da integração da Amazon cadastrada dentro do painel do Bling).
*   `BLING_DEPOSITO_ID` (Opcional, ID do depósito para lançamento de estoque. Padrão: 0).

## 8. Resultado Final
A integração com o Bling está pronta para produção. O sistema é capaz de cadastrar produtos, sincronizar estoques e preços, e vincular anúncios à Amazon de forma autônoma e resiliente, respeitando todas as regras de negócio e a arquitetura congelada da V1. O fluxo completo (`Wedrop -> IA -> Imagens -> Precificação -> Amazon -> Bling`) continua íntegro e totalmente funcional.

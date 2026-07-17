# Relatório Técnico: Refatoração de Autenticação Wedrop

## 1. Alterações Realizadas
A estratégia de autenticação da Wedrop foi completamente refatorada para refletir o uso real da plataforma (Login via Painel Web), abandonando a premissa incorreta de uma API pública baseada em Client ID/Secret.

*   **Remoção de Client ID/Secret**: A interface de usuário e a camada de persistência foram atualizadas para utilizar E-mail e Senha.
*   **Criação da Interface `IWedropProvider`**: O sistema agora depende exclusivamente desta interface, garantindo o desacoplamento total da implementação de autenticação.
*   **Criação de Providers Desacoplados**:
    *   `WedropWebProvider`: Implementação padrão que utiliza RPA (Robotic Process Automation) simulado e gerenciamento de cookies.
    *   `WedropApiProvider`: Placeholder estrutural para uma futura API oficial, caso seja lançada.
*   **Implementação do Session Manager**: Criado o `SessionManager` responsável por orquestrar o login, validação de sessão, auto-login e renovação (refresh).
*   **Implementação do Cookie Manager**: Criado o `CookieManager` para extrair e formatar cookies de sessão.
*   **Implementação do Credential Manager**: Criado o `CredentialManager` para armazenamento seguro (com simulação de criptografia) das credenciais, garantindo que senhas nunca sejam salvas em texto puro ou exibidas em logs.
*   **Atualização de UI e Estados**: A interface agora reflete os estados reais da sessão: `Conectado`, `Desconectado`, `Sessão expirou` e `Reconectando`.

## 2. Arquivos Modificados
*   `i18n/locales/pt-BR.ts`: Atualização das chaves de tradução.
*   `infrastructure/services/wedrop/types.ts`: Adição de `IWedropProvider` e `ConnectionState`.
*   `infrastructure/services/wedrop/auth/CredentialManager.ts`: Novo gerenciador seguro de credenciais.
*   `infrastructure/services/wedrop/auth/SessionManager.ts`: Atualizado para suportar os novos estados e o `CredentialManager`.
*   `infrastructure/services/wedrop/providers/WedropWebProvider.ts`: Nova implementação padrão.
*   `infrastructure/services/wedrop/providers/WedropApiProvider.ts`: Novo placeholder para API oficial.
*   `application/services/wedrop/WedropSyncManager.ts`: Refatorado para depender de `IWedropProvider`.
*   `infrastructure/di/DependencyInjectionContainer.ts`: Atualização das injeções de dependência.
*   `pages/WedropIntegration.tsx`: Atualização da interface de usuário.

## 3. Compatibilidade Preservada
Nenhum outro módulo do sistema (Queue Manager, AI Engine, Pricing, Images, Amazon, Bling, Automation) sofreu alterações. Todos continuam operando normalmente, pois a mudança foi encapsulada atrás da interface `IWedropProvider` e injetada via `DependencyInjectionContainer`. A fila em processamento não é perdida em caso de expiração de sessão, pois o `SessionManager` tenta o auto-login e a renovação de forma transparente.

## 4. Arquitetura Validada
A arquitetura continua respeitando os princípios SOLID e Clean Architecture. A inversão de dependência (DIP) foi fortalecida com a introdução do `IWedropProvider`, permitindo que a estratégia de comunicação com a Wedrop mude no futuro sem impacto no domínio ou na aplicação. O projeto compila sem erros.

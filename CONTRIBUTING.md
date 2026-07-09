# Guia de Contribuição

Este documento define o fluxo de trabalho, os padrões de código e o design do
projeto para ajudar todos os contribuidores a realizar alterações consistentes e
seguras no sistema de auditoria da universidade.

---

## Pré-requisitos do Ambiente

Como não mantemos o Maven Wrapper (mvnw) rastreado no repositório, você
precisará preparar seu ambiente local antes de começar.

### 1. Java e Maven
Certifique-se de ter o Java Development Kit (JDK) 21 e o Maven instalados no
seu sistema operacional:

*   **Ubuntu/Debian:** 
    ```bash
    sudo apt update
    sudo apt install openjdk-21-jdk maven
    ```
*   **macOS (via Homebrew):** 
    ```bash
    brew install openjdk@21 maven
    ```
*   **Windows:** Instale via gerenciador de pacotes ou faça o download manual:
    ```powershell
    winget install Eclipse.Temurin.21.JDK
    winget install Apache.Maven
    ```

### 2. Docker
Utilizamos o Docker para subir o banco de dados PostgreSQL localmente de forma
idêntica ao ambiente de produção.
*   Instale o **Docker Desktop** (Windows/macOS) ou o **Docker Engine** (Linux).

---

## Inicializando o Projeto

Após clonar o seu fork do repositório, execute os passos abaixo na raiz do
projeto:

### Passo 1: Gerar o seu Maven Wrapper local
Se preferir usar o wrapper (mvnw) localmente sem precisar digitar a palavra
mvn global, gere-o na sua máquina (ele já está configurado para ser ignorado
pelo Git):

```bash
mvn wrapper:wrapper
```
*A partir daqui, você pode usar `./mvnw` (Linux/macOS) ou `mvnw.cmd` (Windows)
em vez de `mvn`.*

### Passo 2: Subir o Banco de Dados (PostgreSQL)
Inicie o container do banco de dados em segundo plano:

```bash
docker compose up -d
```
Isso criará uma instância do PostgreSQL configurada na porta 5432 com as
credenciais especificadas no arquivo docker-compose.yml.

### Passo 3: Executar as Migrações e Compilar o Projeto
O Flyway aplicará automaticamente todos os scripts de criação de tabelas
localizados em `src/main/resources/db/migration/` assim que o projeto for
compilado ou iniciado:

```bash
mvn clean compile
```

---

## Fluxo de Trabalho do Git (Fork e Pull Request)

Utilizamos o modelo de Fork e Pull Request para garantir que todo código seja
revisado antes de ser integrado ao repositório principal. Siga estes passos
para qualquer contribuição:

### Passo 1: Fazer o Fork do Repositório
Acesse a página do repositório principal da organização no GitHub e clique no
botão **Fork** (no canto superior direito) para criar uma cópia dele na sua
conta pessoal.

### Passo 2: Clonar o seu Fork
Clone o seu fork pessoal localmente em seu computador:

```bash
git clone https://github.com/USUARIO/onerous.git
cd auditing-system
```

### Passo 3: Vincular ao Repositório Original
Para manter seu código local atualizado com o repositório oficial, adicione o
repositório da organização como um remoto chamado `upstream`:

```bash
git remote add upstream https://github.com/proj_belarmino/onerous.git
```

### Passo 4: Criar uma Branch para a sua Tarefa
Sempre trabalhe em uma branch separada. Nunca faça commits diretamente na
branch `master`. Use nomes curtos e descritivos:

```bash
git checkout -b feature/nome-da-sua-tarefa
```
*(Você também pode utilizar prefixos como `fix/nome-da-tarefa` ou
`refactor/nome-da-tarefa`, dependendo da alteração).*

### Passo 5: Desenvolver e Commitar
Faça commits pequenos e focados. Escreva mensagens de commit claras e diretas
em português:

```bash
git add .
git commit -m "feat: adiciona validacao de formato de arquivo para documentos"
```

### Passo 6: Sincronizar com o Repositório Original
Antes de enviar suas alterações, atualize seu código com o repositório principal
para evitar conflitos:

```bash
git checkout master
git pull upstream master
git checkout feature/nome-da-sua-tarefa
git merge master
```
*Se houver conflitos que você não saiba como resolver, peça ajuda antes de
prosseguir.*

### Passo 7: Enviar (Push) e Abrir um Pull Request (PR)
Envie sua branch para o seu fork no GitHub:

```bash
git push origin feature/nome-da-sua-tarefa
```

Vá até a página do repositório original no GitHub. O site exibirá um aviso
sugerindo a criação de um Pull Request. Clique em **Compare & pull request**,
descreva brevemente o que foi feito e envie.

> **OBS:** Não realize o merge do seu próprio Pull Request. A equipe revisará o
> código antes de realizar a integração final.

---

## Princípios de Design

*   **Simulação de API (Mock):** Como ainda não temos acesso à API oficial da
    universidade, criaremos classes de simulação estruturadas (mocks) usando
    bancos de dados em memória e coleções padrão do Java para simular a ingestão
    e retorno de dados.
*   **Manipulação Segura de Datas:** Use a API `java.time` (como `LocalDate` e
    `ChronoUnit`) para garantir a precisão nas regras de prazo de 15 dias,
    evitando cálculos manuais com milissegundos.

---

## Tecnologias e Dependências

| Camada | Ferramenta | Propósito |
| :--- | :--- | :--- |
| **Linguagem** | Java 21 (JDK 21) | Linguagem de programação principal |
| **Banco de Dados** | PostgreSQL | Persistência de informações |
| **Persistência** | Spring Data JPA | Abstração do acesso ao banco de dados |
| **Infraestrutura** | Docker Compose | Padronização do ambiente local |
| **Migrações** | Flyway | Controle de versão do banco de dados |
| **Sistema de Build** | Maven (via `mvnw`) | Compilação e gestão de dependências |
| **Framework** | Spring Boot | Gerenciamento da API |
| **Testes** | JUnit (Jupiter) | Criação e execução de testes unitários |

---

## Estrutura do Projeto

O código do projeto segue a estrutura padrão do Maven. Posicione suas classes
nos pacotes correspondentes:

```text
src/
├── main/
│   └── java/
│       └── br/ufpb/onerous/
│           ├── model/         # Records representando os objetos do sistema
│           ├── repository/    # Mocks, simulações de APIs e dados de teste
│           └── service/       # Lógica central (regras de auditoria e prazos)
└── test/
    └── java/
        └── br/ufpb/onerous/
            └── service/       # Testes unitários focados nas regras de negócio
```

---

## Convenções de Nomenclatura e Estilo

Todos os identificadores de código (classes, métodos, variáveis e comentários
nos arquivos-fonte) devem ser escritos em **inglês**.

Busque um equilíbrio nos nomes: evite abreviações incompreensíveis e também
evite nomes longos demais sem necessidade.

### Tabela de Convenções

| Elemento | Convenção | Exemplo Inadequado | Exemplo Recomendado |
| :--- | :--- | :--- | :--- |
| **Classes / Records** | `PascalCase` | `SrvtProc` / `LeaveVerificationManager` | `ProcessValidator` |
| **Métodos** | `camelCase` | `chkAcc()` / `verifyIfServantIsUpToDate()` | `hasPendingAccountability()` |
| **Variáveis / Parâmetros** | `camelCase` | `dt` / `dateOnWhichTheServantReturned` | `returnDate` |
| **Constantes** | `SCREAMING_SNAKE_CASE` | `limit` | `MAX_DAYS_FOR_ACCOUNTABILITY` |

---

## Testes Unitários

Antes de enviar seu Pull Request, verifique se todas as alterações compilam e
se os testes existentes continuam passando. Execute o comando correspondente
ao seu sistema operacional:

*   **No Windows:**
    ```bash
    mvnw.cmd test
    ```
*   **No Linux/macOS:**
    ```bash
    ./mvnw test
    ```

---

## Estrutura do Banco de Dados

Todas as alterações no banco de dados (como criar tabelas ou adicionar colunas)
devem ser feitas criando um novo arquivo SQL na pasta de migrações:

```text
src/
└── main/
    └── resources/
        └── db/
            └── migration/
                ├── V1__add_nycolas_field.sql
                └── V2__add_documents_table.sql
```

> **Atenção:** Nunca altere uma migração que já foi executada e enviada para a
> branch `master`/`main`. Se precisar corrigir algo, crie uma nova migração
> (ex: `V3__correcao_tabela_documentos.sql`).

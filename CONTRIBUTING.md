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
git clone https://github.com/USUARIO/motus.git
cd motus
```

### Passo 3: Vincular ao Repositório Original
Para manter seu código local atualizado com o repositório oficial, adicione o
repositório da organização como um remoto chamado `upstream`:

```bash
git remote add upstream https://github.com/proj_belarmino/motus.git
```

### Passo 4: Criar uma Branch para a sua Tarefa
Sempre trabalhe em uma branch separada. Nunca faça commits diretamente na
branch `master`. Use nomes curtos e descritivos:

```bash
git checkout -b feature/nome-da-sua-tarefa
```
*(Você também pode utilizar prefixos como `fix/nome-da-tarefa` ou
`refactor/nome-da-tarefa`, dependendo da natureza da alteração).*

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

> **Observação:** Não realize o merge do seu próprio Pull Request. A equipe revisará o
> código antes de realizar a integração final.

---

## Princípios de Design

* **Separation of Concerns (SoC):** 
  Não devemos poluir módulos de um domínio da aplicação (e.g., API) com lógica de outro.
  Ou seja, separe bem a lógica para não prejudicar a modularidade e facilidade de manutenção.
  Caso precise fazer uma operação de arquivos, utilize a abstração de gerenciamento de arquivos,
  ou crie uma nova abstração que o faça, caso ainda não exista.

  **Por exemplo,**
  ```java
    class BankAccount {
      private double balance;

      void deposit() {
          Scanner sc = new Scanner(System.in);

          System.out.print("Amount: ");
          double amount = sc.nextDouble();

          balance += amount;
      }
    }
  ```
  **Poderia ser re-escrito como,**
  ```java
    class BankAccount {
      private double balance;

      void deposit(double amount) {
        balance += amount;
      }
    }

    class InputReader {
      private Scanner scanner;

      // definir construtor, etc...

      double readAmount() {
        System.out.print("Amount: ");
        return scanner.nextDouble();
      }
    }
  ```
    
* **Don't Repeat Yourself (DRY):**
  Em uma determinada classe, muitos métodos realizarão trabalho repetitivo ou similar,
  com pequenas diferenças entre sí. Fazê-lo de forma ingênua: repetir código, implementar manualmente,
  é inviável a longo prazo. Sempre que perceber repetição, abstraia essa operação para um método à parte,
  da maneira mais genérica e reutilizável possível.

  **Por exemplo,**
  ```java
    int roomArea = roomWidth * roomHeight;
    int kitchenArea = kitchenWidth * kitchenHeight;
    int screenArea = screenWidth * screenHeight;
  ```

  **Poderia ser re-escrito como,**
  ```java
    int area(Surface surface) {
      return surface.getWidth() * surface.getHeight();
    }

    int roomArea = area(room);
    int kitchenArea = area(kitchen);
    int screenArea = area(screen);
  ```
* **Keep It Simple, Stupid (KISS):** 
  Não implemente nada complexo demais. Bom código é código simples, mas sem ser desleixado.
  Se é possível melhorar um método *assintoticamente*, melhore. Mas não faça micro-otimizações sem fim,
  nem utilize padrões desnecessariamente abstratos.
--- 

## Tecnologias e Dependências

| Camada                     | Ferramenta                     | Propósito                                                                          |
| :------------------------- | :----------------------------- | :--------------------------------------------------------------------------------- |
| **Linguagem**              | Java 21 (JDK 21)               | Linguagem de programação principal                                                 |
| **Framework**              | Spring Boot                    | Desenvolvimento da API e gerenciamento da aplicação                                |
| **Banco de Dados**         | PostgreSQL                     | Persistência das informações da biblioteca de mídia                                |
| **Persistência**           | Spring Data JPA (Hibernate)    | Mapeamento objeto-relacional e acesso ao banco de dados                            |
| **Autenticação**           | Spring Security                | Autenticação e autorização de usuários                                             |
| **Sistema de Build**       | Maven (via `mvnw`)             | Compilação, gerenciamento de dependências e execução de tarefas                    |
| **Infraestrutura**         | Docker Compose                 | Padronização do ambiente de desenvolvimento e execução                             |
| **Processamento de Mídia** | FFmpeg e FFprobe               | Extração de metadados, geração de miniaturas e transcodificação de vídeos          |
| **Metadados Externos**     | TMDB API / TVMaze API          | Obtenção de informações sobre filmes e séries                                      |
| **Armazenamento**          | Sistema de Arquivos            | Armazenamento dos arquivos de mídia; o banco mantém apenas metadados e referências |
| **Testes**                 | JUnit e Mockito                | Criação e execução de testes unitários                                             |
| **Documentação da API**    | SpringDoc OpenAPI (Swagger UI) | Documentação e exploração interativa dos endpoints da API                          |

---

## Estrutura do Projeto

O código do projeto segue a estrutura padrão do Maven. Posicione suas classes
nos pacotes correspondentes:

```fix
src/
├── main/
│   └── java/
│       └── br/ufpb/motus/
│           ├── model/         # Records representando os objetos do sistema
│           ├── repository/    # Mocks, simulações de APIs e dados de teste
│           └── service/       # Lógica central
└── test/
    └── java/
        └── br/ufpb/motus/
            └── service/       # Testes unitários focados nas regras de negócio
```

---

## Convenções de Nomenclatura e Estilo

Todos os identificadores de código (classes, métodos, variáveis e comentários
nos arquivos-fonte) devem ser escritos em **inglês**.
Busque um equilíbrio nos nomes: evite abreviações incompreensíveis e também
evite nomes longos demais sem necessidade.

### Tabela de Convenções

| Elemento                   | Convenção              | Exemplo Inadequado                                   | Exemplo Recomendado                          |
| :------------------------- | :--------------------- | :--------------------------------------------------- | :------------------------------------------- |
| **Classes / Records**      | `PascalCase`           | `MediaMgr` / `MovieLibraryControllerService`         | `MediaLibrary`, `StreamingService`           |
| **Métodos**                | `camelCase`            | `scanDir()` / `processEveryMediaFileInsideLibrary()` | `scanLibrary()`, `generateThumbnail()`       |
| **Variáveis / Parâmetros** | `camelCase`            | `vid`, `p`                                           | `mediaFile`, `libraryPath`                   |
| **Constantes**             | `SCREAMING_SNAKE_CASE` | `port`, `sizeLimit`                                  | `DEFAULT_STREAM_PORT`, `MAX_THUMBNAIL_WIDTH` |

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

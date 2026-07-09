# Guia de Contribuição

Este documento define o fluxo de trabalho, os padrões de código e o design do
projeto para ajudar todos os contribuidores a realizar alterações consistentes e
seguras no sistema de auditoria da universidade.

## Pré-requisitos do Ambiente

Como não mantemos o Maven Wrapper (`mvnw`) rastreado no repositório, você precisará preparar seu ambiente local antes de começar.

Certifique-se de ter o Java Development Kit (JDK) 21 e o Maven instalados no seu sistema operacional.
- No Ubuntu/Debian: `sudo apt install openjdk-21-jdk maven`
- No macOS (via Homebrew): `brew install openjdk@21 maven`
- No Windows: Instale via gerenciador de pacotes (`winget install Eclipse.Temurin.21.JDK` e `winget install Apache.Maven`) ou faça o download manual.

Utilizamos o Docker para subir o banco de dados PostgreSQL localmente de forma idêntica ao ambiente de produção.
- Instale o **Docker Desktop** (Windows/macOS) ou o **Docker Engine** (Linux).

## Inicializando o Projeto

Após clonar o seu fork do repositório, execute os passos abaixo na raiz do projeto:

### Passo 1: Gerar o seu Maven Wrapper local (Opcional)
Se preferir usar o wrapper (`mvnw`) localmente sem precisar digitar a palavra `mvn` global, gere-o na sua máquina (ele será ignorado pelo Git automaticamente):

```bash
mvn wrapper:wrapper
```
*A partir daqui, você pode usar ./mvnw (Linux/macOS) ou mvnw.cmd (Windows) em vez de mvn.*

**Passo 2:** Subir o Banco de Dados (PostgreSQL)

Inicie o container do banco de dados em segundo plano:

```bash
docker compose up -d
```
Isso criará uma instância do PostgreSQL configurada na porta 5432 com as credenciais especificadas no arquivo docker-compose.yml.

**Passo 3:** Executar as Migrações e Compilar o Projeto

O Flyway aplicará automaticamente todos os scripts de criação de tabelas localizados em src/main/resources/db/migration/ assim que o projeto for compilado ou iniciado:

```bash
mvn clean compile
```


## Fluxo de Trabalho do Git (Fork e Pull Request)

Utilizamos o modelo de Fork e Pull Request para garantir que todo código seja
revisado antes de ser integrado ao repositório principal. Siga estes passos para
qualquer contribuição:

**Passo 1:** Fazer o Fork do Repositório

Acesse a página do repositório principal da organização no GitHub e clique no
botão Fork (no canto superior direito) para criar uma cópia dele na sua conta
pessoal.

**Passo 2:** Clonar o seu Fork

Clone o seu fork pessoal localmente em seu computador:

git clone https://github.com/USUARIO/onerous.git
cd auditing-system

**Passo 3:** Vincular ao Repositório Original

Para manter seu código local atualizado com o repositório oficial, adicione o
repositório da organização como um remoto chamado upstream:

git remote add upstream https://github.com/proj_belarmino/onerous.git

**Passo 4:** Criar uma Branch para a sua Tarefa

Sempre trabalhe em uma branch separada. Nunca faça commits diretamente na branch master.
Use nomes curtos e descritivos (e.g, unit-tests, api-refactor):

git checkout -b feature/nome-da-sua-tarefa
(ou fix/nome-da-sua-tarefa, ou refactor/nome-da-sua-tarefa)

**Passo 5:** Desenvolver e Commitar

Faça commits pequenos e focados. Escreva mensagens de commit claras e diretas em
português:

git add .
git commit -m "feat: adiciona validacao de formato de arquivo para documentos"

**Passo 6:** Sincronizar com o Repositório Original

Antes de enviar suas alterações, atualize seu código com o repositório principal
para evitar conflitos:

git checkout master
git pull upstream master
git checkout feature/nome-da-sua-tarefa
git merge master

Se houver conflitos que você não saiba como resolver, peça ajuda antes de prosseguir.

**Passo 7:** Enviar (Push) e Abrir um Pull Request (PR)

Envie sua branch para o seu fork no GitHub:

git push origin feature/nome-da-sua-tarefa

Vá até a página do repositório original no GitHub. O site exibirá um aviso
sugerindo a criação de um Pull Request. Clique em Compare & pull request,
descreva brevemente o que foi feito e envie.

Obs: Não realize o merge do seu próprio Pull Request.
Vou olhar o código e fazer a integração final.

## Princípios de Design

  - Simulação de API (Mock): Como ainda não temos acesso à API oficial da
    universidade, criaremos classes de simulação estruturadas (mocks) usando
    databases e coleções padrão do Java para simular a ingestão e retorno de dados.
  - Manipulação Segura de Datas: Use a API java.time (como LocalDate e
    ChronoUnit) para garantir a precisão nas regras de prazo de 15 dias,
    evitando cálculos manuais com milissegundos.

## Tecnologias e Dependências

| Camada               | Ferramenta         | Propósito                                          |
| -------------------- | ------------------ | -------------------------------------------------- |
| **Linguagem**        | Java 21 (JDK 21)   | Linguagem de programação principal                 |
| **Banco de Dados**   | PostgreSQL         | Persistência de informações                        |
| **Persistência**     | Spring Data JPA    | Abstração do acesso ao banco de dados.             |
| **Infraestrutura**   | Docker Compose     | Padronização do ambiente local de desenvolvimento  |
| **Migrações**        | Flyway             | Controle de versão do esquema do banco de dados    |
| **Sistema de Build** | Maven (via `mvnw`) | Compilação, empacotamento e gestão de dependências |
| **Framework**        | Spring Boot        | Gerenciamento da API.                              |
| **Testes**           | JUnit (Jupiter)    | Criação e execução de testes unitários             |

##  Estrutura do Projeto

O código do projeto segue a estrutura padrão do Maven. Posicione suas classes
nos pacotes correspondentes:

src/
  main/
    java/
      br/ufpb/onerous/
        model/         # Classes de dados simples (Java Records) representando os objetos do sistema
        repository/    # Mocks, simulações de ingestão de APIs e geração de dados de teste
        service/       # Lógica de negócios central (regras de auditoria, prazos e validação superficial)
  test/
    java/
      br/ufpb/onerous/
        service/       # Testes unitários focados na validação das regras de negócio

## Convenções de Nomenclatura e Estilo

Todos os identificadores de código (classes, métodos, variáveis e comentários
nos arquivos-fonte) devem ser escritos em inglês.
Busque um equilíbrio nos nomes: evite abreviações incompreensíveis
(criptografadas) e também evite nomes longos demais sem necessidade.

Tabela de Convenções

| Elemento                   | Convenção              | Exemplo Inadequado                         | Exemplo Recomendado           |
| -------------------------- | ---------------------- | ------------------------------------------ | ----------------------------- |
| **Classes / Records**      | PascalCase             | `SrvtProc` / `LeaveVerificationManager`    | `ProcessValidator`            |
| **Métodos**                | camelCase              | `chkAcc()` / `verifyIfServantIsUpToDate()` | `hasPendingAccountability()`  |
| **Variáveis / Parâmetros** | camelCase              | `dt` / `dateOnWhichTheServantReturned`     | `returnDate`                  |
| **Constantes**             | SCREAMING\_SNAKE\_CASE | `limit`                                    | `MAX_DAYS_FOR_ACCOUNTABILITY` |

6. Testes Unitários

Antes de enviar seu Pull Request, verifique se todas as alterações compilam e se
os testes existentes continuam passando. Utilize os seguintes comandos no
terminal:

  - Para rodar os testes:
      - No Windows: mvnw.cmd test
      - No Linux/macOS: ./mvnw test
:

# Auditing System


Este projeto consiste em um sistema de validação de processos para
a PROGEP-UFPB. O objetivo principal é analisar os pedidos de
afastamento de servidores, garantindo a conformidade com os prazos
de prestação de contas de afastamentos anteriores.

---

## O Problema de Negócio (Regras de Auditoria)

Quando um servidor público solicita um afastamento para fins de capacitação ou
estudo, a auditoria precisa verificar se ele cumpriu com suas obrigações
administrativas em afastamentos passados.

### Bloqueio de Novos Pedidos
* **Prazo:** Assim que o servidor retorna de um período de afastamento,
  ele tem um prazo de N dias corridos para abrir um processo; para esta
  aplicação, utilizaremos um default de 15.
  administrativo de prestação de contas.
* **Consequência:** Se o prazo de N dias expirar sem que a prestação de
  contas seja iniciada, o servidor entra em situação de pendência e fica
  impedido de abrir novos processos de afastamento até regularizar sua
  situação.
* **Validação:** Ao receber um novo pedido de afastamento, o sistema deve
  varrer o histórico do servidor. Se houver qualquer afastamento anterior
  finalizado há mais de N dias que não possua um processo de prestação de
  contas correspondente, o novo pedido deve ser rejeitado.

### Validação de Documentos Anexados
Além de verificar os prazos das datas, o sistema realiza uma validação básica
e superficial nos documentos anexados ao novo pedido de afastamento:
* **Existência:** O pedido deve conter pelo menos um documento anexado.
* **Formato Geral:** Devemos validar a extensão do arquivo. Apenas formatos
  comuns e seguros são aceitos (por exemplo, `.pdf` ou `.png`). Arquivos de
  outros formatos ou sem extensão identificável devem fazer com que o
  processo seja rejeitado.

Há a perspectiva de validação com modelos próprios de machine learning,
na eventualidade de acesso a dados históricos suficientemente numerosos.

---

## Glossário de Termos

Para garantir que o código seja legível e siga um padrão único,
utilizaremos os seguintes termos em inglês no desenvolvimento:

| Termo em PT | Termo em EN (Código) | Representação no Sistema |
| :--- | :--- | :--- |
| **Servidor** | `Servant` | Identificado pelo ID único `servantId`. |
| **Processo** | `Process` | Contém datas e lista de documentos. |
| **Afastamento** | `LEAVE` | Tipo `ProcessType.LEAVE`. |
| **Prestação** | `ACCOUNTABILITY` | Tipo `ProcessType.ACCOUNTABILITY`. |
| **Documento** | `Document` | Representa anexos (nome e extensão). |

---

## Como Rodar o Projeto

Instruções rápidas para inicialização local da aplicação e do banco:

* **Subir o banco de dados local (Docker):**
  ```bash
  docker compose up -d
  ```
* **Compilar o projeto e rodar as migrações (Flyway):**
  ```bash
  mvn clean compile
  ```
* **Executar os testes unitários:**
  ```bash
  mvn test
 

# Media Streaming Server

Este projeto consiste em um web serviço de streaming de mídia de baixa latência.
O objetivo principal é organizar bibliotecas de mídia e servir arquivos
remotamente, oferecendo reprodução de vídeos, músicas e imagens, além de
download de arquivos independentemente do seu tamanho.

---

## Funcionalidades Principais

### Gerenciamento de Bibliotecas

O sistema permite o cadastro de uma ou mais bibliotecas locais contendo
arquivos de mídia.
Ao adicionar uma biblioteca, o serviço realiza uma varredura recursiva do
diretório para identificar novos arquivos e registrar suas informações.

* **Detecção automática:** Novos arquivos podem ser detectados automaticamente
  por monitoramento do sistema de arquivos.
* **Indexação:** São armazenados metadados como duração, resolução, codec,
  tamanho e localização do arquivo.
* **Atualização:** Arquivos removidos ou modificados são sincronizados com o
  banco de dados.

### Reprodução de Mídia

Os arquivos podem ser reproduzidos diretamente pela aplicação através de
streaming HTTP.

* **Streaming:** Envio contínuo do conteúdo para reprodução sem necessidade
  de download completo.
* **Range Requests:** Permite avançar ou retroceder na reprodução sem
  reiniciar o envio do arquivo.
* **Transcodificação:** Quando necessário, vídeos podem ser convertidos para
  formatos compatíveis durante a reprodução.


### Metadados

Após a indexação, o sistema pode complementar automaticamente as informações
da mídia utilizando serviços externos.

* **Filmes e Séries:** Título, sinopse, elenco, gênero, ano e pôster.
* **Músicas:** Álbum, artista e capa.
* **Cache:** Os metadados obtidos são armazenados localmente para evitar
  consultas repetidas.

### Miniaturas

O sistema gera miniaturas automaticamente para facilitar a navegação pela
biblioteca.

* **Vídeos:** Captura de um quadro representativo.
* **Imagens:** Redimensionamento para visualização rápida.
* **Fila de processamento:** A geração ocorre em segundo plano para não
  bloquear outras operações.

### Busca

Os usuários podem localizar rapidamente qualquer conteúdo da biblioteca.

* Busca por título.
* Busca por gênero.
* Busca por ator ou diretor.
* Filtros por resolução, ano, duração e tipo de mídia.

---

## Como Rodar o Projeto

Instruções rápidas para inicialização local da aplicação e do banco:

* **Subir os serviços (Docker):**
  ```bash
  docker compose up -d
  ```

* **Compilar o projeto e executar as migrações:**
  ```bash
  mvn clean compile
  ```

* **Executar os testes unitários:**
  ```bash
  mvn test
  ```

* **Iniciar a aplicação:**
  ```bash
  mvn spring-boot:run
  ```

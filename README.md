# Media Streaming Server (NycoFlix)

Este projeto consiste em um serviço web de streaming de mídia de baixa latência.
O objetivo principal é organizar bibliotecas de mídia e servir arquivos
remotamente, oferecendo reprodução de vídeos, além de
download de arquivos independentemente do seu tamanho.

---

## Funcionalidades Principais
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

---

## Como Rodar o Projeto (Docker)

A aplicação é containerizada utilizando **Docker Compose** (PostgreSQL, Backend Spring Boot e Frontend React/Nginx).

### 1. Pré-requisitos
Certifique-se de ter instalado no host o Docker e o Docker Compose.

Crie as pastas de armazenamento e garanta as permissões de leitura e escrita:
```bash
mkdir -p media shows thumbnails avatars subtitles
sudo chmod -R 777 media shows thumbnails avatars subtitles
```

### 2. Hostear a Aplicação com Docker
Construa e inicie os containers da aplicação:
```bash
docker compose up -d --build
```

A aplicação estará acessível localmente no endereço **`http://localhost:3000`**.

---

## Desenvolvimento Local sem Docker (Opcional)

Caso queira executar os serviços manualmente durante o desenvolvimento:

* **Subir apenas o banco de dados:**
  ```bash
  docker compose up -d postgres
  ```

* **Executar os testes unitários:**
  ```bash
  mvn test
  ```

* **Iniciar o Backend (Spring Boot):**
  ```bash
  mvn spring-boot:run
  ```

* **Iniciar o Frontend (React / Vite):**
  ```bash
  cd motus-web
  npm install
  npm run dev
  ```
```

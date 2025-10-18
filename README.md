🚀 Rota-Inteligente-Otimiza-o-de-Entregas-com-Algoritmos-de-IA
Solução de IA para otimização logística de delivery. Implementação do algoritmo A* para cálculo de rotas e K-Means para clustering de entregas. Projeto acadêmico.

Rota Inteligente: Otimização de Entregas com Algoritmos de IA
Projeto desenvolvido para a disciplina Artificial Intelligence Fundamentals da UniFECAF.

### 1. Descrição do Problema
---
A "Sabor Express", uma empresa local de delivery de alimentos, enfrenta um grande desafio logístico para gerenciar suas entregas, especialmente durante os horários de pico. Atualmente, os percursos são definidos de forma manual, o que resulta em rotas ineficientes, atrasos, custos elevados com combustível e insatisfação dos clientes.

Objetivo do Projeto

O objetivo central deste projeto é desenvolver uma solução inteligente, baseada em algoritmos de Inteligência Artificial, capaz de analisar múltiplos pontos de entrega e sugerir as rotas mais otimizadas para os entregadores.

### 2. Abordagem Adotada
---
Para solucionar o desafio, a cidade foi modelada como um grafo ponderado. Nesta estrutura, os nós representam os locais de entrega, e as arestas representam as ruas, com pesos que indicam o custo (distância/tempo) do trajeto.

A solução foi estruturada em duas frentes:

Agrupamento de Entregas (Clustering): Usando o algoritmo K-Means, os pedidos são agrupados em zonas geográficas para otimizar o trabalho de múltiplos entregadores.

Otimização de Rota (Menor Caminho): Para cada grupo de entregas, o algoritmo A* é utilizado para encontrar o caminho com o menor custo total.

### 3.📊 Algoritmos Utilizados
---
Algoritmo K-Means para Agrupamento de Entregas

Para cenários de alta demanda, o K-Means foi utilizado para agrupar os pontos de entrega em K clusters (zonas), com base em sua proximidade. Isso divide um problema grande em vários menores e mais gerenciáveis, um para cada motorista.

Algoritmo A* (A-Star) para Otimização de Rota

Para encontrar o menor caminho no grafo, o algoritmo A* foi escolhido. Diferente de buscas como BFS ou DFS, o A* é uma busca "informada" que utiliza uma função heurística para estimar o custo até o destino. Isso o torna extremamente eficiente para encontrar a rota de menor custo em um mapa com distâncias variadas, garantindo uma solução ótima para o problema.

![Demonstração da Aplicação](./assets/screenshot-app.png)

### 4. Diagrama do Grafo e Interface da Solução
---
A solução foi implementada em uma aplicação interativa que permite visualizar tanto o cenário do problema quanto a solução otimizada. A imagem demonstra a interface com o mapa (diagrama do grafo) e o relatório de resultados gerado a partir dos dados de um arquivo CSV.

### 5. Análise de Resultados
---
A aplicação desenvolvida provou a eficiência da abordagem. Conforme exibido na imagem acima, ao processar os dados para 2 motoristas, a solução gerou os seguintes resultados:

Motorista 1 (Cluster A, C, D, I, K): Cumpriu sua rota com um Custo Total de R$ 218,00.

Motorista 2 (Cluster B, E, G, H): Atendeu os clientes com um Custo Total de R$ 294,00.

O Custo Operacional Total para a operação foi de R$ 512,00. Estes resultados, obtidos em segundos, demonstram a capacidade da solução de automatizar decisões complexas e fornecer um plano de ação claro e quantificável, validando o impacto positivo na redução de custos e no planejamento logístico.

Limitações e Sugestões de Melhoria

Dados Estáticos: O modelo atual utiliza pesos fixos e não considera variáveis dinâmicas como trânsito em tempo real.

Sugestão: Integrar a solução com APIs de mapas (como Google Maps) para obter dados de tráfego e recalcular as rotas dinamicamente.

### 6. ⚙️ Instruções de Execução do Projeto
---
O projeto foi desenvolvido como uma aplicação web moderna utilizando TypeScript e o framework React, com o ambiente de desenvolvimento Vite.

Tecnologias Utilizadas
Node.js: Ambiente de execução do JavaScript.

React: Biblioteca para construção da interface do usuário.

TypeScript: Superset do JavaScript que adiciona tipagem estática.

Vite: Ferramenta de build para um desenvolvimento frontend mais rápido.

NPM: Gerenciador de pacotes do Node.js.

Pré-requisitos
Node.js (versão 16 ou superior). Você pode baixar em nodejs.org.

Git para clonar o repositório.

Passos para Instalação e Execução
Clone o repositório: Abra seu terminal, navegue até a pasta onde deseja salvar o projeto e execute o comando:

Bash

git clone (https://github.com/Diego-Anjos/Rota-Inteligente-Otimizacao-de-Entregas-com-Algoritmos-de-IA.git)

cd Sabor Express Projeto

Instale as dependências: Este comando irá ler o arquivo package.json e instalar todas as bibliotecas e ferramentas necessárias para o projeto.

Bash

npm install

Execute a aplicação em modo de desenvolvimento: Este comando inicia o servidor de desenvolvimento do Vite.

Bash

npm run dev
Abra o software no navegador: Após executar o comando acima, o terminal exibirá uma mensagem indicando que o servidor está rodando. Abra o endereço Local que aparecerá no seu navegador para ver e interagir com a aplicação.

➜  Local:   http://localhost:3000/
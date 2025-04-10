// script.js

// Função que busca os dados do JSON e exibe na tela
async function carregarViagens() {
    try {
      const resposta = await fetch('../data/trips.json'); // Caminho relativo
      const viagens = await resposta.json();
  
      const container = document.getElementById('viagens-container');
  
      viagens.forEach(viagem => {
        const viagemDiv = document.createElement('div');
        viagemDiv.classList.add('viagem');
  
        viagemDiv.innerHTML = `
          <h3>${viagem.empresa}</h3>
          <p><strong>Origem:</strong> ${viagem.origem}</p>
          <p><strong>Destino:</strong> ${viagem.destino}</p>
          <p><strong>Status:</strong> ${viagem.status}</p>
          <p><strong>Previsão de chegada:</strong> ${viagem.previsaoChegada}</p>
        `;
  
        container.appendChild(viagemDiv);
      });
    } catch (erro) {
      console.error('Erro ao carregar viagens:', erro);
    }
  }
  
  // Quando a página carregar, executa a função
  window.onload = carregarViagens;
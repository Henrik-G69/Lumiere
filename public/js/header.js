const TMDB_API_KEY = '98f79a8fc16247f2c16e9d0b422dbfbe'; 
// base url para imagens da tmdb
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w92';
// url de imagem padrão para quando não houver poster
const NO_POSTER_IMAGE_URL = '../public/icons/place-holder.svg'; 

const searchContainer = document.querySelector('.search-container');
const searchInput = document.getElementById('search-input');
const resultList = document.getElementById('results-list');

let currentIndex = -1;
let debounceTimeout; // para evitar muitas requisições à api

// função para atualizar a classe active no container, que controla a visibilidade do input via css
function updateActiveClass() {
  const hasText = searchInput.value.trim() !== "";
  const inputIsFocused = document.activeElement === searchInput;

  if (hasText || inputIsFocused) {
    searchContainer.classList.add('active');
  } else {
    searchContainer.classList.remove('active');
  }
}

// função para buscar filmes/séries na api da tmdb
async function searchMoviesAndTvShows(query) {
    if (!query) {
        return []; // retorna um array vazio se a query estiver vazia
    }
    try {
        // busca por filmes
        const moviesResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
        const moviesData = await moviesResponse.json();
        // mapeia para objetos com título, poster_path, id e tipo de mídia
        const movieResults = moviesData.results.map(movie => ({
            title: movie.title,
            poster_path: movie.poster_path,
            id: movie.id,
            media_type: 'movie' // indica que é um filme
        }));

        // busca por séries de tv
        const tvShowsResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
        const tvShowsData = await tvShowsResponse.json();
        // mapeia para objetos com nome, poster_path, id e tipo de mídia
        const tvShowResults = tvShowsData.results.map(tv => ({
            title: tv.name, // séries usam 'name'
            poster_path: tv.poster_path,
            id: tv.id,
            media_type: 'tv' // indica que é uma série de tv
        }));

        // combina os resultados de filmes e séries
        const combinedResults = [...movieResults, ...tvShowResults];

        // filtra para remover duplicatas e ordena por popularidade
        const uniqueResults = [];
        const seen = new Set();
        combinedResults.forEach(item => {
            // um identificador único que considera título e tipo de mídia
            const identifier = `${item.title}-${item.media_type}`; 
            if (!seen.has(identifier)) {
                uniqueResults.push(item);
                seen.add(identifier);
            }
        });
        
        // ordena por popularidade para ter os mais relevantes primeiro
        uniqueResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        return uniqueResults;

    } catch (error) {
        console.error("Erro ao buscar dados da TMDb:", error);
        return []; // retorna um array vazio em caso de erro
    }
}


// atualiza a lista de resultados conforme o texto digitado
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimeout); // limpa o timeout anterior a cada nova digitação

  const inputValue = searchInput.value.toLowerCase().trim();
  resultList.innerHTML = '';
  currentIndex = -1;

  updateActiveClass();

  if (inputValue === "") {
    resultList.style.display = 'none';
    return;
  }

  // define um novo timeout para a busca (ex: 300ms após a última digitação)
  debounceTimeout = setTimeout(async () => {
    const results = await searchMoviesAndTvShows(inputValue); 

    if (results.length === 0) {
      const li = document.createElement('li');
      li.textContent = "nenhum resultado encontrado";
      li.style.color = "#888";
      resultList.appendChild(li);
    } else {
      results.forEach(item => {
        const li = document.createElement('li');
        // armazena o id e o tipo de mídia como atributos de dados no <li>
        li.dataset.itemId = item.id;
        li.dataset.mediaType = item.media_type;
        
        const img = document.createElement('img');
        // constrói a url completa do poster ou usa a imagem padrão
        img.src = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : NO_POSTER_IMAGE_URL;
        img.alt = `Poster de ${item.title}`;
        img.classList.add('search-result-poster'); // adiciona uma classe para estilização

        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;

        li.appendChild(img);
        li.appendChild(titleSpan);

        // ao clicar no item, redireciona para openFilmes.html com id e tipo
        li.addEventListener('click', () => {
          const itemId = li.dataset.itemId;
          const mediaType = li.dataset.mediaType;
          if (itemId && mediaType) {
            window.location.href = `/Lumiere/pages/openFilmes.html?id=${itemId}&type=${mediaType}`;
          }
        });

        resultList.appendChild(li);
      });
    }

    resultList.style.display = 'block';
  }, 300); // debounce de 300ms
});

// ao sair com o mouse do container: fechar só se input vazio e sem foco
searchContainer.addEventListener('mouseleave', () => {
  // delay para permitir clique em itens da lista antes de fechar
  setTimeout(() => {
    const hasText = searchInput.value.trim() !== "";
    const inputIsFocused = document.activeElement === searchInput;

    if (!hasText && !inputIsFocused) {
      resultList.style.display = 'none';
      updateActiveClass();
    }
  }, 150);
});

// mostrar dropdown ao entrar com o mouse no container se tiver texto
searchContainer.addEventListener('mouseenter', () => {
  if (searchInput.value.trim() !== "") {
    resultList.style.display = 'block';
  }
});

// atualizar active class no foco e blur do input
searchInput.addEventListener('focus', () => {
  updateActiveClass();
  if (searchInput.value.trim() !== "") {
    resultList.style.display = 'block';
  }
});

searchInput.addEventListener('blur', () => {
  // delay para permitir clique em dropdown antes de esconder
  setTimeout(() => {
    updateActiveClass();
    if (searchInput.value.trim() === "") {
      resultList.style.display = 'none';
    }
  }, 150);
});

// navegação teclado: setas e enter
searchInput.addEventListener('keydown', (e) => {
  // itens válidos (exclui "nenhum resultado encontrado")
  const items = Array.from(resultList.querySelectorAll('li')).filter(li => li.textContent !== "nenhum resultado encontrado");
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentIndex = (currentIndex + 1) % items.length;
    updateActiveItem(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateActiveItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentIndex >= 0 && items[currentIndex]) {
      const selected = items[currentIndex];
      const itemId = selected.dataset.itemId;
      const mediaType = selected.dataset.mediaType;

      if (itemId && mediaType) {
        // redireciona para openFilmes.html com o id e tipo de mídia do item selecionado
        window.location.href = `./pages/openFilmes.html?id=${itemId}&type=${mediaType}`;
      }
    }
  }
});

function updateActiveItem(items) {
  items.forEach(item => item.classList.remove('active'));
  if (items[currentIndex]) {
    items[currentIndex].classList.add('active');
    items[currentIndex].scrollIntoView({ block: 'nearest' });
  }
}
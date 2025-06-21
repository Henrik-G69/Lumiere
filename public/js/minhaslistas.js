// --- CONSTANTES E CHAVES DE LOCAL STORAGE ---
const api_key = "98f79a8fc16247f2c16e9d0b422dbfbe";
const img_url = "https://image.tmdb.org/t/p/w500";

const LOCAL_STORAGE_USER_LISTS_KEY = "userLists";
const CACHE_KEY_MEDIA_DETAILS = "mediaDetailsCache_";
const CACHE_DURATION_MS = 3600000; // 1 hora
const DEBOUNCE_DELAY_MS = 150; // Atraso para pesquisa do MovieDB

const DEFAULT_LISTS = [
  { id: "assistirMaisTarde", name: "Assistir Mais Tarde", films: [] },
  { id: "favoritos", name: "Meus Favoritos", films: [] },
];

// --- REFERÊNCIAS DO DOM ---
const listsContainer = document.querySelector(".all-lists-container");
const addListBtn = document.getElementById("addListBtn"); // Botão global de adicionar lista
const listModal = document.getElementById("listModal");
const closeButton = listModal.querySelector(".close-button");
const modalTitle = document.getElementById("modalTitle");
const listNameInput = document.getElementById("listNameInput");
const listNameError = document.getElementById("listNameError");
const movieSearchInput = document.getElementById("movieSearchInput");
const searchMovieBtn = document.getElementById("searchMovieBtn");
const searchResults = document.getElementById("searchResults");
const selectedMoviesList = document.getElementById("selectedMoviesList"); // Ul para filmes no modal
const saveListBtn = document.getElementById("saveListBtn");
const userListsContent = document.getElementById("user-lists-content");

const listItemTemplate =
  document.getElementById("listItemTemplate").content.firstElementChild;
const movieCardTemplate =
  document.getElementById("movieCardTemplate").content.firstElementChild; // Para carrossel
const movieSearchResultTemplate = document.createElement("li"); // Template simples para resultado de pesquisa
movieSearchResultTemplate.classList.add("search-result-item");
movieSearchResultTemplate.innerHTML = `
    <img src="" alt="Poster" class="search-result-poster">
    <span class="search-result-title"></span>
    <button class="add-to-modal-list-btn">Adicionar</button>
`;

let currentEditingListId = null; // Guarda o ID da lista que está sendo editada
let moviesInCurrentModalList = [];

function getLoggedInUserEmail() {
  return localStorage.getItem("loggedInUserEmail");
}

function getAllUserListsFromLocalStorage() {
  const storedListsJSON = localStorage.getItem(LOCAL_STORAGE_USER_LISTS_KEY);
  return storedListsJSON ? JSON.parse(storedListsJSON) : {};
}

function saveAllUserListsToLocalStorage(allUserLists) {
  localStorage.setItem(
    LOCAL_STORAGE_USER_LISTS_KEY,
    JSON.stringify(allUserLists)
  );
}

function loadUserLists(userEmail) {
  const allUserLists = getAllUserListsFromLocalStorage();
  if (!allUserLists[userEmail]) {
    allUserLists[userEmail] = JSON.parse(JSON.stringify(DEFAULT_LISTS));
    saveAllUserListsToLocalStorage(allUserLists);
  }
  return allUserLists[userEmail];
}

function createNewUserList(listName, initialMovieIds = []) {
  const userEmail = getLoggedInUserEmail();
  if (!userEmail) {
    console.error("Nenhum usuário logado para criar uma nova lista.");
    return null;
  }

  const allUserLists = getAllUserListsFromLocalStorage();
  const userLists = allUserLists[userEmail] || [];

  const normalizedNewListName = listName.trim().toLowerCase();
  const nameExists = userLists.some(
    (list) => list.name.toLowerCase() === normalizedNewListName
  );

  if (nameExists) {
    listNameError.textContent = "Já existe uma lista com este nome.";
    return null;
  }
  listNameError.textContent = ""; // Limpa erro se tudo ok

  const newListId = `customList_${Date.now()}`;
  const newList = {
    id: newListId,
    name: listName.trim(),
    films: initialMovieIds,
  };

  userLists.push(newList);
  allUserLists[userEmail] = userLists;
  saveAllUserListsToLocalStorage(allUserLists);
  console.log(`Nova lista "${listName}" criada para o usuário ${userEmail}.`);
  return newList; // Retorna a nova lista completa
}

function updateExistingUserList(listId, newName, newMovieIds) {
  const userEmail = getLoggedInUserEmail();
  if (!userEmail) {
    console.error("Nenhum usuário logado para atualizar lista.");
    return false;
  }

  const allUserLists = getAllUserListsFromLocalStorage();
  const userLists = allUserLists[userEmail];

  if (!userLists) return false;

  const targetList = userLists.find((list) => list.id === listId);

  if (targetList) {
    const normalizedNewName = newName.trim().toLowerCase();
    const nameExists = userLists.some(
      (list) =>
        list.id !== listId && list.name.toLowerCase() === normalizedNewName
    );

    if (nameExists) {
      listNameError.textContent = "Já existe uma lista com este nome.";
      return false;
    }
    listNameError.textContent = ""; // Limpa erro se tudo ok

    targetList.name = newName.trim();
    targetList.films = newMovieIds;
    saveAllUserListsToLocalStorage(allUserLists);
    console.log(`Lista "${targetList.name}" atualizada.`);
    return true;
  }
  return false;
}

function deleteUserList(listId) {
  const userEmail = getLoggedInUserEmail();
  if (!userEmail) {
    console.error("Nenhum usuário logado para deletar lista.");
    return false;
  }

  const allUserLists = getAllUserListsFromLocalStorage();
  let userLists = allUserLists[userEmail];

  if (!userLists) return false;

  const initialLength = userLists.length;
  userLists = userLists.filter((list) => list.id !== listId);
  allUserLists[userEmail] = userLists;

  if (userLists.length < initialLength) {
    saveAllUserListsToLocalStorage(allUserLists);
    console.log(`Lista com ID "${listId}" deletada.`);
    return true;
  }
  return false;
}

function formatDuration(mediaDetails, mediaType) {
  /* ... seu código ... */
  if (!mediaDetails) {
    return "N/A";
  }

  if (mediaType === "movie") {
    const minutes = mediaDetails.runtime;
    if (minutes === null || minutes === undefined || minutes <= 0) {
      return "N/A";
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return remainingMinutes === 0
        ? `${hours}h`
        : `${hours}h${remainingMinutes}`;
    } else {
      return `${remainingMinutes}min`;
    }
  } else if (mediaType === "tv") {
    const seasons = mediaDetails.number_of_seasons;
    // se a série estiver 'Ended' e tiver mais de 1 temporada, mostra a quantidade de temporadas.
    // se estiver 'Returning Series' ou 'Canceled' e tiver mais de 1 temporada, também.
    // se tiver apenas 1 temporada, mostra '1S'.
    if (seasons === 1) {
      return "1S";
    } else if (seasons > 1) {
      return `${seasons}S`;
    }
  }
  return "N/A";
}

const getItemWidthWithGap = (carouselElement, item) => {
  if (!item) {
    const computedStyle = getComputedStyle(carouselElement);
    const gapValue = parseFloat(computedStyle.gap);
    return 176 + (isNaN(gapValue) ? 0 : gapValue);
  }
  const computedStyle = getComputedStyle(carouselElement);
  const gapValue = parseFloat(computedStyle.gap);
  return item.offsetWidth + (isNaN(gapValue) ? 0 : gapValue);
};

/**
 * Função para inicializar um carrossel específico.
 * Esta função será chamada para CADA carrossel na página.
 * @param {HTMLElement} carousel O elemento DOM do carrossel.
 */
function initializeCarousel(carousel) {
  const carouselId = carousel.id;
  if (!carouselId) {
    console.warn(
      `Carrossel sem ID encontrado:`,
      carousel,
      `As setas e indicadores podem não funcionar corretamente.`
    );
    return;
  }

  const parentContainer = carousel.closest(".list-item"); // busca as setas e indicadores dentro do mesmo list-item
  if (!parentContainer) {
    console.error(
      "Contêiner pai .list-item não encontrado para o carrossel:",
      carousel
    );
    return;
  }

  const leftArrow = parentContainer.querySelector(
    `.arrow.carousel-arrow-left[data-carousel-id="${carouselId}"]`
  );
  const rightArrow = parentContainer.querySelector(
    `.arrow.carousel-arrow-right[data-carousel-id="${carouselId}"]`
  );
  const indicatorsContainer = parentContainer.querySelector(
    `.indicators[data-carousel-id="${carouselId}"]`
  );

  const itemsPerPageLogic = 5;
  let currentPage = 0;

  const getTotalPages = () => {
    const totalItems = carousel.children.length;
    if (totalItems === 0) return 0;
    return Math.ceil(totalItems / itemsPerPageLogic);
  };

  const goToPage = (pageIndex) => {
    const totalPages = getTotalPages();
    if (totalPages === 0) return;

    pageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));

    const firstItem = carousel.children[0];
    if (!firstItem) return;

    const itemWidthWithGap = getItemWidthWithGap(carousel, firstItem);
    const scrollAmount = itemWidthWithGap * itemsPerPageLogic * pageIndex;

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    carousel.scroll({
      left: Math.min(scrollAmount, maxScrollLeft),
      behavior: "smooth",
    });

    currentPage = pageIndex;
    updateIndicators();
    updateArrowVisibility();
  };

  const updateIndicators = () => {
    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = "";
    const totalPages = getTotalPages();

    if (totalPages <= 1) {
      indicatorsContainer.style.display = "none";
      return;
    }

    indicatorsContainer.style.display = "flex";

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      if (i === currentPage) {
        dot.classList.add("active");
      }
      dot.dataset.pageIndex = i;
      indicatorsContainer.appendChild(dot);
      dot.addEventListener("click", () => goToPage(i));
    }
  };

  const updateArrowVisibility = () => {
    if (!leftArrow || !rightArrow) return;

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    const scrollThreshold = 5;

    if (carousel.scrollLeft <= scrollThreshold) {
      leftArrow.classList.add("arrow--hidden");
    } else {
      leftArrow.classList.remove("arrow--hidden");
    }

    if (carousel.scrollLeft >= maxScrollLeft - scrollThreshold) {
      rightArrow.classList.add("arrow--hidden");
    } else {
      rightArrow.classList.remove("arrow--hidden");
    }
  };

  if (leftArrow) {
    leftArrow.addEventListener("click", () => {
      if (currentPage > 0) {
        goToPage(currentPage - 1);
      }
    });
  }

  if (rightArrow) {
    rightArrow.addEventListener("click", () => {
      if (currentPage < getTotalPages() - 1) {
        goToPage(currentPage + 1);
      }
    });
  }

  let scrollTimeout;
  carousel.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const firstItem = carousel.children[0];
      if (!firstItem) {
        currentPage = 0;
      } else {
        const itemWidthWithGap = getItemWidthWithGap(carousel, firstItem);
        const currentScrollLeft = carousel.scrollLeft;
        currentPage = Math.round(
          currentScrollLeft / (itemWidthWithGap * itemsPerPageLogic)
        );
        currentPage = Math.min(currentPage, getTotalPages() - 1);
      }
      updateIndicators();
      updateArrowVisibility();
    }, 100);
  });

  const observer = new MutationObserver(() => {
    goToPage(Math.min(currentPage, getTotalPages() - 1));

    if (carousel.children.length > 0) {
      Array.from(carousel.children).forEach((item, index) => {
        if (!item.classList.contains("film-on-list--animated")) {
          item.classList.add("film-on-list--animated");
          item.style.animationDelay = `${index * 0.05}s`;
        }
      });
    }
  });
  observer.observe(carousel, { childList: true });

  // garante que as setas e dots estejam corretos no carregamento inicial
  setTimeout(() => {
    updateIndicators();
    updateArrowVisibility();
  }, 200);
}

/**
 * Carrega e exibe os filmes de uma lista específica do usuário.
 * @param {HTMLElement} carouselElement O elemento DOM do carrossel onde os filmes serão exibidos.
 * @param {Array<string>} movieIds Array de IDs dos filmes na lista.
 * @param {string} listId O ID da lista a que esses filmes pertencem (para remoção).
 * @param {string} mediaType Tipo de mídia (geralmente 'movie').
 */
async function renderUserListMovies(
  carouselElement,
  movieIds,
  listId,
  mediaType = "movie"
) {
  if (!carouselElement) {
    console.error(
      "Elemento carrossel não encontrado para renderizar filmes da lista."
    );
    return;
  }

  carouselElement.innerHTML = "<p>Carregando filmes da sua lista...</p>";

  if (!movieIds || movieIds.length === 0) {
    carouselElement.innerHTML = "<p>Esta lista está vazia.</p>";
    return;
  }

  carouselElement.innerHTML = ""; // Limpa o conteúdo existente

  if (!movieCardTemplate) {
    console.error(
      "Template de card de filme/série com ID 'movieCardTemplate' não encontrado no DOM."
    );
    carouselElement.innerHTML =
      '<p style="color: red;">Erro: Template de mídia não encontrado.</p>';
    return;
  }

  const mediaPromises = movieIds.map(async (movieId) => {
    let mediaDetails;
    const mediaDetailsCacheKey = `${CACHE_KEY_MEDIA_DETAILS}${mediaType}_${movieId}`;
    const savedDetailsCache = localStorage.getItem(mediaDetailsCacheKey);

    if (savedDetailsCache) {
      const { data, timestamp } = JSON.parse(savedDetailsCache);
      const now = Date.now();
      if (now - timestamp < CACHE_DURATION_MS) {
        mediaDetails = data;
      }
    }

    if (!mediaDetails) {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${movieId}?api_key=${api_key}&language=en-US`
        );
        if (!response.ok) {
          console.warn(
            `Aviso: Erro ao buscar detalhes para ${mediaType} ID ${movieId}. Status: ${response.status}`
          );
          return null;
        }
        mediaDetails = await response.json();
        const detailsCacheEntry = {
          data: mediaDetails,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          mediaDetailsCacheKey,
          JSON.stringify(detailsCacheEntry)
        );
      } catch (error) {
        console.error(
          `Erro ao buscar detalhes para ${mediaType} ID ${movieId}:`,
          error
        );
        return null;
      }
    }
    return mediaDetails;
  });

  const moviesData = await Promise.all(mediaPromises);

  moviesData.forEach((movie) => {
    if (movie) {
      const mediaCard = movieCardTemplate.cloneNode(true);

      const filmOnListContainer = mediaCard.querySelector(".film-on-list");
      if (filmOnListContainer) {
        filmOnListContainer.dataset.filmId = movie.id;
        filmOnListContainer.dataset.mediaType = mediaType;
      }

      const posterImg = mediaCard.querySelector(".film-banner-list-carousel");
      if (posterImg && movie.poster_path) {
        posterImg.src = `${img_url}${movie.poster_path}`;
        posterImg.alt = `Pôster da ${
          mediaType === "movie" ? "filme" : "série"
        } ${movie.title || movie.name}`;
      } else {
        posterImg.src = "../public/img/placeholder.png";
        posterImg.alt = "Imagem não disponível";
      }

      // para abrir a página de detalhes
      if (posterImg) {
        posterImg.addEventListener("click", () => {
          const targetPage = "/Lumiere/pages/openFilmes.html";
          const preloadedDetails = {
            id: movie.id,
            type: mediaType,
            title: movie.title || movie.name,
            overview: movie.overview,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date || movie.first_air_date,
            genre_ids: movie.genre_ids,
            runtime: movie.runtime,
            number_of_seasons: movie.number_of_seasons,
            status: movie.status,
          };

          try {
            sessionStorage.setItem(
              "preloadedContentDetails",
              JSON.stringify(preloadedDetails)
            );
            console.log(
              "Detalhes pré-carregados salvos no sessionStorage para ID:",
              movie.id
            );
          } catch (e) {
            console.error("Erro ao salvar no sessionStorage:", e);
          }
          window.location.href = `${targetPage}?id=${movie.id}&type=${mediaType}`;
        });
      }

      const durationElement = mediaCard.querySelector(".duration-value");
      if (durationElement) {
        durationElement.textContent = formatDuration(movie, mediaType);
      }

      const rating = movie.vote_average;
      const displayRating =
        rating !== null && rating !== undefined && rating > 0
          ? (rating / 2).toFixed(1)
          : "N/A";

      const ratingListValueElement =
        mediaCard.querySelector(".rating-list-value");
      if (ratingListValueElement) {
        ratingListValueElement.textContent = displayRating;
      }
      const starRatingDiv = mediaCard.querySelector(".star-rating");
      if (
        starRatingDiv &&
        rating !== null &&
        rating !== undefined &&
        rating > 0
      ) {
        const percentage = (rating / 10) * 100;
        starRatingDiv.style.setProperty("--pct", `${percentage}%`);
      } else if (starRatingDiv) {
        starRatingDiv.style.setProperty("--pct", `0%`);
      }

      // Botão para remover filme diretamente do carrossel da lista
      const removeMovieBtn = mediaCard.querySelector(
        ".remove-movie-from-list-button"
      );

      if (removeMovieBtn) {
        removeMovieBtn.addEventListener("click", async (event) => {
          event.stopPropagation(); // impede que o clique no botão de remover acione eventos de clique no poster/card do filme

          if (
            confirm(
              `Tem certeza que deseja remover "${
                movie.title || movie.name
              }" desta lista?`
            )
          ) {
            const userEmail = getLoggedInUserEmail();
            let allUserLists = getAllUserListsFromLocalStorage();

            // verifica se as listas do usuário existem
            if (!allUserLists || !allUserLists[userEmail]) {
              console.error(
                "Nenhuma lista encontrada para o usuário logado. Não é possível remover o filme."
              );
              return;
            }

            let userLists = allUserLists[userEmail];
            const targetList = userLists.find((l) => l.id === listId); // Encontra a lista específica pelo ID

            if (targetList) {
              targetList.films = targetList.films.filter(
                (id) => id !== movie.id.toString()
              );

              // Salva as listas atualizadas de volta no Local Storage
              saveAllUserListsToLocalStorage(allUserLists);

              // Remove o elemento do filme do DOM.
              // Se 'mediaCard' é o elemento pai que contém o botão e representa o filme no carrossel,
              // então mediaCard.remove() é o correto.
              if (mediaCard) {
                mediaCard.remove();
              } else {
                console.warn(
                  'Elemento "mediaCard" não encontrado para remoção do DOM.'
                );
              }

              // Re-inicializa o carrossel para que as setas e indicadores sejam atualizados,
              // refletindo a nova quantidade de filmes na lista.
              // Certifique-se de que 'carouselElement' referencia o container principal do carrossel.
              if (carouselElement) {
                initializeCarousel(carouselElement);
              } else {
                console.warn(
                  'Elemento "carouselElement" não encontrado para reinicialização do carrossel.'
                );
              }
            } else {
              console.warn(
                `Lista com ID "${listId}" não encontrada para o usuário atual.`
              );
            }
          }
        });
      } else {
        console.warn(
          "Botão de remover filme não encontrado na mediaCard. Verifique o seletor ou a estrutura HTML."
        );
      }
      carouselElement.appendChild(mediaCard);
    }
  });

  initializeCarousel(carouselElement);
}

async function renderAllUserLists() {
  const loggedInUserEmail = getLoggedInUserEmail();
  if (!loggedInUserEmail) {
    console.warn(
      "Nenhum usuário logado. Redirecionando para a página de login."
    );
    window.location.href = "./login.html";
    return;
  }

  const userLists = loadUserLists(loggedInUserEmail);

  userListsContent.innerHTML = ""; // Limpa o container antes de renderizar

  if (userLists.length === 0) {
    listsContainer.innerHTML =
      "<p>Você ainda não tem listas. Crie uma nova lista!</p>";
    return;
  }

  for (const list of userLists) {
    const listElement = listItemTemplate.cloneNode(true);

    const carouselForList = listElement.querySelector(".films-carousel");
    carouselForList.id = `carousel_${list.id}`;

    const leftArrow = listElement
      .querySelector(".arrowLeft-icon")
      .closest(".arrow");
    const rightArrow = listElement
      .querySelector(".arrowRight-icon")
      .closest(".arrow");
    const indicators = listElement.querySelector(".indicators");

    if (leftArrow) leftArrow.dataset.carouselId = carouselForList.id;
    if (rightArrow) rightArrow.dataset.carouselId = carouselForList.id;
    if (indicators) indicators.dataset.carouselId = carouselForList.id;

    const listNameDisplay = listElement.querySelector(".list-name-display");
    listNameDisplay.textContent = list.name;

    // Botão de Editar
    const editButton = listElement.querySelector(".edit-list-button");
    editButton.addEventListener("click", () => openListModal(list.id)); // Abre modal para edição

    // Botão de Deletar
    const deleteButton = listElement.querySelector(".delete-list-button");
    deleteButton.addEventListener("click", () => {
      if (confirm(`Tem certeza que deseja deletar a lista "${list.name}"?`)) {
        if (deleteUserList(list.id)) {
          listElement.remove(); // Remove do DOM
          // Se a lista excluída for a única ou a última, atualize a mensagem
          const updatedUserLists = loadUserLists(loggedInUserEmail);
          if (updatedUserLists.length === 0) {
            listsContainer.innerHTML =
              "<p>Você ainda não tem listas. Crie uma nova lista!</p>";
          }
        } else {
          alert("Erro ao deletar a lista.");
        }
      }
    });

    await renderUserListMovies(carouselForList, list.films, list.id, "movie"); // Passa o list.id
    userListsContent.appendChild(listElement);
  }
}

// --- LÓGICA DO MODAL ---

/**
 * Abre o modal para criação ou edição de uma lista.
 * @param {string|null} listId O ID da lista a ser editada, ou null para criar uma nova.
 */
async function openListModal(listId = null) {
  listModal.style.display = "block";
  listNameError.textContent = ""; // Limpa mensagens de erro
  searchResults.innerHTML = ""; // Limpa resultados de pesquisa
  selectedMoviesList.innerHTML = ""; // Limpa filmes selecionados
  moviesInCurrentModalList = []; // Reseta a lista temporária de filmes

  currentEditingListId = listId;

  if (listId) {
    modalTitle.textContent = "Editar Lista";
    const userEmail = getLoggedInUserEmail();
    const allUserLists = getAllUserListsFromLocalStorage();
    const userLists = allUserLists[userEmail];
    const listToEdit = userLists.find((list) => list.id === listId);

    if (listToEdit) {
      listNameInput.value = listToEdit.name;
      // Popula moviesInCurrentModalList com os filmes da lista existente
      const mediaPromises = listToEdit.films.map(async (movieId) => {
        let mediaDetails;
        const mediaDetailsCacheKey = `${CACHE_KEY_MEDIA_DETAILS}movie_${movieId}`; // Assumindo 'movie'
        const savedDetailsCache = localStorage.getItem(mediaDetailsCacheKey);

        if (savedDetailsCache) {
          const { data, timestamp } = JSON.parse(savedDetailsCache);
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION_MS) {
            mediaDetails = data;
          }
        }

        if (!mediaDetails) {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/movie/${movieId}?api_key=${api_key}&language=en-US`
            );
            if (!response.ok) return null;
            mediaDetails = await response.json();
            localStorage.setItem(
              mediaDetailsCacheKey,
              JSON.stringify({ data: mediaDetails, timestamp: Date.now() })
            );
          } catch (error) {
            console.error(
              `Erro ao buscar detalhes do filme ${movieId}:`,
              error
            );
            return null;
          }
        }
        return mediaDetails;
      });
      const existingMovies = await Promise.all(mediaPromises);
      existingMovies.forEach((movie) => {
        if (movie) {
          addMovieToModal(movie);
        }
      });
    }
  } else {
    modalTitle.textContent = "Criar Nova Lista";
    listNameInput.value = "";
  }
}

function closeListModal() {
  listModal.style.display = "none";
  currentEditingListId = null;
  moviesInCurrentModalList = [];
  searchResults.innerHTML = "";
  selectedMoviesList.innerHTML = "";
  listNameInput.value = "";
  movieSearchInput.value = "";
}

/**
 * Adiciona um filme à lista temporária do modal e renderiza-o.
 * @param {object} movieDetails Detalhes completos do filme/série.
 */
function addMovieToModal(movieDetails) {
  // Garante que o filme não seja duplicado na lista do modal
  if (!moviesInCurrentModalList.some((m) => m.id === movieDetails.id)) {
    moviesInCurrentModalList.push(movieDetails);
    renderSelectedMoviesInModal();
  }
}

/**
 * Remove um filme da lista temporária do modal e renderiza-a novamente.
 * @param {number} movieId O ID do filme a ser removido.
 */
function removeMovieFromModal(movieId) {
  moviesInCurrentModalList = moviesInCurrentModalList.filter(
    (movie) => movie.id !== movieId
  );
  renderSelectedMoviesInModal();
}

/**
 * Renderiza os filmes atualmente na lista temporária do modal.
 */
function renderSelectedMoviesInModal() {
  selectedMoviesList.innerHTML = "";
  if (moviesInCurrentModalList.length === 0) {
    selectedMoviesList.innerHTML = "<li>Nenhum filme adicionado ainda.</li>";
    return;
  }
  moviesInCurrentModalList.forEach((movie) => {
    const li = document.createElement("li");
    li.classList.add("selected-movie-item");
    li.dataset.movieId = movie.id;
    li.innerHTML = `
            <img src="${
              movie.poster_path
                ? img_url + movie.poster_path
                : "../public/img/placeholder.png"
            }" alt="Poster" class="selected-movie-poster">
            <span>${movie.title || movie.name}</span>
            <button class="remove-from-modal-list-btn" title="Remover filme">
                <img src="../public/icons/TrashFill.svg" alt="Remover">
            </button>
        `;
    const removeBtn = li.querySelector(".remove-from-modal-list-btn");
    removeBtn.addEventListener("click", () => removeMovieFromModal(movie.id));
    selectedMoviesList.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Renderiza as listas iniciais
  await renderAllUserLists();

  // Event listeners para o modal
  addListBtn.addEventListener("click", () => openListModal()); // Abre modal para nova lista
  closeButton.addEventListener("click", closeListModal);
  window.addEventListener("click", (event) => {
    if (event.target === listModal) {
      closeListModal();
    }
  });

  let searchTimeout;
  movieSearchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    if (movieSearchInput.value.trim() === "") {
      searchResults.innerHTML = ""; // Limpa resultados
      searchResults.style.display = "none"; // ESCONDE QUANDO O CAMPO ESTÁ VAZIO
      return;
    }
    searchResults.style.display = "block"; // MOSTRA QUANDO HÁ TEXTO
    searchTimeout = setTimeout(() => {
      searchMovies(movieSearchInput.value.trim());
    }, DEBOUNCE_DELAY_MS);
  });
  searchMovieBtn.addEventListener("click", () => {
    if (movieSearchInput.value.trim() !== "") {
      searchMovies(movieSearchInput.value.trim());
    }
  });

  saveListBtn.addEventListener("click", () => {
    const listName = listNameInput.value.trim();
    const movieIds = moviesInCurrentModalList.map((movie) =>
      movie.id.toString()
    ); // IDs como string

    if (listName === "") {
      listNameError.textContent = "O nome da lista não pode estar vazio.";
      return;
    }

    if (currentEditingListId) {
      // Edita lista existente
      if (updateExistingUserList(currentEditingListId, listName, movieIds)) {
        closeListModal();
        renderAllUserLists(); // Re-renderiza todas as listas para atualizar a UI
      }
    } else {
      // Cria nova lista
      const newList = createNewUserList(listName, movieIds);
      if (newList) {
        closeListModal();
        renderAllUserLists(); // Re-renderiza todas as listas para atualizar a UI
      }
    }
  });
});

async function searchMovies(query) {
  searchResults.innerHTML = "<p>Pesquisando...</p>";
  searchResults.style.display = "block";

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${api_key}&language=en-US&query=${encodeURIComponent(
        query
      )}`
    );
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();

    searchResults.innerHTML = ""; // Limpa resultados anteriores

    const filteredResults = data.results.filter(
      (media) =>
        (media.media_type === "movie" || media.media_type === "tv") &&
        media.poster_path
    );

    if (filteredResults.length === 0) {
      searchResults.innerHTML = "<p>Nenhum resultado encontrado.</p>";
      return;
    }

    filteredResults.forEach((media) => {
      const resultItem = movieSearchResultTemplate.cloneNode(true);
      const poster = resultItem.querySelector(".search-result-poster");
      const title = resultItem.querySelector(".search-result-title");
      const addButton = resultItem.querySelector(".add-to-modal-list-btn");

      poster.src = `${img_url}${media.poster_path}`;
      poster.alt = `Poster de ${media.title || media.name}`;
      title.textContent = `${media.title || media.name} (${(
        media.release_date ||
        media.first_air_date ||
        ""
      ).substring(0, 4)})`;

      // Desabilita o botão se o filme já estiver na lista temporária do modal
      if (moviesInCurrentModalList.some((m) => m.id === media.id)) {
        addButton.textContent = "Adicionado";
        addButton.disabled = true;
        addButton.classList.add("added");
      } else {
        addButton.textContent = "Adicionar";
        addButton.disabled = false;
        addButton.classList.remove("added");
      }

      addButton.addEventListener("click", () => {
        addMovieToModal(media);
        addButton.textContent = "Adicionado";
        addButton.disabled = true;
        addButton.classList.add("added");
      });
      searchResults.appendChild(resultItem);
    });
  } catch (error) {
    console.error("Erro ao pesquisar filmes:", error);
    searchResults.innerHTML =
      '<p style="color: red;">Erro ao pesquisar. Tente novamente.</p>';
  }
}

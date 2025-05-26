const data = [
  "Inception",
  "Interstellar",
  "The Matrix",
  "Tenet",
  "Dune",
  "The Martian",
  "Blade Runner 2049",
  "Arrival",
  "Ex Machina",
  "Gravity",
  "Some like it hot",
  "The Gentlemen Prefer Blondes",
  "Niagara (1953)",
  "How to Marry a Millionaire",
  "Let's Make Love",
  "The Misfits",
  "The Seven Year Itch",
  "Metropolis",
  "American Psycho",
  "Ainda estou aqui (2024)",
  "Lucio Flavio: O passageiro da agonia",
  "O Beijo no Asfalto",
  "Cidade de Deus",
  "Mother's Instinct",
  "The Hangover",
  "Superbad",
  "Anchorman: The Legend of Ron Burgundy",
  "Step Brothers",
  "Dumb and Dumber",
  "The Grand Budapest Hotel",
  "21 Jump Street",
  "Forrest Gump",
  "The Big Lebowski",
  "The 40-Year-Old Virgin",
  "Borat",
  "Pineapple Express",
  "Hot Fuzz",
  "The Hangover Part II",
  "Tropic Thunder",
  "Shaun of the Dead",
  "Zombieland",
  "Jumanji: Welcome to the Jungle",
  "Deadpool",
  "Ghostbusters",
  "The Princess Bride",
  "Super Troopers",
  "Napoleon Dynamite",
  "Ferris Bueller's Day Off",
  "The Sandlot",
  "Clueless",
  "Legally Blonde",
  "The Other Guys",
  "Crazy, Stupid, Love"
];

const searchContainer = document.querySelector('.search-container');
const searchInput = document.getElementById('search-input');
const resultList = document.getElementById('results-list');

let currentIndex = -1;

// Função para atualizar a classe active no container, que controla a visibilidade do input via CSS
function updateActiveClass() {
  const hasText = searchInput.value.trim() !== "";
  const inputIsFocused = document.activeElement === searchInput;

  if (hasText || inputIsFocused) {
    searchContainer.classList.add('active');
  } else {
    searchContainer.classList.remove('active');
  }
}

// Atualiza a lista de resultados conforme o texto digitado
searchInput.addEventListener('input', () => {
  const inputValue = searchInput.value.toLowerCase().trim();
  resultList.innerHTML = '';
  currentIndex = -1;

  updateActiveClass();

  if (inputValue === "") {
    resultList.style.display = 'none';
    return;
  }

  const filtered = data.filter(item =>
    item.toLowerCase().includes(inputValue)
  );

  if (filtered.length === 0) {
    const li = document.createElement('li');
    li.textContent = "Nenhum resultado encontrado";
    li.style.color = "#888";
    resultList.appendChild(li);
  } else {
    filtered.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;

      // Clique no item preenche input e redireciona
      li.addEventListener('click', () => {
        searchInput.value = item;
        resultList.style.display = 'none';
        updateActiveClass();
        window.location.href = `#${encodeURIComponent(item)}`; // ajustar URL depois
      });

      resultList.appendChild(li);
    });
  }

  resultList.style.display = 'block';
});

// Ao sair com o mouse do container: fechar só se input vazio E sem foco
searchContainer.addEventListener('mouseleave', () => {
  // Delay para permitir clique em itens da lista antes de fechar
  setTimeout(() => {
    const hasText = searchInput.value.trim() !== "";
    const inputIsFocused = document.activeElement === searchInput;

    if (!hasText && !inputIsFocused) {
      resultList.style.display = 'none';
      updateActiveClass();
    }
  }, 150);
});

// Mostrar dropdown ao entrar com o mouse no container se tiver texto
searchContainer.addEventListener('mouseenter', () => {
  if (searchInput.value.trim() !== "") {
    resultList.style.display = 'block';
  }
});

// Atualizar active class no foco e blur do input
searchInput.addEventListener('focus', () => {
  updateActiveClass();
  if (searchInput.value.trim() !== "") {
    resultList.style.display = 'block';
  }
});

searchInput.addEventListener('blur', () => {
  // Delay para permitir clique em dropdown antes de esconder
  setTimeout(() => {
    updateActiveClass();
    if (searchInput.value.trim() === "") {
      resultList.style.display = 'none';
    }
  }, 150);
});

// Navegação teclado: setas e enter
searchInput.addEventListener('keydown', (e) => {
  // Itens válidos (exclui "Nenhum resultado encontrado")
  const items = Array.from(resultList.querySelectorAll('li')).filter(li => li.textContent !== "Nenhum resultado encontrado");
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
      searchInput.value = selected.textContent;
      resultList.style.display = 'none';
      updateActiveClass();
      window.location.href = `#${encodeURIComponent(selected.textContent)}`; // ajustar URL depois
    }
  }
});

// Atualiza classe active visual e faz scroll do item ativo na lista
function updateActiveItem(items) {
  items.forEach(item => item.classList.remove('active'));
  if (items[currentIndex]) {
    items[currentIndex].classList.add('active');
    items[currentIndex].scrollIntoView({ block: 'nearest' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const TMDB_API_KEY = '98f79a8fc16247f2c16e9d0b422dbfbe';
    const BASE_API_URL = 'https://api.themoviedb.org/3';
    const BASE_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
    const BASE_BACKDROP_URL = 'https://image.tmdb.org/t/p/w1280';

    // URL para a imagem placeholder. Verifique se o caminho está correto.
    const PLACEHOLDER_IMAGE_URL = '../public/icons/place-holder.svg'; 

    // Mapa de URLs base dos provedores de streaming.
    // As CHAVES DEVEM CORRESPONDER EXATAMENTE ao 'provider_name' que vem da API do TMDB.
    // Adicionei variações comuns para aumentar a robustez.
    // Use o console do navegador (aba Network) para verificar os nomes exatos se algo não funcionar.
    const STREAMING_PROVIDER_URLS = {
        'Netflix': 'https://www.netflix.com/',
        
        'Amazon Prime Video': 'https://www.primevideo.com/',
        'Prime Video': 'https://www.primevideo.com/', // Variação comum do TMDB
        
        'Disney Plus': 'https://www.disneyplus.com/',
        'Disney+': 'https://www.disneyplus.com/',     // Variação comum do TMDB
        
        'Max': 'https://www.max.com/',
        'HBO Max': 'https://www.max.com/',             // Nome antigo, ainda pode aparecer
        
        'Globoplay': 'https://globoplay.globo.com/',
        'Globo Play': 'https://globoplay.globo.com/',  // Variação com espaço
        
        'Star Plus': 'https://www.starplus.com/',
        'Star+': 'https://www.starplus.com/',          // Variação comum do TMDB
        
        'Paramount+': 'https://www.paramountplus.com/',
        'Paramount Plus': 'https://www.paramountplus.com/',
        'Paramount Plus Apple TV Channel': 'https://www.paramountplus.com/',
        'Paramount Plus Premium': 'https://www.paramountplus.com/',
        
        'Mubi': 'https://www.mubi.com/',
        'Oldflix': 'https://www.oldflix.com.br/',
        
        'Telecine Play': 'https://www.telecineplay.com.br/',
        'Telecine': 'https://www.telecineplay.com.br/', // Às vezes, o TMDB retorna só "Telecine"
        'Telecine Amazon Channel': 'https://www.primevideo.com/', 
        
        'Apple TV Plus': 'https://www.apple.com/apple-tv-plus/',
        'Apple TV+': 'https://www.apple.com/apple-tv-plus/', // Variação comum
        
        'Amazon Video': 'https://www.amazon.com/gp/video/storefront/', // Geral Amazon Video (compra/aluguel)
        
        'Lionsgate Plus': 'https://www.lionsgateplus.com/',
        'Lionsgate+': 'https://www.lionsgateplus.com/', // Variação comum
        
        'Looke': 'https://www.looke.com.br/',
        'Looke Amazon Channel': 'https://www.primevideo.com/', // Acessado via Prime Video
        
        'Claro Video': 'https://www.claro.com.br/claro-video',
        // Adicione outras variações aqui conforme necessário, sempre com o nome EXATO da API como chave
    };

    // --- Elementos do DOM (cache para performance e legibilidade) ---
    const elements = {
        bannerImg: document.querySelector('.banner-img'),
        bannerTitle: document.querySelector('.banner-info h1'),
        bannerDescription: document.querySelector('.banner-info p'),
        mainDescription: document.querySelector('section.description p'),
        castContainer: document.querySelector('.cast-container'),
        releasedYearElement: document.querySelector('.section.year .value'),
        languagesContainer: document.querySelector('.section.languages .buttons'),
        genresContainer: document.querySelector('.section.genres .buttons'),
        directorSection: document.querySelector('.director-section'),
        musicSection: document.querySelector('.music-section'),
        imdbRatingBox: document.querySelector('.imdb-rating-box'),
        playNowButton: document.querySelector('.btn-play'),
        providersContainer: document.querySelector('.section.watch .providers'),
        watchSection: document.querySelector('.section.watch'),
        containerDetails: document.querySelector('.container-details'),
        mainContent: document.querySelector('main'),
        bannerSection: document.querySelector('.banner'),
        matchCta: document.querySelector('.match-cta')
    };

    // --- Funções de Ajuda ---

    /**
     * Extrai o ID e o tipo de conteúdo (filme/série) da URL.
     * @returns {object} Um objeto com id e type.
     */
    function getContentIdAndTypeFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        let type = params.get('type');
        return { id, type };
    }

    /**
     * Busca a URL do trailer no YouTube.
     * Tenta buscar em inglês primeiro, depois em português.
     * @param {string} id O ID do conteúdo.
     * @param {string} contentType O tipo de conteúdo ('movie' ou 'tv').
     * @returns {string|null} A URL do trailer do YouTube ou null se não encontrado.
     */
    async function fetchTrailerUrl(id, contentType) {
        try {
            let response = await fetch(`${BASE_API_URL}/${contentType}/${id}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
            let data = await response.json();

            if (!response.ok || !data.results || data.results.length === 0) {
                // Se falhar ou não houver resultados em inglês, tenta em português
                response = await fetch(`${BASE_API_URL}/${contentType}/${id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`);
                data = await response.json();
                if (!response.ok) {
                    throw new Error(`Erro ao buscar vídeos: ${response.statusText}`);
                }
            }
            return findYouTubeVideo(data.results);
        } catch (error) {
            console.error('Erro ao buscar vídeos do trailer:', error);
            return null;
        }
    }

    /**
     * Encontra a URL de um trailer ou teaser do YouTube nos resultados da API.
     * @param {Array} videos Lista de objetos de vídeo da API.
     * @returns {string|null} URL do YouTube.
     */
    function findYouTubeVideo(videos) {
        const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        if (trailer) return `https://www.youtube.com/watch?v=${trailer.key}`;

        const teaser = videos.find(video => video.type === 'Teaser' && video.site === 'YouTube');
        if (teaser) return `https://www.youtube.com/watch?v=${teaser.key}`;

        return null;
    }

    /**
     * Busca os provedores de streaming para o Brasil.
     * @param {string} id O ID do conteúdo.
     * @param {string} contentType O tipo de conteúdo ('movie' ou 'tv').
     * @returns {object|null} Objeto com os provedores para o Brasil ou null.
     */
    async function fetchWatchProviders(id, contentType) {
        try {
            const response = await fetch(`${BASE_API_URL}/${contentType}/${id}/watch/providers?api_key=${TMDB_API_KEY}`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar provedores de watch: ${response.statusText}`);
            }
            const data = await response.json();
            return data.results.BR || null; // Retorna provedores para o Brasil
        } catch (error) {
            console.error('Erro ao buscar provedores de watch:', error);
            return null;
        }
    }

    /**
     * Busca os detalhes e créditos de um filme ou série.
     * Tenta 'movie' e 'tv' se o tipo preferido não for especificado ou falhar.
     * @param {string} id O ID do conteúdo.
     * @param {string} [preferredType=null] O tipo de conteúdo preferido ('movie' ou 'tv').
     * @returns {object|null} Objeto contendo content, credits e type ou null.
     */
    async function fetchContentDetails(id, preferredType = null) {
        if (!id) {
            console.error('ID do conteúdo não fornecido.');
            return null;
        }

        let contentType = preferredType;
        let contentData = null;
        let creditsData = null;

        const typesToTry = preferredType ? [preferredType] : ['movie', 'tv'];

        for (const type of typesToTry) {
            try {
                const contentResponse = await fetch(`${BASE_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`);

                if (contentResponse.ok) {
                    contentData = await contentResponse.json();
                    contentType = type; // Confirma o tipo encontrado
                    const creditsResponse = await fetch(`${BASE_API_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
                    if (creditsResponse.ok) {
                        creditsData = await creditsResponse.json();
                    } else {
                        console.warn(`Não foi possível carregar créditos para ${type} ID ${id}.`);
                    }
                    break; // Sai do loop se encontrar o conteúdo
                } else if (contentResponse.status === 404 && !preferredType) {
                    console.log(`ID ${id} não encontrado como ${type}. Tentando o próximo tipo...`);
                    continue; // Tenta o próximo tipo se não houver um tipo preferido e for 404
                } else {
                    throw new Error(`Erro ao buscar ${type} ID ${id}: ${contentResponse.statusText}`);
                }
            } catch (error) {
                console.error(`Erro na requisição para ${type} ID ${id}:`, error);
                if (preferredType) return null; // Se um tipo preferido foi dado e falhou, não tentar outros
            }
        }

        if (contentData && contentType) {
            return { content: contentData, credits: creditsData, type: contentType };
        }
        return null;
    }

    /**
     * Popula os detalhes do conteúdo na página HTML.
     * @param {object} data Objeto contendo content, credits e type.
     */
    async function populateContentDetails(data) {
        if (!data || !data.content) {
            console.error('Dados do conteúdo inválidos para preenchimento.');
            return;
        }

        const content = data.content;
        const credits = data.credits;
        const contentType = data.type;

        document.title = `${content.title || content.name} - Detalhes`;

        // --- Banner Image ---
        if (elements.bannerImg) {
            if (content.backdrop_path) {
                elements.bannerImg.src = `${BASE_BACKDROP_URL}${content.backdrop_path}`;
                elements.bannerImg.alt = `Cena de fundo de ${content.title || content.name}`;
            } else if (content.poster_path) {
                elements.bannerImg.src = `${BASE_IMAGE_URL}${content.poster_path}`;
                elements.bannerImg.alt = `Pôster de ${content.title || content.name}`;
            } else {
                elements.bannerImg.src = PLACEHOLDER_IMAGE_URL;
                elements.bannerImg.alt = 'Imagem de banner não disponível';
            }
        }

        // --- Banner Title & Description ---
        if (elements.bannerTitle) {
            elements.bannerTitle.textContent = content.title || content.name || 'Título Indisponível';
        }

        if (elements.bannerDescription) {
            let infoItems = [];
            if (content.genres && content.genres.length > 0) {
                const genreNames = content.genres.map(genre => genre.name);
                infoItems.push(genreNames.join(' • '));
            }
            if (content.vote_average) {
                const formattedRating = (content.vote_average / 2).toFixed(1);
                infoItems.push(`${formattedRating} ★`);
            }
            elements.bannerDescription.textContent = infoItems.join(' • ') || 'Informações não disponíveis.';
        }

        // --- Main Description ---
        if (elements.mainDescription) {
            elements.mainDescription.textContent = content.overview || 'Descrição não disponível.';
        }

        // --- Cast ---
        if (elements.castContainer && credits && credits.cast) {
            elements.castContainer.innerHTML = '';
            const topCast = credits.cast.slice(0, 10); // Limita ao top 10

            topCast.forEach(person => {
                const profilePath = person.profile_path ? `${BASE_IMAGE_URL}${person.profile_path}` : PLACEHOLDER_IMAGE_URL;
                const castMemberArticle = document.createElement('article');
                castMemberArticle.classList.add('cast-member');
                castMemberArticle.innerHTML = `
                    <img src="${profilePath}" alt="Foto de ${person.name}">
                    <p class="cast-name">${person.name}</p>
                    <p class="cast-role">${person.character}</p>
                `;
                elements.castContainer.appendChild(castMemberArticle);
            });
        }

        // --- Released Year ---
        if (elements.releasedYearElement) {
            const date = contentType === 'movie' ? content.release_date : content.first_air_date;
            elements.releasedYearElement.textContent = date ? new Date(date).getFullYear() : 'N/A';
        }

        // --- Genres ---
        if (elements.genresContainer && content.genres) {
            elements.genresContainer.innerHTML = '';
            content.genres.forEach(genre => {
                const button = document.createElement('button');
                button.textContent = genre.name;
                elements.genresContainer.appendChild(button);
            });
        }

        // --- Languages ---
        if (elements.languagesContainer && content.spoken_languages) {
            elements.languagesContainer.innerHTML = '';
            content.spoken_languages.forEach(lang => {
                const button = document.createElement('button');
                button.textContent = lang.english_name || lang.name;
                elements.languagesContainer.appendChild(button);
            });
        }

        // --- Director/Creator ---
        if (elements.directorSection) {
            const personCardImg = elements.directorSection.querySelector('.person-card img');
            const personCardName = elements.directorSection.querySelector('.person-card .name');
            const personCardSub = elements.directorSection.querySelector('.person-card .sub');
            const directorTitle = elements.directorSection.querySelector('h3');

            let mainPerson = null;
            let role = '';

            if (contentType === 'movie' && credits && credits.crew) {
                mainPerson = credits.crew.find(member => member.job === 'Director');
                role = 'Diretor';
            } else if (contentType === 'tv' && content.created_by && content.created_by.length > 0) {
                // Para séries, usa o primeiro criador
                mainPerson = content.created_by[0];
                role = 'Criador(es)';
            }

            if (mainPerson) {
                const profilePath = mainPerson.profile_path ? `${BASE_IMAGE_URL}${mainPerson.profile_path}` : PLACEHOLDER_IMAGE_URL;
                if (directorTitle) directorTitle.textContent = role;
                if (personCardImg) {
                    personCardImg.src = profilePath;
                    personCardImg.alt = `Foto de ${mainPerson.name}`;
                }
                if (personCardName) personCardName.textContent = mainPerson.name;
                if (personCardSub) personCardSub.textContent = role;
                elements.directorSection.style.display = 'flex';
            } else {
                elements.directorSection.style.display = 'none';
            }
        }

        // --- Music Composer ---
        if (elements.musicSection && credits && credits.crew) {
            const musicComposer = credits.crew.find(member => member.job === 'Original Music Composer' || member.job === 'Composer');
            const personCardImg = elements.musicSection.querySelector('.person-card img');
            const personCardName = elements.musicSection.querySelector('.person-card .name');
            const personCardSub = elements.musicSection.querySelector('.person-card .sub');

            if (musicComposer) {
                const profilePath = musicComposer.profile_path ? `${BASE_IMAGE_URL}${musicComposer.profile_path}` : PLACEHOLDER_IMAGE_URL;
                if (personCardImg) {
                    personCardImg.src = profilePath;
                    personCardImg.alt = `Foto de ${musicComposer.name}`;
                }
                if (personCardName) personCardName.textContent = musicComposer.name;
                if (personCardSub) personCardSub.textContent = 'Compositor';
                elements.musicSection.style.display = 'flex';
            } else {
                elements.musicSection.style.display = 'none';
            }
        }

        // --- IMDb Rating ---
        if (elements.imdbRatingBox && content.vote_average) {
            const ratingOutOf5 = content.vote_average / 2;
            const imdbPct = (ratingOutOf5 / 5) * 100;
            const imdbRatingValue = ratingOutOf5.toFixed(1);

            elements.imdbRatingBox.querySelector('.star-rating').style.setProperty('--pct', `${imdbPct}%`);
            elements.imdbRatingBox.querySelector('.rating-value').textContent = imdbRatingValue;
            elements.imdbRatingBox.closest('section').style.display = 'block';
        } else if (elements.imdbRatingBox) {
            elements.imdbRatingBox.closest('section').style.display = 'none';
        }

        // --- Watch Providers (Here to Watch) ---
        if (elements.providersContainer && elements.watchSection && content.id && contentType) {
            const providers = await fetchWatchProviders(content.id, contentType);
            if (providers && providers.flatrate && providers.flatrate.length > 0) {
                elements.providersContainer.innerHTML = '';

                // Filtra os provedores que possuem uma URL mapeada em STREAMING_PROVIDER_URLS (usando o nome)
                const availableProviders = providers.flatrate.filter(provider => STREAMING_PROVIDER_URLS[provider.provider_name]);

                if (availableProviders.length > 0) {
                    availableProviders.forEach(provider => {
                        const providerLink = document.createElement('a');
                        providerLink.classList.add('provider-link-tag');
                        providerLink.textContent = provider.provider_name;

                        // Usa o nome do provedor para buscar a URL
                        const baseUrl = STREAMING_PROVIDER_URLS[provider.provider_name];
                        
                        if (baseUrl) { // Verifica novamente se a URL foi encontrada
                            providerLink.href = baseUrl;
                            providerLink.target = '_blank';
                            providerLink.rel = 'noopener noreferrer';
                            elements.providersContainer.appendChild(providerLink);
                        }
                    });
                    elements.watchSection.style.display = 'flex';
                } else {
                    elements.watchSection.style.display = 'none'; // Oculta se não houver provedores mapeados
                }
            } else {
                elements.watchSection.style.display = 'none'; // Oculta se não houver provedores na API
            }
        }

        // --- Play Now Button (Trailer) ---
        if (elements.playNowButton && content.id && contentType) {
            const trailerUrl = await fetchTrailerUrl(content.id, contentType);
            if (trailerUrl) {
                elements.playNowButton.addEventListener('click', () => {
                    window.open(trailerUrl, '_blank');
                });
                elements.playNowButton.style.display = 'flex';
            } else {
                elements.playNowButton.style.display = 'none';
                console.warn('Nenhum trailer encontrado para este conteúdo.');
            }
        }
    }

    // --- Lógica Principal de Inicialização ---
    const { id, type } = getContentIdAndTypeFromUrl();

    if (id) {
        fetchContentDetails(id, type)
            .then(data => {
                if (data) {
                    populateContentDetails(data);
                    if (elements.containerDetails) {
                        elements.containerDetails.style.display = 'flex';
                    }
                } else {
                    // Exibir mensagem de erro ou ocultar se não encontrar conteúdo
                    if (elements.mainContent) {
                        elements.mainContent.innerHTML = '<p class="error-message">Filme/Série não encontrado. Verifique o ID ou tipo.</p>';
                    }
                    if (elements.bannerSection) {
                        elements.bannerSection.style.display = 'none';
                    }
                    if (elements.matchCta) {
                        elements.matchCta.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error("Erro fatal ao carregar os detalhes:", error);
                if (elements.mainContent) {
                    elements.mainContent.innerHTML = '<p class="error-message">Ocorreu um erro ao carregar os detalhes. Tente novamente mais tarde.</p>';
                }
                if (elements.bannerSection) {
                    elements.bannerSection.style.display = 'none';
                }
                if (elements.matchCta) {
                    elements.matchCta.style.display = 'none';
                }
            });
    } else {
        // Exibir mensagem se não houver ID na URL
        if (elements.mainContent) {
            elements.mainContent.innerHTML = '<p class="error-message">Nenhum ID de filme/série fornecido. Por favor, selecione um filme/série da página inicial.</p>';
        }
        if (elements.bannerSection) {
            elements.bannerSection.style.display = 'none';
        }
        if (elements.matchCta) {
            elements.matchCta.style.display = 'none';
        }
    }
});
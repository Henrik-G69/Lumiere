const api_key = '98f79a8fc16247f2c16e9d0b422dbfbe';
const img_url = 'https://image.tmdb.org/t/p/w500'
const top10list = document.getElementById('carouselFilms');
const movieCardTemplate = document.getElementById('movieCard');

const CACHE_KEY_POPULAR_MOVIES = 'popularMoviesCache';
const CACHE_DURATION_MS = 3600000;

function formatRuntime(minutes) {
    if (minutes === null || minutes === undefined || minutes <= 0) {
        return 'N/A';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        if (remainingMinutes === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h${remainingMinutes}`;
        }
    } else {
        return `${remainingMinutes}`;
    }
}

async function getTop10(){
    if (top10list) {
        top10list.innerHTML = 'Carregando filmes...';
    } else {
        console.error("Elemento com ID 'carouselFilms' não encontrado no DOM.");
        return;
    }

    try{
        let top10movies;
        let isCacheValid = false;

        const savedCache = localStorage.getItem(CACHE_KEY_POPULAR_MOVIES);
        if (savedCache){
            const {data, timestamp} = JSON.parse(savedCache);
            const now = Date.now();
            if (now - timestamp < CACHE_DURATION_MS){
                top10movies = data;
                isCacheValid = true;
                console.log('Filmes carregados do cache.');
            } else {
                console.log('Cache expirado. Buscando novos filmes.');
            }
        }

        if (!isCacheValid){
            console.log('Fazendo requisição à API de filmes populares...');
            const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${api_key}&language=en-US&page=1`);

            if(!response.ok){
                throw new Error (`Erro HTTP! Status: ${response.status}`);
            }

            const apiData = await response.json();
            top10movies = apiData.results;

            const cacheEntry = {
                data: top10movies,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY_POPULAR_MOVIES, JSON.stringify(cacheEntry));
            console.log('Novos filmes salvos no cache.');
        }

        top10list.innerHTML = '';

        if (top10movies && top10movies.length > 0){
            if (!movieCardTemplate) {
                console.error("Template de card de filme com ID 'movieCard' não encontrado no DOM.");
                top10list.innerHTML = '<p style="color: red;">Erro: Template de filme não encontrado.</p>';
                return;
            }

            for (let i = 0; i < Math.min(5, top10movies.length); i++){
                const currentMovie = top10movies[i];

                let runtime = 'N/A';
                try {
                    console.log(`Buscando detalhes para o filme: ${currentMovie.title} (ID: ${currentMovie.id})`);
                    const movieDetailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${currentMovie.id}?api_key=${api_key}&language=en-US`);

                    if (!movieDetailsResponse.ok) {
                        console.warn(`Aviso: Erro ao buscar detalhes para o filme ID ${currentMovie.id}. Status: ${movieDetailsResponse.status}`);
                    } else {
                        const movieDetails = await movieDetailsResponse.json();
                        if (movieDetails.runtime) {
                            runtime = formatRuntime(movieDetails.runtime);
                        }
                    }
                } catch (detailsError) {
                    console.error(`Erro ao buscar detalhes para o filme ID ${currentMovie.id}:`, detailsError);
                }

                const movieCard = movieCardTemplate.cloneNode(true);
                movieCard.style.display = 'block';
                movieCard.removeAttribute('id');

                const animationDelay = i * 0.1;
                movieCard.style.animationDelay = `${animationDelay}s`;
                movieCard.classList.add('film-on-list--animated');

                const posterImg = movieCard.querySelector('.film-on-list img');

                if (posterImg && currentMovie.poster_path){
                    posterImg.src = `${img_url}${currentMovie.poster_path}`;
                    posterImg.alt = `Pôster do filme ${currentMovie.title}`;
                }
                const durationElement = movieCard.querySelector('.duration-value');
                if (durationElement) {
                    durationElement.textContent = runtime;
                } 

               const rating = currentMovie.vote_average; 

                const displayRating = rating !== null && rating !== undefined
                                      ? (rating / 2).toFixed(1) 
                                      : 'N/A';

                const ratingListValueElement = movieCard.querySelector('.rating-list-value');
                if (ratingListValueElement) {
                    ratingListValueElement.textContent = displayRating; 
                } 
                const starRatingDiv = movieCard.querySelector('.star-rating');
                if (starRatingDiv && rating !== null && rating !== undefined) {
                    const percentage = (rating / 10) * 100;
                    starRatingDiv.style.setProperty('--pct', `${percentage}%`);
                } else if (starRatingDiv) {
                    starRatingDiv.style.setProperty('--pct', `0%`);
                }

                top10list.appendChild(movieCard);
            }
        } else {
            top10list.innerHTML = '<p>Nenhum filme popular encontrado.</p>';
        }

        return top10movies;

    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        if (top10list) {
            top10list.innerHTML = `<p style="color: red;">Ocorreu um erro ao carregar os filmes: ${error.message}</p>`;
        }
        return [];
    }
};

getTop10();
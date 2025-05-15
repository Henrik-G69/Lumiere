document.getElementById("AddPlaylist").addEventListener('click', () => {
    document.getElementById("CreatePlaylist").style.display = 'flex';
});

document.getElementById("Cancelar").addEventListener('click', () => {
    document.getElementById("CreatePlaylist").style.display = 'none';
});

document.querySelector('#Criar').addEventListener('click', () => {
    const nomeplaylist = document.querySelector('.namePlaylist').value;
    let playlists = JSON.parse(localStorage.getItem('playlist')) || [];
    playlists.push(nomeplaylist);

    localStorage.setItem('playlist', JSON.stringify(playlists));
    document.getElementById("CreatePlaylist").style.display = 'none';

    listarPlaylist();
});
document.querySelector('.containerPlaylist').addEventListener('click', (event) => {
    const el = event.target.closest('.playlists');
    if (el) {
        const filmes = document.querySelector('.filmes');
        console.log('Playlist clicada!');
        filmes.style.display = 'flex'; 
        carregarFilmes()
    }
});



const listarPlaylist = () => {
    let playlists = JSON.parse(localStorage.getItem('playlist')) || [];
    const container = document.querySelector(".containerPlaylist");

    // Limpar as playlists antigas ao renderizar as novas
    container.innerHTML = '';

    for (const play of playlists) {
        const divPlaylist = document.createElement("div");
        divPlaylist.classList.add("playlists");

        const img = document.createElement("img");
        img.src = "./../img/playlist.jpg";
        img.alt = "";

        const innerDiv = document.createElement("div");
        const h1 = document.createElement("h1");
        h1.textContent = play;

        innerDiv.appendChild(h1);
        divPlaylist.appendChild(img);
        divPlaylist.appendChild(innerDiv);

        // Inserir dentro do containerPlaylist
        container.appendChild(divPlaylist);
    }
}
const carregarFilmes = async () => {
    try {
        const resposta = await fetch('https://moviesapi.ir/api/v1/movies?page=1');
        const dados = await resposta.json();

        const container = document.querySelector('.containerPlaylist2');
        container.innerHTML = ''; // limpa qualquer conteúdo existente

        dados.data.forEach(filme => {
            // Criar o container principal
            const divContent = document.createElement('div');
            divContent.classList.add('contentPlaylist2');

            // Imagem do pôster
            const img = document.createElement('img');
            img.src = filme.poster;
            img.alt = filme.title;

            // Container info
            const divInfo = document.createElement('div');
            divInfo.classList.add('info');

            // Título + avaliação
            const divTitle = document.createElement('div');
            divTitle.classList.add('titleContainer');

            const h1 = document.createElement('h1');
            h1.textContent = filme.title;

            const rating = document.createElement('p');
            rating.classList.add('rating');
            rating.textContent = `Avaliações: ${filme.imdb_rating}`;

            divTitle.appendChild(h1);
            divTitle.appendChild(rating);

            // País
            const divCountry = document.createElement('div');
            divCountry.classList.add('country');
            const pCountry = document.createElement('p');
            pCountry.textContent = filme.country;
            divCountry.appendChild(pCountry);

            // Gêneros
            const divGenres = document.createElement('div');
            divGenres.classList.add('genres');
            filme.genres.forEach(genero => {
                const pGenero = document.createElement('p');
                pGenero.textContent = genero;
                divGenres.appendChild(pGenero);
            });

            // Montar info
            divInfo.appendChild(divTitle);
            divInfo.appendChild(divCountry);
            divInfo.appendChild(divGenres);

            // Adicionar tudo ao container
            divContent.appendChild(img);
            divContent.appendChild(divInfo);
            container.appendChild(divContent);
        });

    } catch (erro) {
        console.error('Erro ao carregar os filmes:', erro);
    }
};

window.addEventListener('load', listarPlaylist);

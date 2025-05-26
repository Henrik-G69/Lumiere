let nextButton = document.getElementById('movie-hero__next-button');
let prevButton = document.getElementById('movie-hero__prev-button');
let carousel = document.querySelector('.movie-hero');
let listHTML = document.querySelector('.movie-hero .films-list');


/* Configura os botões de next e prev */
nextButton.onclick = () => showSlider('next');
prevButton.onclick = () => showSlider('prev');


const showSlider = (type) => {
    nextButton.disabled = true;
    prevButton.disabled = true;

    const items = document.querySelectorAll('.movie-hero .films-list .movie-hero-film');
    if (type === 'next') {
        carousel.classList.remove('prev')
        listHTML.appendChild(items[0]);
        carousel.classList.add('next');
        console.log(items)
    } else {
        carousel.classList.remove('next')
        const lastItem = items[items.length - 1];
        listHTML.prepend(lastItem);
        carousel.classList.add('prev');
        console.log(items)
    }

    setTimeout(() => {
        nextButton.disabled = false;
        prevButton.disabled = false;
    }, 300);
};
setInterval(() => {
    showSlider('next');
}, 5000); 

/* Botões para detalhes */
seeMoreButtons.forEach((button) =>
    button.addEventListener('click', () => carousel.classList.add('showDetail'))
);
backButton.addEventListener('click', () => carousel.classList.remove('showDetail'));


//  perfil.js: Dados do usuário logado
document.addEventListener('DOMContentLoaded', function () {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function () {
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const tab = this.getAttribute('data-tab');
            document.getElementById(tab).classList.add('active');
        });
    });

    document.getElementById('profile-form').addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Perfil salvo com sucesso!');
    });
});
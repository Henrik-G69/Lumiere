document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const toggleBtn = document.querySelector('.toggle-password');
    const iconImg = document.querySelector('.toggle-password__icon');
    const loginErrorMessage = document.getElementById('loginErrorMessage'); 

    if (toggleBtn && passwordInput && iconImg) {
        toggleBtn.addEventListener('click', () => {
            const show = passwordInput.type === 'password';
            passwordInput.type = show ? 'text' : 'password';
            iconImg.src = show
                ? '../public/icons/EyeFill.svg' 
                : '../public/icons/EyeSlashFill.svg'; 
            toggleBtn.setAttribute('aria-label', show ? 'Esconder senha' : 'Ver senha');
        });
    }

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        //se baseia na mesma forma da tela de cadastro, limpando erros anteriores
        emailError.textContent = '';
        passwordError.textContent = '';
        loginErrorMessage.textContent = ''; 

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        let isValid = true;
        if (email === '') {
            emailError.textContent = 'Por favor, insira seu email.';
            isValid = false;
        }
        if (password === '') {
            passwordError.textContent = 'Por favor, insira sua senha.';
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        const storedUsersJSON = localStorage.getItem('users');
        let users = [];

        if (storedUsersJSON) {
            users = JSON.parse(storedUsersJSON);

        }
        // procura o email e a senha no banco
        const foundUser = users.find(user => user.email === email && user.password === password);

        if (foundUser) {
            //se o usuario foi achado, armazena seu email e seu login
            localStorage.setItem('loggedInUserEmail', foundUser.email);
            localStorage.setItem('loggedInUserNickname', foundUser.nickname);
            localStorage.setItem('loggedInUserAvatar', foundUser.avatar || '../icons/PersonCircle.svg');
            window.location.href = '../index.html'; // Redireciona para a página inicial
        }  else {
            loginErrorMessage.textContent = 'Email ou senha inválidos. Por favor, tente novamente.';
        }
    });

});
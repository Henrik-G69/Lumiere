document.addEventListener('DOMContentLoaded', function() {
    //obtenção dos campos html gerais
    const signupForm = document.getElementById('signupForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const nicknameInput = document.getElementById('nickname');
    const emailInput = document.getElementById('email');
    const birthDaySelect = document.getElementById('birthDay');
    const birthMonthSelect = document.getElementById('birthMonth');
    const birthYearSelect = document.getElementById('birthYear');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const successMessage = document.getElementById('successMessage');
    const termsCheckbox = document.getElementById('terms');

    //obtenção dos campos html para a prevenção de erros
    const firstNameError = document.getElementById('firstNameError');
    const lastNameError = document.getElementById('lastNameError');
    const nicknameError = document.getElementById('nicknameError');
    const emailError = document.getElementById('emailError');
    const birthDateError = document.getElementById('birthDateError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const termsError = document.getElementById('termsError');

    //limpa as mensgens de erros anteriores
    function clearErrors() {
    firstNameError.textContent = '';
    lastNameError.textContent = '';     
    nicknameError.textContent = '';
    emailError.textContent = '';
    birthDateError.textContent = '';
    passwordError.textContent = '';
    confirmPasswordError.textContent = '';
    termsError.textContent = '';
    successMessage.textContent = '';
    }


    //icones dos olhos nos campos de senhas
    function setupPasswordToggle(inputId, toggleButtonClass, iconClass) {
        const input = document.getElementById(inputId);
        const toggleBtn = input.parentElement.querySelector(toggleButtonClass); // pega o botão dentro do mesmo wrapper
        const iconImg = toggleBtn ? toggleBtn.querySelector(iconClass) : null;

        if (input && toggleBtn && iconImg) {
            toggleBtn.addEventListener('click', () => {
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                iconImg.src = show
                    ? '../public/icons/EyeFill.svg' // caminho para o ícone de olho aberto
                    : '../public/icons/EyeSlashFill.svg'; // caminho para o ícone de olho fechado
                toggleBtn.setAttribute('aria-label', show ? 'Esconder senha' : 'Ver senha');
            });
        }
    }

    // Chama a função de setup para ambos os campos de senha
    setupPasswordToggle('password', '.toggle-password', '.toggle-password__icon');
    setupPasswordToggle('confirmPassword', '.toggle-password', '.toggle-password__icon');


    //função que válida os campos input do formulário de acordo com alguns requisitos.
    /*clearErrors() é chamado logo ao início para limpar os erros anteriormente registrados
    na página*/
    function validateForm() {
        clearErrors(); 
        let isValid = true; /* valor booleano guardado ao início da função para ser posteriormente
        definido conforme necessário, seja desvalidando o formulário ou o validando.*/

        // primeiro nome (obrigatório e mínimo de caracteres)
        if (firstNameInput.value.trim() === '') {
            firstNameError.textContent = 'Por favor, insira seu primeiro nome.';
            isValid = false;
        } else if (firstNameInput.value.trim().length <= 2) {
            firstNameError.textContent = 'Seu nome deve ter mais do que duas letras'
            isValid = false;
        }

        if (lastNameInput.value.trim() === '') {
            lastNameError.textContent = 'Por favor, insira seu primeiro nome.';
            isValid = false;
        } else if (lastNameInput.value.trim().length <= 2) {
            lastNameError.textContent = 'Seu nome deve ter mais do que duas letras'
            isValid = false;
        }

        // apelido (obrigatório e mínimo de caracteres)
        if (nicknameInput.value.trim() === '') {
            nicknameError.textContent = 'Por favor, insira seu apelido.';
            isValid = false;
        } else if (nicknameInput.value.trim().length <= 2){
            nicknameError.textContent == 'Seu apelido deve ter mais do que duas letras'
            isValid = false;
        }

        // email (obrigatório, requisição de caracteres ('@' e '.') e mínimo de caracteres)
        /* definimos uma variável especificamente para o valor de email pois a utilizaremos
        novamente algumas mais vezes no futuro*/

        const emailValue = emailInput.value.trim();
        if (emailValue === '') {
            emailError.textContent = 'Por favor, insira seu email.';
            isValid = false;
        } else if (!emailValue.includes('@') || !emailValue.includes('.')) {
            emailError.textContent = 'Por favor, insira um email válido.';
            isValid = false;
        } else if (emailValue.length <= 5){
            emailError.textContent = 'Por favor, insira um email válido'
            isValid = false
        }

        // data de nascimento (obrigatório)
        if (birthDaySelect.value === '' || birthMonthSelect.value === '' || birthYearSelect.value === '') {
            birthDateError.textContent = 'Por favor, selecione sua data de nascimento completa.';
            isValid = false;
        }

        // senha (obrigatório e mínimo de caracteres)
        /*armazenamos a variável passwordValue pois a utilizaremos no futuro em outras 
        verificações*/
        const passwordValue = passwordInput.value.trim();
        if (passwordValue === '') {
            passwordError.textContent = 'Por favor, insira uma senha.';
            isValid = false;
        } else if (passwordValue.length < 6) { // Exemplo: senha mínima de 6 caracteres
            passwordError.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            isValid = false;
        }

        // confirmação de senha (obrigatório e deve coincidir com o campo anterior)
        /* armazenamos a variável confirmPasswordValue pois a utilizaremos no futuro em outra
        verificação */
        const confirmPasswordValue = confirmPasswordInput.value.trim();
        if (confirmPasswordValue === '') {
            confirmPasswordError.textContent = 'Por favor, confirme sua senha.';
            isValid = false;
        } else if (passwordValue !== confirmPasswordValue) {
            confirmPasswordError.textContent = 'As senhas não coincidem.';
            isValid = false;
        }

        // campo de termos e condições (obrigatório)
        if (!termsCheckbox.checked) {
            termsError.textContent = 'Você deve concordar com os Termos de Serviço e Política de Privacidade.';
            isValid = false;
        }

        // se todas as validações se saírem como corretas, o valor de isValid permanece como True. 
        return isValid;
    }


    // listener pro botão de registro, este também salva as informações no localStorage
        signupForm.addEventListener('submit', function(event) {
        event.preventDefault();

        //valida o formulário, parando a execução em caso de erro
        if (!validateForm()) {
            return;
        }    

        const userData = {      
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            nickname: nicknameInput.value.trim(),
            email: emailInput.value.trim(),
            birthDay: birthDaySelect.value,
            birthMonth: birthMonthSelect.value,
            birthYear: birthYearSelect.value,
            password: passwordInput.value, //evita trim para permitir senhas com espaços
            gender: document.querySelector('input[name="gender"]:checked') ? document.querySelector('input[name="gender"]:checked').value : '',
            termsAccepted: termsCheckbox.checked
        };

        //registro de múltiplos usuários
        //recupera a lista já existente no localStorage, certificando-se de cria-lá 

        const storedUsersJSON = localStorage.getItem('users');
        let users = [];

        // transforma o json em um array javascript
        if (storedUsersJSON) {
            users = JSON.parse(storedUsersJSON);
        }

        // verifica se o email já existe em localStorage
        const emailExists = users.some(user => user.email === userData.email);
        if (emailExists) {
            emailError.textContent = 'Já existe uma conta associada a este email.';
            return; // impede caso já exista
        }

        // adiciona o novo usuário à lista
        users.push(userData);

        // salva a lista atualizada (com o novo usuário) de volta no localStorage
        localStorage.setItem('users', JSON.stringify(users));

        // manda o usuário para a página de login
        setTimeout(() => {
            window.location.href = './login.html'; // Redireciona após 2 segundos
        }, 2000);
    });

    function populateDateSelects() {
        //dias de 1 a 31
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            birthDaySelect.appendChild(option); 
        }

        //deixa dia como primeira opção
        birthDaySelect.insertBefore(new Option('Dia', '', true, true), birthDaySelect.firstChild);
        birthDaySelect.selectedIndex = 0; 


        //seletor de meses
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]; // "Julho" duplicado removido
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            birthMonthSelect.appendChild(option);
        });
        //deixa mês como primeira opção
        birthMonthSelect.insertBefore(new Option('Mês', '', true, true), birthMonthSelect.firstChild);
        birthMonthSelect.selectedIndex = 0; 


        // seletor de anos
        const currentYear = new Date().getFullYear(); 
        const startYear = currentYear - 100; // define o ano de início para 100 anos atrás
        for (let i = currentYear - 10; i >= startYear; i--) { //puxa uma lista de 10 anos atras até 100 anos atras
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            birthYearSelect.appendChild(option); 
        }
        // deixa 'Ano' como primeira opção
        birthYearSelect.insertBefore(new Option('Ano', '', true, true), birthYearSelect.firstChild);
        birthYearSelect.selectedIndex = 0; // Selecionar "Ano" por padrão
    }

    //chama a função para preencher quando os dados estiverem carregados
    // dados === 'DomContentLoad' posto como requisito na função principal de Listener da página
    populateDateSelects();
});

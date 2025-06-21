// local storage key para todos os usuários
const LOCAL_STORAGE_USERS_KEY = 'users'; // chave 'users' para o array de usuários
const LOCAL_STORAGE_LOGGED_IN_USER_EMAIL_KEY = 'loggedInUserEmail';
const LOCAL_STORAGE_LOGGED_IN_USER_NICKNAME_KEY = 'loggedInUserNickname';

// funções de utilidade do local storage para usuários
function getAllUsersFromLocalStorage() {
    const data = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAllUsersToLocalStorage(usersArray) {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersArray));
}

function getLoggedInUserEmail() {
    return localStorage.getItem(LOCAL_STORAGE_LOGGED_IN_USER_EMAIL_KEY);
}

function setLoggedInUserEmail(email) {
    localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_USER_EMAIL_KEY, email);
}

function removeLoggedInUserEmail() {
    localStorage.removeItem(LOCAL_STORAGE_LOGGED_IN_USER_EMAIL_KEY);
    localStorage.removeItem(LOCAL_STORAGE_LOGGED_IN_USER_NICKNAME_KEY);
}


// referências do dom
const profileForm = document.getElementById('profile-form');
const profileNameDisplay = document.getElementById('profile-name-display'); // nome na sidebar

// campos do formulário de perfil
const profileEmailInput = document.getElementById('profile-email');
const profileNameInput = document.getElementById('profile-name'); // nickname
const profileNascimentoInput = document.getElementById('profile-nascimento');

// campos de alteração de senha
const profileSenhaAtualInput = document.getElementById('profile-senha-atual');
const profileNovaSenhaInput = document.getElementById('profile-nova-senha');
const profileRepetirSenhaInput = document.getElementById('profile-repetir-senha');

// spans para mensagens de erro
const errorNickname = document.getElementById('error-nickname');
const errorNascimento = document.getElementById('error-nascimento');
const errorSenhaAtual = document.getElementById('error-senha-atual');
const errorNovaSenha = document.getElementById('error-nova-senha');
const errorRepetirSenha = document.getElementById('error-repetir-senha');
const profileSuccessMessage = document.getElementById('profile-success-message');

// botões de ação
const saveProfileBtn = document.getElementById('save-profile-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const logoutBtn = document.getElementById('logout-btn');


// funções de mensagens de erro e sucesso
function displayError(element, message) {
    if (element) {
        element.textContent = message;
    }
}

function clearErrors() {
    errorNickname.textContent = '';
    errorNascimento.textContent = '';
    errorSenhaAtual.textContent = '';
    errorNovaSenha.textContent = '';
    errorRepetirSenha.textContent = '';
    profileSuccessMessage.textContent = ''; // limpa a mensagem de sucesso também
}

function displaySuccessMessage(message) {
    if (profileSuccessMessage) {
        profileSuccessMessage.textContent = message;
        setTimeout(() => {
            profileSuccessMessage.textContent = '';
        }, 5000); // mensagem some após 5 segundos
    }
}


// funções principais de perfil

// redireciona para a página de login se não houver usuário logado
function redirectToLoginIfNotLoggedIn() {
    if (!getLoggedInUserEmail()) {
        window.location.href = '/login.html';
    }
}

// carrega os dados do perfil do usuário logado no formulário
function loadUserProfile() {
    redirectToLoginIfNotLoggedIn();

    const loggedInUserEmail = getLoggedInUserEmail();
    const allUsers = getAllUsersFromLocalStorage();
    
    const currentUser = allUsers.find(user => user.email === loggedInUserEmail);

    if (currentUser) {
        profileEmailInput.value = currentUser.email || '';
        profileNameInput.value = currentUser.nickname || '';
        profileNascimentoInput.value = currentUser.nascimento || ''; // puxando a data de nascimento

        profileNameDisplay.textContent = currentUser.nickname || 'Perfil';
    } else {
        removeLoggedInUserEmail();
        window.location.href = 'login.html';
    }
}

// salva as alterações do perfil no local storage
function saveUserProfile(event) {
    event.preventDefault();
    clearErrors(); // limpa quaisquer erros anteriores

    const loggedInUserEmail = getLoggedInUserEmail();
    let allUsers = getAllUsersFromLocalStorage();
    
    const userIndex = allUsers.findIndex(user => user.email === loggedInUserEmail);

    if (userIndex === -1) {
        removeLoggedInUserEmail();
        window.location.href = 'login.html';
        return;
    }

    let currentUser = allUsers[userIndex];
    let formIsValid = true;
    let passwordChanged = false;

    // validação de campos obrigatórios (nickname e data de nascimento)

    // validação do nickname (nome de usuário)
    if (profileNameInput.value.trim() === '') {
        displayError(errorNickname, 'O nome de usuário não pode estar vazio.');
        formIsValid = false;
    }

    // validação da data de nascimento
    if (profileNascimentoInput.value.trim() === '') {
        displayError(errorNascimento, 'Por favor, insira sua data de nascimento.');
        formIsValid = false;
    } else {
        const dataNascimento = new Date(profileNascimentoInput.value);
        if (isNaN(dataNascimento.getTime())) { // verifica se é uma data inválida
            displayError(errorNascimento, 'Data de nascimento inválida.');
            formIsValid = false;
        } else {
            //usuario deve ter pelo menos 13 anos
            const hoje = new Date();
            let idade = hoje.getFullYear() - dataNascimento.getFullYear();
            const mes = hoje.getMonth() - dataNascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
                idade--;
            }
            if (idade < 13) {
                displayError(errorNascimento, 'Você deve ter pelo menos 13 anos.');
                formIsValid = false;
            }
        }
    }


    // lógica de alteração de senha: agora sempre valida os campos
    const currentPasswordAttempt = profileSenhaAtualInput.value;
    const newPassword = profileNovaSenhaInput.value;
    const repeatNewPassword = profileRepetirSenhaInput.value;

    // validação da senha atual
    if (currentPasswordAttempt.trim() === '') {
        displayError(errorSenhaAtual, 'A senha atual não pode ser vazia.');
        formIsValid = false;
    } else if (currentUser.password !== currentPasswordAttempt) {
        displayError(errorSenhaAtual, 'Senha atual incorreta.');
        formIsValid = false;
    }

    // validação da nova senha
    if (newPassword.trim() === '') {
        displayError(errorNovaSenha, 'A nova senha não pode ser vazia.');
        formIsValid = false;
    } else if (newPassword.length < 6) {
        displayError(errorNovaSenha, 'A nova senha deve ter pelo menos 6 caracteres.');
        formIsValid = false;
    }

    // validação da repetição da nova senha
    if (repeatNewPassword.trim() === '') {
        displayError(errorRepetirSenha, 'A repetição da nova senha não pode ser vazia.');
        formIsValid = false;
    } else if (newPassword !== repeatNewPassword) {
        displayError(errorRepetirSenha, 'As novas senhas não coincidem.');
        formIsValid = false;
    }
    
    // se todas as validações de senha passaram (e formIsValid ainda é true neste ponto),
    // então a senha pode ser atualizada
    if (formIsValid && newPassword.length >= 6 && newPassword === repeatNewPassword) {
        currentUser.password = newPassword;
        passwordChanged = true;
    }

    // se houver algum erro, interrompe a função aqui
    if (!formIsValid) {
        return; // interrompe a função se houver qualquer erro de validação
    }

    // se não há erros, prossegue com o salvamento e exibe a mensagem de sucesso
    currentUser.nickname = profileNameInput.value.trim();
    currentUser.nascimento = profileNascimentoInput.value;

    saveAllUsersToLocalStorage(allUsers); // salva o array completo de volta no local storage

    // atualiza o nickname no local storage para consistência (ex: header)
    localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_USER_NICKNAME_KEY, currentUser.nickname);

    displaySuccessMessage('Perfil salvo com sucesso!' + (passwordChanged ? ' Senha alterada.' : ''));
    
    // limpa campos de senha após salvar (mesmo que a senha não tenha sido alterada, para segurança)
    profileSenhaAtualInput.value = '';
    profileNovaSenhaInput.value = '';
    profileRepetirSenhaInput.value = '';
    
    loadUserProfile(); // recarrega para atualizar o nome na sidebar, etc.
}

// exclui a conta do usuário logado
function deleteAccount() {
    if (confirm('ATENÇÃO: Tem certeza que deseja EXCLUIR sua conta? Esta ação é irreversível.')) {
        const loggedInUserEmail = getLoggedInUserEmail();
        let allUsers = getAllUsersFromLocalStorage();

        allUsers = allUsers.filter(user => user.email !== loggedInUserEmail);
        
        saveAllUsersToLocalStorage(allUsers);
        removeLoggedInUserEmail(); // remove todos os dados de login do local storage
        window.location.href = 'cadastro.html'; // ou 'login.html'
    }
}

// desloga o usuário
function logout() {
    if (confirm('Tem certeza que deseja sair da sua conta?')) {
        removeLoggedInUserEmail();
        window.location.href = 'login.html';
    }
}

// event listeners
document.addEventListener('DOMContentLoaded', function () {
    loadUserProfile();

    profileForm.addEventListener('submit', saveUserProfile);
    deleteAccountBtn.addEventListener('click', deleteAccount);
    logoutBtn.addEventListener('click', logout);
});
document.addEventListener('DOMContentLoaded'), function() {
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
    const termsCheckbox = document.getElementById('termsCheckbox');
    const termsCheckboxError = document.getElementById('termsCheckboxError');
    
}


            function populateDateSelects() {
             /* Dias (1-31)*/
            for (let i =1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            birthDaySelect.appenChild(option);

     }
    
    }

            birthDaySelect.insertBefore(new Option('Dia', '', true, true), birthDaySelect.firstChild);
            birthDaySelect.selectedIndex = 0;


                    /* meses */
            const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            birthMonthSelect.appenChild(option);

    });
            birthDaySelect.insertBefore(new Option('Mês', '', true, true), birthMonthSelect.firstChild);
            birthMonthSelect.selectedIndex = 0;


            /* anos */
            const currentYear =new Date().getFullYear;
            const startYear = currentYear - 100;
            for (let i= currentYear - 10; i >= startYear; i--) {
                const option = document.createElement('option');
                option. value = i;
                option.textContent = i;
                birthYearSelect.appenChild(option);
            }

            birthYearSelect.insertBefore(new Option('Ano', '', true, true), birthYearSelect.firstChild);
            birthYearSelect.selectedIndex = 0;

             

            populateDateSelects();

         
              

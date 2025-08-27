document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/register';

    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                successMessage.textContent = "Cadastro realizado com sucesso! Redirecionando para o login...";
                successMessage.classList.remove('hidden');
                // Redireciona para o login após 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                errorMessage.textContent = data.message || 'Ocorreu um erro.';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            errorMessage.textContent = 'Falha na conexão com o servidor.';
            errorMessage.classList.remove('hidden');
        }
    });
});
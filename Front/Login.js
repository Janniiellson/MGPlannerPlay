document.addEventListener('DOMContentLoaded', () => {
const API_URL = 'https://mgplannerplay.onrender.com/login';
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            // Força a leitura da resposta como JSON, mesmo que dê erro
            const data = await response.json();

            // Verifica se a resposta foi bem-sucedida (status 200-299)
            if (response.ok) {
                // Se o token existir nos dados, salve e redirecione
                if (data.token) {
                    localStorage.setItem('planner_token', data.token);
                    window.location.href = 'index.html';
                } else {
                    // Se o servidor deu 200 OK mas não mandou o token, é um erro
                    errorMessage.textContent = 'Resposta inesperada do servidor.';
                    errorMessage.classList.remove('hidden');
                }
            } else {
                // Se a resposta não foi OK (401, 500, etc)
                errorMessage.textContent = data.message || 'Usuário ou senha inválidos.';
                errorMessage.classList.remove('hidden');
                passwordInput.value = '';
            }
        } catch (error) {
            // Este erro acontece se a rede falhar ou se a resposta não for JSON válido
            console.error("ERRO NO FETCH:", error);
            errorMessage.textContent = 'Falha na conexão ou resposta inválida do servidor.';
            errorMessage.classList.remove('hidden');
        }
    });
});
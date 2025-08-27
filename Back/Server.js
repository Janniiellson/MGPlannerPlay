const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'Dentinho';

app.use(cors());
app.use(express.json());

async function startServer() {
    const defaultData = { users: [], tasks: [] };
    const db = new Low(new JSONFile('db.json'), defaultData);
    await db.read();

    app.post('/register', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
        const existingUser = db.data.users.find(u => u.username === username);
        if (existingUser) return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now(), username, passwordHash };
        db.data.users.push(newUser);
        await db.write();
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    });

    app.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = db.data.users.find(u => u.username === username);
            if (!user) {
                console.log(`[LOGIN FALHOU] Usuário não encontrado: ${username}`);
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
            if (isPasswordCorrect) {
                console.log(`[LOGIN SUCESSO] Usuário logado: ${username}. Enviando token.`);
                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
                return res.status(200).json({ token: token });
            } else {
                console.log(`[LOGIN FALHOU] Senha incorreta para o usuário: ${username}`);
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
        } catch (error) {
            console.error("[ERRO NA ROTA /login]:", error);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    });

    // O resto do seu servidor (authenticateToken, rotas de tasks, etc.) continua aqui...
    const authenticateToken = (req, res, next) => { const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1]; if (token == null) return res.sendStatus(401); jwt.verify(token, JWT_SECRET, (err, user) => { if (err) return res.sendStatus(403); req.userId = user.userId; next(); }); };
    app.get('/tasks', authenticateToken, (req, res) => { const userTasks = db.data.tasks.filter(task => task.userId === req.userId); res.json(userTasks); });
    app.post('/tasks', authenticateToken, async (req, res) => { const taskData = req.body; const newTask = { ...taskData, userId: req.userId, steps: taskData.steps || [] }; db.data.tasks.push(newTask); await db.write(); res.status(201).json(newTask); });
    app.put('/tasks/:id', authenticateToken, async (req, res) => { const taskId = parseInt(req.params.id); const task = db.data.tasks.find(t => t.id === taskId && t.userId === req.userId); if (!task) return res.status(404).json({ message: "Tarefa não encontrada" }); Object.assign(task, req.body); await db.write(); res.json(task); });
    app.delete('/tasks/:id', authenticateToken, async (req, res) => { const taskId = parseInt(req.params.id); const taskIndex = db.data.tasks.findIndex(t => t.id === taskId && t.userId === req.userId); if (taskIndex === -1) return res.status(404).json({ message: "Tarefa não encontrada" }); db.data.tasks.splice(taskIndex, 1); await db.write(); res.status(204).send(); });
    app.put('/tasks/:taskId/steps/:stepId', authenticateToken, async (req, res) => { const taskId = parseInt(req.params.taskId); const stepId = parseInt(req.params.stepId); const { completed } = req.body; const task = db.data.tasks.find(t => t.id === taskId && t.userId === req.userId); if (!task || !task.steps) return res.status(404).json({ message: "Tarefa não encontrada" }); const step = task.steps.find(s => s.id === stepId); if (!step) return res.status(404).json({ message: "Passo não encontrado" }); step.completed = completed; await db.write(); res.json(step); });

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta http://localhost:${PORT}`);
    });
}
startServer();
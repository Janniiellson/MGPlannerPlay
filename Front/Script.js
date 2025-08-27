// Front/script.js - VERSÃO ESTÁVEL (sem a função de "Passos")

// --- GUARDA DE AUTENTICAÇÃO ---
if (sessionStorage.getItem('loggedIn') !== 'true' && localStorage.getItem('planner_token') === null) {
    window.location.href = 'login.html';
}

const token = localStorage.getItem('planner_token');
const API_URL = 'https://mgplannerplay.onrender.com/tasks';
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES ---
    const workspacesView = document.getElementById('workspaces-view');
    const tasksView = document.getElementById('tasks-view');
    const workspaceListContainer = document.getElementById('workspace-list-container');
    const backToWorkspacesBtn = document.getElementById('back-to-workspaces-btn');
    const currentWorkspaceTitle = document.getElementById('current-workspace-title');
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title-input');
    const taskDescInput = document.getElementById('task-desc-input');
    const taskDueDateInput = document.getElementById('task-duedate-input');
    const taskPriorityInput = document.getElementById('task-priority-input');
    const taskList = document.getElementById('task-list');
    const completedTaskList = document.getElementById('completed-task-list');
    const toggleCompletedBtn = document.getElementById('toggle-completed-btn');
    const completedTasksContainer = document.getElementById('completed-tasks-container');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const logoutBtn = document.getElementById('logout-btn');
    const closeBtn = document.querySelector('.close-btn');
    
    let allTasks = [];
    let currentWorkspace = null;

    // --- LÓGICA DE TROCA DE TELAS ---
    const showWorkspacesView = () => {
        workspacesView.classList.remove('hidden');
        tasksView.classList.add('hidden');
        currentWorkspace = null;
        renderWorkspaces();
    };

    const showTasksView = (workspaceName) => {
        workspacesView.classList.add('hidden');
        tasksView.classList.remove('hidden');
        currentWorkspace = workspaceName;
        currentWorkspaceTitle.textContent = workspaceName;
        renderTasksForWorkspace(workspaceName);
    };

    // --- LÓGICA DE RENDERIZAÇÃO ---
    const renderWorkspaces = () => {
        const workspaces = [...new Set(allTasks.map(task => task.category))].sort();
        workspaceListContainer.innerHTML = '';
        if (workspaces.length > 0) {
            workspaces.forEach(name => {
                const workspaceEl = document.createElement('div');
                workspaceEl.className = 'workspace-item';
                workspaceEl.textContent = name;
                workspaceEl.addEventListener('click', () => showTasksView(name));
                workspaceListContainer.appendChild(workspaceEl);
            });
        }
        const addWorkspaceBtn = document.createElement('div');
        addWorkspaceBtn.className = 'workspace-item workspace-item--add';
        addWorkspaceBtn.innerHTML = `<span>+</span> Nova área de trabalho`;
        addWorkspaceBtn.addEventListener('click', handleAddNewWorkspace);
        workspaceListContainer.appendChild(addWorkspaceBtn);
    };

    const renderTasksForWorkspace = (workspaceName) => {
        taskList.innerHTML = '';
        completedTaskList.innerHTML = '';
        const tasksInWorkspace = allTasks.filter(task => task.category === workspaceName);
        tasksInWorkspace.forEach(task => {
            const taskEl = createTaskElement(task);
            if (task.completed) {
                completedTaskList.appendChild(taskEl);
            } else {
                taskList.appendChild(taskEl);
            }
        });
    };

    const createTaskElement = (task) => {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority || 'nenhuma'}`;
    taskItem.dataset.id = task.id;

    const priorityIndicator = `<div class="priority-indicator"></div>`;
    let dueDateHTML = '';
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        const formattedDate = date.toLocaleDateString('pt-BR');
        dueDateHTML = `<div class="due-date">Prazo: ${formattedDate}</div>`;
    }

    let stepsHTML = '<div class="steps-container">';
    if (task.steps && task.steps.length > 0) {
        task.steps.forEach(step => {
            stepsHTML += `
                <div class="step-item ${step.completed ? 'completed' : ''}">
                    <input type="checkbox" data-step-id="${step.id}" ${step.completed ? 'checked' : ''}>
                    <label>${step.text}</label>
                </div>
            `;
        });
    }
    stepsHTML += '</div>';

    const addStepFormHTML = `
        <form class="add-step-form" data-task-id="${task.id}">
            <input type="text" placeholder="Adicionar passo..." required />
            <button type="submit">+</button>
        </form>
    `;

    taskItem.innerHTML = `
        ${priorityIndicator}
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <div class="content"><strong>${task.title}</strong><p>${task.description || ''}</p></div>
        <div class="actions"><button class="edit-btn">✏️</button><button class="delete-btn">🗑️</button></div>
        ${dueDateHTML}
        ${stepsHTML}
        ${addStepFormHTML}
    `;

    taskItem.querySelectorAll('.step-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const stepId = e.target.dataset.stepId;
            toggleStepCompletion(task.id, parseInt(stepId), e.target.checked);
        });
    });

    taskItem.querySelector('.add-step-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = e.target.querySelector('input');
        addStepToTask(task.id, input.value);
        input.value = '';
    });

    taskItem.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTaskCompletion(task));
    taskItem.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task));
    taskItem.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
    return taskItem;
};

    // --- LÓGICA DE DADOS ---
    const handleAddNewWorkspace = () => {
        const workspaceName = prompt("Digite o nome da nova Área de Trabalho:");
        if (!workspaceName || workspaceName.trim() === '') return;
        const trimmedName = workspaceName.trim();
        const existingWorkspaces = [...new Set(allTasks.map(task => task.category))];
        if (existingWorkspaces.includes(trimmedName)) { alert('Essa área de trabalho já existe. Acessando...'); }
        showTasksView(trimmedName);
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch(API_URL, { headers });
            if (response.status === 401 || response.status === 403) { logout(); return; }
            allTasks = await response.json();
            showWorkspacesView();
        } catch (error) { console.error("Erro ao buscar tarefas:", error); }
    };

    const addTask = async (e) => {
        e.preventDefault();
        const newTaskData = { id: Date.now(), title: taskTitleInput.value.trim(), description: taskDescInput.value.trim(), dueDate: taskDueDateInput.value, priority: taskPriorityInput.value, category: currentWorkspace, completed: false, steps: [] };
        if (newTaskData.title === '') return;
        try {
            const response = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(newTaskData) });
            const createdTask = await response.json();
            allTasks.push(createdTask);
            renderTasksForWorkspace(currentWorkspace);
            taskForm.reset();
            steps: [] // ADICIONE ESTA LINHA

        } catch (error) { console.error("Erro ao adicionar tarefa:", error); }
    };

    const toggleTaskCompletion = async (task) => {
        const newCompletedStatus = !task.completed;
        try {
            await fetch(`${API_URL}/${task.id}`, { method: 'PUT', headers, body: JSON.stringify({ completed: newCompletedStatus }) });
            const taskToUpdate = allTasks.find(t => t.id === task.id);
            taskToUpdate.completed = newCompletedStatus;
            renderTasksForWorkspace(currentWorkspace);
        } catch (error) { console.error("Erro ao atualizar tarefa:", error); }
    };

    const deleteTask = async (id) => {
        if (confirm('Tem certeza?')) {
            try {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
                allTasks = allTasks.filter(t => t.id !== id);
                renderTasksForWorkspace(currentWorkspace);
            } catch (error) { console.error("Erro ao deletar tarefa:", error); }
        }
    };
const addStepToTask = async (taskId, stepText) => {
    if (stepText.trim() === '') return;
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    const newStep = { id: Date.now(), text: stepText, completed: false };
    if (!task.steps) {
        task.steps = [];
    }
    const updatedSteps = [...task.steps, newStep];
    try {
        await fetch(`${API_URL}/${taskId}`, { method: 'PUT', headers, body: JSON.stringify({ steps: updatedSteps }) });
        task.steps = updatedSteps;
        renderTasksForWorkspace(currentWorkspace);
    } catch (error) { console.error("Erro ao adicionar passo:", error); }
};

const toggleStepCompletion = async (taskId, stepId, isCompleted) => {
    try {
        await fetch(`${API_URL}/${taskId}/steps/${stepId}`, { method: 'PUT', headers, body: JSON.stringify({ completed: isCompleted }) });
        const task = allTasks.find(t => t.id === taskId);
        const step = task.steps.find(s => s.id === stepId);
        step.completed = isCompleted;
        renderTasksForWorkspace(currentWorkspace);
    } catch (error) { console.error("Erro ao atualizar passo:", error); }
};
    const openEditModal = (task) => {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-desc').value = task.description;
        document.getElementById('edit-task-category').value = task.category;
        const dueDateForInput = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "";
        document.getElementById('edit-task-duedate').value = dueDateForInput;
        document.getElementById('edit-task-priority').value = task.priority || "";
        editModal.style.display = 'flex';
    };

    const closeEditModal = () => {
        editModal.style.display = 'none';
    };

    const saveEditedTask = async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-task-id').value);
        const updatedData = {
            title: document.getElementById('edit-task-title').value.trim(),
            description: document.getElementById('edit-task-desc').value.trim(),
            dueDate: document.getElementById('edit-task-duedate').value,
            priority: document.getElementById('edit-task-priority').value,
            category: document.getElementById('edit-task-category').value.trim()
        };
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'PUT', headers, body: JSON.stringify(updatedData) });
            const savedTask = await response.json();
            const taskIndex = allTasks.findIndex(t => t.id === id);
            allTasks[taskIndex] = savedTask;
            renderTasksForWorkspace(currentWorkspace);
            closeEditModal();
        } catch (error) { console.error("Erro ao salvar edição:", error); }
    };
    
    const logout = () => {
        localStorage.removeItem('planner_token');
        window.location.href = 'login.html';
    };

    // --- EVENT LISTENERS ---
    backToWorkspacesBtn.addEventListener('click', showWorkspacesView);
    taskForm.addEventListener('submit', addTask);
    editForm.addEventListener('submit', saveEditedTask);
    closeBtn.addEventListener('click', closeEditModal);
    logoutBtn.addEventListener('click', logout);
    window.addEventListener('click', (e) => { if (e.target == editModal) closeEditModal(); });
    toggleCompletedBtn.addEventListener('click', () => {
        completedTasksContainer.classList.toggle('hidden');
        toggleCompletedBtn.textContent = completedTasksContainer.classList.contains('hidden') ? 'Mostrar Concluídas' : 'Ocultar Concluídas';
    });

    // --- INICIALIZAÇÃO ---
    fetchTasks();
});
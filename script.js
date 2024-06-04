let showArchived = false;
let editingTaskIndex = null;

document.addEventListener('DOMContentLoaded', (event) => {
    loadTasks();
    setInterval(updateTimers, 1000);
});

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        addTask();
    }
}

function addTask() {
    const taskInput = document.getElementById('new-task');
    const taskName = taskInput.value.trim();
    if (taskName) {
        const task = {
            name: taskName,
            startTime: null,
            totalTime: 0,
            archived: false
        };
        saveTask(task);
        taskInput.value = '';
        renderTasks();
    }
}

function startTask(index) {
    const tasks = getTasks();
    if (!tasks[index].startTime) {
        tasks[index].startTime = new Date().getTime();
        saveTasks(tasks);
        renderTasks();
    }
}

function stopTask(index) {
    const tasks = getTasks();
    if (tasks[index].startTime) {
        const now = new Date().getTime();
        const elapsed = now - tasks[index].startTime;
        tasks[index].totalTime += elapsed;
        tasks[index].startTime = null;
        saveTasks(tasks);
        renderTasks();
        showSummary(tasks[index].name, formatTime(elapsed), index);
    }
}

function archiveTask(index) {
    const tasks = getTasks();
    tasks[index].archived = true;
    saveTasks(tasks);
    renderTasks();
}

function deleteTask(index) {
    const tasks = getTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    const tasks = getTasks();
    tasks.forEach((task, index) => {
        if (task.archived === showArchived) {
            const li = document.createElement('li');
            li.className = task.startTime ? 'running' : '';
            li.onclick = () => showSummary(task.name, formatTime(task.totalTime), index);
            li.innerHTML = `
                <span>${task.name}</span>
                <span class="timer" id="timer-${index}">${formatTime(task.totalTime)}</span>
                <div class="action-icons">
                    ${!task.startTime && !task.archived ? `<img src="start-icon.png" alt="Start" onclick="startTask(${index}); event.stopPropagation();">` : ''}
                    ${task.startTime ? `<img src="stop-icon.png" alt="Stop" onclick="stopTask(${index}); event.stopPropagation();">` : ''}
                    ${task.startTime === null && !task.archived ? `<img src="archive-icon.png" alt="Archivieren" onclick="archiveTask(${index}); event.stopPropagation();">` : ''}
                    ${task.startTime === null && !task.archived ? `<img src="export-icon.png" alt="Export" onclick="downloadReceipt(${index}); event.stopPropagation();">` : ''}
                    ${task.archived ? `<img src="delete-icon.png" alt="Löschen" onclick="deleteTask(${index}); event.stopPropagation();">` : ''}
                </div>
            `;
            taskList.appendChild(li);
        }
    });
}

function updateTimers() {
    const tasks = getTasks();
    tasks.forEach((task, index) => {
        if (task.startTime) {
            const now = new Date().getTime();
            const elapsed = now - task.startTime;
            document.getElementById(`timer-${index}`).innerText = formatTime(task.totalTime + elapsed);
        }
    });
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000) % 60;
    const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
}

function getTasks() {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
}

function saveTask(task) {
    const tasks = getTasks();
    tasks.push(task);
    saveTasks(tasks);
}

function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    renderTasks();
}

function toggleArchiveView() {
    showArchived = !showArchived;
    renderTasks();
}

function showSummary(taskName, timeElapsed, index) {
    editingTaskIndex = index;
    const modal = document.getElementById('summary-modal');
    const summaryText = document.getElementById('summary-text');
    summaryText.innerText = `Aufgabe "${taskName}" gestoppt. Erfasste Zeit: ${timeElapsed}`;
    document.getElementById('edit-time').value = timeElapsed;
    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById('summary-modal');
    modal.style.display = "none";
}

function saveEditedTime() {
    const newTime = document.getElementById('edit-time').value;
    const timeParts = newTime.split(' ');
    let totalMilliseconds = 0;
    timeParts.forEach(part => {
        const value = parseInt(part.slice(0, -1));
        if (part.endsWith('h')) totalMilliseconds += value * 60 * 60 * 1000;
        if (part.endsWith('m')) totalMilliseconds += value * 60 * 1000;
        if (part.endsWith('s')) totalMilliseconds += value * 1000;
    });
    const tasks = getTasks();
    tasks[editingTaskIndex].totalTime = totalMilliseconds;
    saveTasks(tasks);
    renderTasks();
}

function downloadReceipt(index = null) {
    const tasks = getTasks();
    const task = index !== null ? tasks[index] : tasks[editingTaskIndex];
    const receipt = `Task: ${task.name}\nTotal Time: ${formatTime(task.totalTime)}`;
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.name}-receipt.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

window.onclick = function(event) {
    const modal = document.getElementById('summary-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// ===============================
// CONFIG
// ===============================
const API_URL = "https://691efad2bb52a1db22bfecaf.mockapi.io/tasks";

// DOM элементы
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const deleteAllButton = document.getElementById('delete-all');
const deleteSelectedButton = document.getElementById('delete-selected');
const allTodos = document.getElementById('all-todos');
const cCountEl = document.getElementById('c-count');
const rCountEl = document.getElementById('r-count');
const loadApiButton = document.getElementById('load-api'); 

// LOCAL STORAGE ключ
const STORAGE_KEY = 'todo_local_cache';

// Данные
let todoList = [];

// ===============================
// LOCAL STORAGE
// ===============================
function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todoList));
}

function loadLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) todoList = JSON.parse(raw);
}

// ===============================
// API FUNCTIONS
// ===============================
async function loadFromAPI() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    todoList = data.map(item => ({
      id: item.id,
      task: item.text || item.task,
      complete: item.completed ?? item.complete
    }));
    saveLocal();
    render();
  } catch (e) {
    alert("Ошибка загрузки API");
  }
}

async function apiAdd(taskObj) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: taskObj.task,
      completed: taskObj.complete
    })
  });
  const data = await res.json();
  return {
    id: data.id,
    task: data.text,
    complete: data.completed
  };
}

async function apiUpdate(task) {
  await fetch(`${API_URL}/${task.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: task.task,
      completed: task.complete
    })
  });
}

async function apiDelete(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });
}

// ===============================
// RENDER
// ===============================
function render(list = todoList) {
  allTodos.innerHTML = '';

  if (list.length === 0) {
    allTodos.innerHTML = '<li style="color:#fff;text-align:center;padding:12px">No tasks...</li>';
    updateCounts();
    return;
  }

  list.forEach(item => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = item.id;

    const p = document.createElement('p');
    p.className = 'todo-text' + (item.complete ? ' line' : '');
    p.textContent = item.task;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const btnComplete = document.createElement('button');
    btnComplete.className = 'circle-btn';
    if (item.complete) btnComplete.classList.add('completed');

    const btnDelete = document.createElement('button');
    btnDelete.className = 'delete btn-error';
    btnDelete.innerHTML = '<i class="bx bx-trash"></i>';

    actions.append(btnComplete, btnDelete);
    li.append(p, actions);
    allTodos.appendChild(li);
  });

  updateCounts();
}

function updateCounts() {
  rCountEl.textContent = todoList.length;
  cCountEl.textContent = todoList.filter(t => t.complete).length;
}

// ===============================
// CRUD actions
// ===============================
function createTodo(text) {
  return { task: text, id: Date.now().toString(), complete: false };
}

async function add() {
  const value = todoInput.value.trim();
  if (!value) {
    alert('Task cannot be empty');
    return;
  }

  let newTask = createTodo(value);
  todoInput.value = "";

  // добавляем в API
  const apiTask = await apiAdd(newTask);
  todoList.push(apiTask);

  saveLocal();
  render();
}

async function deleteAll() {
  if (!confirm("Delete ALL tasks?")) return;

  for (let task of todoList) {
    await apiDelete(task.id);
  }

  todoList = [];
  saveLocal();
  render();
}

async function deleteSelected() {
  const completedTasks = todoList.filter(t => t.complete);

  for (let t of completedTasks) {
    await apiDelete(t.id);
  }

  todoList = todoList.filter(t => !t.complete);
  saveLocal();
  render();
}

async function toggleCompleteById(id) {
  todoList = todoList.map(t =>
    t.id === id ? { ...t, complete: !t.complete } : t
  );

  const updated = todoList.find(t => t.id === id);
  await apiUpdate(updated);

  saveLocal();
  render();
}

async function deleteById(id) {
  await apiDelete(id);
  todoList = todoList.filter(t => t.id !== id);
  saveLocal();
  render();
}

// ===============================
// EVENTS
// ===============================
addButton.addEventListener('click', add);

todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') add();
});

deleteAllButton.addEventListener('click', deleteAll);
deleteSelectedButton.addEventListener('click', deleteSelected);
loadApiButton.addEventListener('click', loadFromAPI);

// клики по задачам
allTodos.addEventListener('click', e => {
  const li = e.target.closest('.todo-item');
  if (!li) return;

  const deleteBtn = e.target.closest('button.delete');

  if (deleteBtn) {
    if (confirm("Delete this task?")) deleteById(li.dataset.id);
    return;
  }

  toggleCompleteById(li.dataset.id);
});

// фильтры
document.addEventListener('click', e => {
  if (e.target.id === 'all') {
    e.preventDefault();
    render(todoList);
  }
  if (e.target.id === 'rem') {
    e.preventDefault();
    render(todoList.filter(t => !t.complete));
  }
  if (e.target.id === 'com') {
    e.preventDefault();
    render(todoList.filter(t => t.complete));
  }
});

// Открытие/закрытие фильтра при клике
const dropdown = document.querySelector('.dropdown');
const dropBtn = document.querySelector('.dropbtn');

dropBtn.addEventListener('click', () => {
  dropdown.classList.toggle('open');
});

// Закрытие при клике вне меню
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});


// ===============================
// INIT
// ===============================
loadLocal();
render();

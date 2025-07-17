document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeSwitch = document.getElementById('theme-switch');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addProjectBtn = document.getElementById('add-project-btn');
    const addExecutorBtn = document.getElementById('add-executor-btn');
    const sortTasksBtn = document.getElementById('sort-tasks-btn');
    const taskModal = document.getElementById('task-modal');
    const projectModal = document.getElementById('project-modal');
    const executorModal = document.getElementById('executor-modal');
    const sortModal = document.getElementById('sort-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const taskForm = document.getElementById('task-form');
    const projectForm = document.getElementById('project-form');
    const executorForm = document.getElementById('executor-form');
    const tasksList = document.getElementById('tasks-list');
    const projectsList = document.getElementById('projects-list');
    const executorsList = document.getElementById('executors-list');
    const taskProjectSelect = document.getElementById('task-project');
    const taskExecutorSelect = document.getElementById('task-executor');
    const taskStatusList = document.getElementById('task-status');
    const priorityFilter = document.getElementById('priority-filter');
    const dateFilter = document.getElementById('date-filter');
    const taskSearch = document.getElementById('task-search');
    const currentViewElement = document.getElementById('current-view');
    const totalTasksCount = document.getElementById('total-tasks-count');
    const completedTasksCount = document.getElementById('completed-tasks-count');
    const pendingTasksCount = document.getElementById('pending-tasks-count');
    
    // View buttons
    const allTasksBtn = document.getElementById('all-tasks');
    const todayTasksBtn = document.getElementById('today-tasks');
    const importantTasksBtn = document.getElementById('important-tasks');
    const completedTasksBtn = document.getElementById('completed-tasks');
    
    // Sort modal elements
    const applySortBtn = document.getElementById('apply-sort-btn');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    let executors = JSON.parse(localStorage.getItem('executors')) || [];
    let currentView = 'all';
    let currentSort = { by: 'dueDate', order: 'asc' };
    let currentFilters = { priority: 'all', date: 'all' };
    let searchQuery = '';

    const statusList = new Map([
        ['todo', 'New'],
        ['in_progress', 'In Progress'],
        ['review', 'Review'],
        ['done', 'Done']
    ]);    
    
    // Initialize the app
    init();
    
    function init() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        themeSwitch.checked = savedTheme === 'dark';
        
        // Load tasks and projects
        renderTasks();
        renderProjects();
        renderExecutors();
        updateStats();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    
    function setupEventListeners() {
        // Theme toggle
        themeSwitch.addEventListener('change', function() {
            setTheme(this.checked ? 'dark' : 'light');
        });
        
        // Modal open buttons
        addTaskBtn.addEventListener('click', () => openTaskModal());
        addProjectBtn.addEventListener('click', () => openProjectModal());
        addExecutorBtn.addEventListener('click', () => openExecutorModal());
        sortTasksBtn.addEventListener('click', () => openSortModal());
        
        // Modal close buttons
        closeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                modal.style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Form submissions
        taskForm.addEventListener('submit', handleTaskSubmit);
        projectForm.addEventListener('submit', handleProjectSubmit);
        executorForm.addEventListener('submit', handleExecutorSubmit);
        
        // Filter and search
        priorityFilter.addEventListener('change', function() {
            currentFilters.priority = this.value;
            renderTasks();
        });
        
        dateFilter.addEventListener('change', function() {
            currentFilters.date = this.value;
            renderTasks();
        });
        
        taskSearch.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            renderTasks();
        });
        
        // View buttons
        allTasksBtn.addEventListener('click', () => setCurrentView('all'));
        todayTasksBtn.addEventListener('click', () => setCurrentView('today'));
        importantTasksBtn.addEventListener('click', () => setCurrentView('important'));
        completedTasksBtn.addEventListener('click', () => setCurrentView('completed'));
        
        // Sort apply button
        applySortBtn.addEventListener('click', applySort);
    }
    
    function openTaskModal(task = null) {
        const modalTitle = document.getElementById('modal-title');
        const taskIdInput = document.getElementById('task-id');
        const taskTitleInput = document.getElementById('task-title');
        const taskDescriptionInput = document.getElementById('task-description');
        const taskStartDateInput = document.getElementById('task-start-date');
        const taskDueDateInput = document.getElementById('task-due-date');
        const taskPriorityInput = document.getElementById('task-priority');
        const taskProjectInput = document.getElementById('task-project');
        const taskExecutorInput = document.getElementById('task-executor');
        const taskStatusInput = document.getElementById('task-status');
        const taskLabelsInput = document.getElementById('task-labels');
        
        // Reset form
        taskForm.reset();
        
        if (task) {
            // Edit mode
            modalTitle.textContent = 'Edit Task';
            taskIdInput.value = task.id;
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description || '';
            taskStartDateInput.value = task.startDate || '';
            taskDueDateInput.value = task.dueDate || '';
            taskPriorityInput.value = task.priority;
            taskProjectInput.value = task.project || '';
            taskExecutorInput.value = task.executor || '';
            taskStatusInput.value = task.status || 'todo';
            taskLabelsInput.value = task.labels ? task.labels.join(', ') : '';
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Task';
            taskIdInput.value = '';
            // Set default due date to today
            const today = new Date().toISOString().split('T')[0];
            taskDueDateInput.value = today;
        }
        
        // Populate projects dropdown
        populateProjectDropdown(taskProjectInput.value);//task.project
        
        // Populate executors dropdown
        populateExecutorDropdown(taskExecutorInput.value);

        taskModal.style.display = 'flex';
    }
    
    function openProjectModal() {
        projectForm.reset();
        projectModal.style.display = 'flex';
    }
    
    function openExecutorModal() {
        executorForm.reset();
        executorModal.style.display = 'flex';
    }
    
    function openSortModal() {
        // Set current sort options
        document.querySelector(`input[name="sort"][value="${currentSort.by}"]`).checked = true;
        document.querySelector(`input[name="order"][value="${currentSort.order}"]`).checked = true;
        
        sortModal.style.display = 'flex';
    }
    
    function applySort() {
        const sortBy = document.querySelector('input[name="sort"]:checked').value;
        const sortOrder = document.querySelector('input[name="order"]:checked').value;
        
        currentSort = { by: sortBy, order: sortOrder };
        renderTasks();
        sortModal.style.display = 'none';
    }
    
    function populateProjectDropdown(selectedProjectId = "") {
        const projectSelect = document.getElementById('task-project'); // or your project selector ID
        if (!projectSelect) return;

        let projects = JSON.parse(localStorage.getItem('projects')) || [];

        projectSelect.innerHTML = '<option value="">Select Project</option>';

        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = String(project.id);
            option.textContent = project.name || project.title;

            // Compare the project ID of the task being edited with the current project in the cycle
            if (selectedProjectId && String(project.id) === String(selectedProjectId)) {
                option.setAttribute('selected', 'selected');
                option.selected = true;
            }

            projectSelect.appendChild(option);
        });

        if (selectedProjectId) {
            projectSelect.value = String(selectedProjectId);
        }
    }
    
    function populateExecutorDropdown(selectedExecutorId = "") {
        const executorSelect = document.getElementById('task-executor');
        if (!executorSelect) return;

        let executors = JSON.parse(localStorage.getItem('executors')) || [];

        // Basic reset of the selector to its original state
        executorSelect.innerHTML = '<option value="">No Executor</option>';

        executors.forEach(exec => {
            const option = document.createElement('option');
            
            // Casting to a string protects against data type bugs in JS
            option.value = String(exec.id); 
            option.textContent = exec.name;

            // If the current performer's ID matches the ID in the loop, mark it as selected.
            if (selectedExecutorId && String(exec.id) === String(selectedExecutorId)) {
                option.setAttribute('selected', 'selected'); // For HTML markup
                option.selected = true;                     // For browser DOM properties
            }

            executorSelect.appendChild(option);
        });

        // Safety direct value setting for DOM
        if (selectedExecutorId) {
            executorSelect.value = String(selectedExecutorId);
        }
    }

    
    function handleTaskSubmit(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const startDate = document.getElementById('task-start-date').value;
        const dueDate = document.getElementById('task-due-date').value;
        const priority = document.getElementById('task-priority').value;
        const statusId = document.getElementById('task-status').value;
        const projectId = document.getElementById('task-project').value;
        const executorId = document.getElementById('task-executor').value;
        const labels = document.getElementById('task-labels').value
            .split(',')
            .map(label => label.trim())
            .filter(label => label);
        
        if (!title) {
            alert('Task title is required!');
            return;
        }
        
        const project = projects.find(p => p.id === projectId);
        const executor = executors.find(p => p.id === executorId);
        
        const taskData = {
            title,
            description,
            startDate: startDate || null,
            dueDate: dueDate || null,
            priority,
            project: project ? project.id : null,
            projectName: project ? project.name : null,
            projectColor: project ? project.color : null,
            executor: executor ? executor.id : null,
            executorName: executor ? executor.name : null,
            status: statusId ? statusId : null,
            labels,
            isCompleted: false,
            isImportant: false,
            createdAt: new Date().toISOString()
        };
        
        if (taskId) {
            // Update existing task
            const existingTask = tasks.find(t => t.id === taskId);
            if (existingTask) {
                Object.assign(existingTask, {
                    ...taskData,
                    isCompleted: existingTask.isCompleted,
                    isImportant: existingTask.isImportant,
                    id: existingTask.id
                });
            }
        } else {
            // Add new task
            taskData.id = generateId();
            tasks.push(taskData);
        }
        
        saveTasks();
        renderTasks();
        updateStats();
        taskModal.style.display = 'none';
    }
    
    function handleProjectSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('project-name').value.trim();
        const color = document.getElementById('project-color').value;
        
        if (!name) {
            alert('Project name is required!');
            return;
        }

        const projectData = {
            id: generateId(),
            name,
            color
        };

        projects.push(projectData);
        saveProjects();
        renderProjects();
        projectModal.style.display = 'none';
    }

    function handleExecutorSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('executor-name').value.trim();
        
        if (!name) {
            alert('Executor name is required!');
            return;
        }

        const executorData = {
            id: generateId(),
            name
        };

        executors.push(executorData);
        saveExecutors();
        renderExecutors();
        executorModal.style.display = 'none';
    }

    function setCurrentView(view) {
        currentView = view;
        
        // Update active button
        document.querySelectorAll('.sidebar-menu button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        switch(view) {
            case 'all':
                allTasksBtn.classList.add('active');
                currentViewElement.textContent = 'All Tasks';
                break;
            case 'today':
                todayTasksBtn.classList.add('active');
                currentViewElement.textContent = 'Today\'s Tasks';
                break;
            case 'important':
                importantTasksBtn.classList.add('active');
                currentViewElement.textContent = 'Important Tasks';
                break;
            case 'completed':
                completedTasksBtn.classList.add('active');
                currentViewElement.textContent = 'Completed Tasks';
                break;
        }
        
        renderTasks();
    }

    function renderTasks() {
        // Filter tasks based on current view, filters and search
        let filteredTasks = [...tasks];
        
        // Apply view filter
        switch(currentView) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = filteredTasks.filter(task => task.dueDate === today);
                break;
            case 'important':
                filteredTasks = filteredTasks.filter(task => task.isImportant);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.isCompleted);
                break;
            default:
                // 'all' view - no filter
                break;
        }
        
        // Apply priority filter
        if (currentFilters.priority !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === currentFilters.priority);
        }
        
        // Apply date filter
        if (currentFilters.date !== 'all') {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            switch(currentFilters.date) {
                case 'today':
                    filteredTasks = filteredTasks.filter(task => task.dueDate === todayStr);
                    break;
                case 'week':
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    filteredTasks = filteredTasks.filter(task => {
                        if (!task.dueDate) return false;
                        const taskDate = new Date(task.dueDate);
                        return taskDate >= today && taskDate <= nextWeek;
                    });
                    break;
                case 'month':
                    const nextMonth = new Date(today);
                    nextMonth.setMonth(today.getMonth() + 1);
                    filteredTasks = filteredTasks.filter(task => {
                        if (!task.dueDate) return false;
                        const taskDate = new Date(task.dueDate);
                        return taskDate >= today && taskDate <= nextMonth;
                    });
                    break;
                case 'overdue':
                    filteredTasks = filteredTasks.filter(task => {
                        if (!task.dueDate) return false;
                        const taskDate = new Date(task.dueDate);
                        return taskDate < today && !task.isCompleted;
                    });
                    break;
            }
        }
        
        // Apply search
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchQuery)) || 
                (task.description && task.description.toLowerCase().includes(searchQuery))
        }
        
        // Sort tasks
        filteredTasks.sort((a, b) => {
            let compareValue = 0;
            
            switch(currentSort.by) {
                case 'dueDate':
                    const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
                    const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
                    compareValue = dateA - dateB;
                    break;
                case 'priority':
                    const priorityOrder = { high: 1, medium: 2, low: 3 };
                    compareValue = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'createdAt':
                    compareValue = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                case 'title':
                    compareValue = a.title.localeCompare(b.title);
                    break;
            }
            
            return currentSort.order === 'asc' ? compareValue : -compareValue;
        });
        
        // Render tasks
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks found. ${currentView === 'all' ? 'Add a new task to get started!' : 'Try changing your filters.'}</p>
                </div>
            `;
            return;
        }
        
        tasksList.innerHTML = '';
        
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-card ${task.priority}-priority ${task.isCompleted ? 'completed' : ''}`;
            
            // Status display
            const statusDisplay = `
                    <div class="task-detail">
                        <i class="fas fa-heart"></i>
                        ${task.status}
                        <!-- ${statusList.get(task.status)} -->
                    </div>
                `;

            
            // Format due date
            let dueDateDisplay = 'No due date';
            if (task.dueDate) {
                const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
                dueDateDisplay = new Date(task.dueDate).toLocaleDateString(undefined, options);
            }
            
            // Priority display
            const priorityDisplay = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            
            // Project display
            let projectDisplay = '';
            if (task.project) {
                projectDisplay = `
                    <div class="task-detail">
                        <i class="fas fa-project-diagram"></i>
                        <span class="task-project">
                            <span class="project-color" style="background-color: ${task.projectColor}"></span>
                            ${task.projectName}
                        </span>
                    </div>
                `;
            }
            
            // Executor display
            let executorDisplay = '';
            if (task.executor) {
                executorDisplay = `
                    <div class="task-detail">
                        <i class="fas fa-user"></i>
                        <span class="task-executor">
                            ${task.executorName}
                        </span>
                    </div>
                `;
            }
            
            // Labels display
            let labelsDisplay = '';
            if (task.labels && task.labels.length > 0) {
                labelsDisplay = `
                    <div class="task-labels">
                        ${task.labels.map(label => `<span class="task-label">${label}</span>`).join('')}
                    </div>
                `;
            }
            
            taskElement.innerHTML = `
                <div class="task-header-row">
                    <div class="task-title ${task.isCompleted ? 'completed' : ''}">
                        <input type="checkbox" class="complete-checkbox" ${task.isCompleted ? 'checked' : ''} data-task-id="${task.id}">
                        ${task.title}
                    </div>
                    <div class="task-actions-row">
                        <button class="task-action-btn important ${task.isImportant ? 'active' : ''}" data-task-id="${task.id}">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="task-action-btn edit" data-task-id="${task.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn delete" data-task-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-details">
                    ${statusDisplay}
                    <div class="task-detail">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${dueDateDisplay}</span>
                    </div>
                    <div class="task-detail">
                        <i class="fas fa-bolt"></i>
                        <span class="task-priority ${task.priority}">${priorityDisplay}</span>
                    </div>
                    ${projectDisplay}
                    ${executorDisplay}
                </div>
                ${labelsDisplay}
            `;
            
            tasksList.appendChild(taskElement);
        });
        
        // Add event listeners to task actions
        document.querySelectorAll('.complete-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const taskId = this.getAttribute('data-task-id');
                toggleTaskComplete(taskId);
            });
        });
        
        document.querySelectorAll('.important').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                toggleTaskImportant(taskId);
            });
        });
        
        document.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                const task = tasks.find(t => t.id === taskId);
                if (task) openTaskModal(task);
            });
        });
        
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(taskId);
                }
            });
        });
    }

    function renderProjects() {
        projectsList.innerHTML = '';
        
        if (projects.length === 0) {
            projectsList.innerHTML = '<p class="no-projects">No projects yet</p>';
            return;
        }
        
        projects.forEach(project => {
            const projectElement = document.createElement('div');
            projectElement.className = 'project-item';
            projectElement.innerHTML = `
                <span class="project-color" style="background-color: ${project.color}"></span>
                <span class="project-name">${project.name}</span>
                <button class="delete-project" data-project-id="${project.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            projectElement.addEventListener('click', function(e) {
                if (!e.target.classList.contains('delete-project') && !e.target.closest('.delete-project')) {
                    currentView = 'all';
                    currentFilters = { priority: 'all', date: 'all' };
                    priorityFilter.value = 'all';
                    dateFilter.value = 'all';
                    setCurrentView('all');
                    document.getElementById('task-project').value = project.id;
                    renderTasks();
                }
            });
            
            const deleteBtn = projectElement.querySelector('.delete-project');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const projectId = this.getAttribute('data-project-id');
                if (confirm('Are you sure you want to delete this project? Tasks in this project will not be deleted.')) {
                    deleteProject(projectId);
                }
            });
            
            projectsList.appendChild(projectElement);
        });
        
        // Update project dropdown in task form
        populateProjectDropdown();
    }

    function renderExecutors() {
        executorsList.innerHTML = '';
        
        if (executors.length === 0) {
            executorsList.innerHTML = '<p class="no-executors">No executors yet</p>';
            return;
        }
        
        executors.forEach(executor => {
            const executorElement = document.createElement('div');
            executorElement.className = 'executor-item';
            executorElement.innerHTML = `
                <span class="executor-name">${executor.name}</span>
                <button class="delete-executor" data-executor-id="${executor.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            executorElement.addEventListener('click', function(e) {
                if (!e.target.classList.contains('delete-executor') && !e.target.closest('.delete-executor')) {
                    currentView = 'all';
                    currentFilters = { priority: 'all', date: 'all' };
                    priorityFilter.value = 'all';
                    dateFilter.value = 'all';
                    setCurrentView('all');
                    document.getElementById('task-executor').value = executor.id;
                    renderTasks();
                }
            });
            
            const deleteBtn = executorElement.querySelector('.delete-executor');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const executorId = this.getAttribute('data-executor-id');
                if (confirm('Are you sure you want to delete this executor? Tasks of this executor will not be deleted.')) {
                    deleteExecutor(executorId);
                }
            });
            
            executorsList.appendChild(executorElement);
        });
        
        // Update project dropdown in task form
        populateExecutorDropdown();
    }

    function toggleTaskComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.isCompleted = !task.isCompleted;
            saveTasks();
            renderTasks();
            updateStats();
        }
    }

    function toggleTaskImportant(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.isImportant = !task.isImportant;
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();
    }

    function deleteProject(projectId) {
        // Remove project from projects list
        projects = projects.filter(p => p.id !== projectId);
        
        // Remove project reference from tasks
        tasks.forEach(task => {
            if (task.project === projectId) {
                task.project = null;
                task.projectName = null;
                task.projectColor = null;
            }
        });
        
        saveProjects();
        saveTasks();
        renderProjects();
        renderExecutors();
        renderTasks();
    }

    function deleteExecutor(executorId) {
        // Remove executor from executors list
        executors = executors.filter(p => p.id !== executorId);
        
        // Remove project reference from tasks
        tasks.forEach(task => {
            if (task.executor === executorId) {
                task.executor = null;
                task.executorName = null;
            }
        });
        
        saveExecutors();
        saveTasks();
        renderProjects();
        renderExecutors();
        renderTasks();
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.isCompleted).length;
        const pending = total - completed;
        
        totalTasksCount.textContent = total;
        completedTasksCount.textContent = completed;
        pendingTasksCount.textContent = pending;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function saveProjects() {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function saveExecutors() {
        localStorage.setItem('executors', JSON.stringify(executors));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
});

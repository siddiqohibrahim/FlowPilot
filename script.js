// SUPABASE CONNECTION

const SUPABASE_URL = "https://bydjqiqthfydzbjwjceo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VWhxrjLcDynfLp1lWrsy1Q_YfOxSwP4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


let currentWorkspaceOwnerId = null;
let currentUserRole = null;
let currentUserPlan = "free";



// CONTACT MESSAGE CHARACTER COUNTER

const contactMessage = document.getElementById("contactMessage");
const messageCount = document.getElementById("messageCount");

if (contactMessage && messageCount) {
    contactMessage.addEventListener("input", function () {
        messageCount.textContent = contactMessage.value.length;
    });
}

// CONTACT FORM SUBMISSION

const contactForm = document.getElementById("contactForm");
const contactFeedback = document.getElementById("contactFeedback");

if (contactForm && contactFeedback) {
    contactForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const submitButton = contactForm.querySelector(
            'button[type="submit"]'
        );

        const originalButtonText = submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

       contactFeedback.textContent = "";
       contactFeedback.className = "contact-feedback";

        try {
            const response = await fetch(contactForm.action, {
                method: "POST",
                body: new FormData(contactForm),
                headers: {
                    Accept: "application/json"
                }
            });

            if (response.ok) {
                contactFeedback.textContent =
                   "Thank you! Your message has been sent successfully.";

                contactFeedback.className = "contact-feedback success";

                contactForm.reset();
                if (messageCount) {
                    messageCount.textContent = "0";
                }
            } else {
                contactFeedback.textContent =
                  "We couldn't send your message. Please try again.";

                contactFeedback.className = "contact-feedback error";
            }
        } catch (error) {
            contactFeedback.textContent =
              "A connection error occurred. Please check your internet and try again.";

            contactFeedback.className = "contact-feedback error";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// PRICING PLAN SELECTION

const planButtons = document.querySelectorAll(".plan-button");
const contactSubject = document.getElementById("contactSubject");

planButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const selectedPlan = button.dataset.plan;

        if (contactSubject) {
            contactSubject.value =
                "Enquiry about the " + selectedPlan + " plan";
        }
    });
});


/* SELECTED PRICING PLAN */

const selectedPlanMessage = document.getElementById("selectedPlanMessage");
const planFromUrl = new URLSearchParams(window.location.search).get("plan");

const availablePlans = {
    free: "Free",
    pro: "Pro",
    team: "Team"
};

const selectedPlan = availablePlans[planFromUrl] || null;

if (selectedPlanMessage && selectedPlan) {
    selectedPlanMessage.textContent =
        "You've selected the " + selectedPlan + " plan.";

    selectedPlanMessage.style.color = "#2458A6";
}


// REAL SUPABASE SIGNUP

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    const signupPassword = document.getElementById("signupPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const signupFeedback = document.getElementById("signupFeedback");
    const signupButton = signupForm.querySelector('button[type="submit"]');

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        signupFeedback.className = "signup-feedback";
        signupFeedback.textContent = "";

        if (!signupForm.checkValidity()) {
            signupForm.reportValidity();
            return;
        }

        if (signupPassword.value !== confirmPassword.value) {
            signupFeedback.textContent = "Your passwords do not match.";
            signupFeedback.style.color = "#b42318";
            confirmPassword.focus();
            return;
        }

        const originalText = signupButton.textContent;
        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: document.getElementById("signupEmail").value.trim(),
                password: signupPassword.value,
               
                options: {
                    data: {
                        full_name: document.getElementById("signupName").value.trim(),
                        selected_plan: planFromUrl || "free"
                    },

                    emailRedirectTo: new URLSearchParams(
                        window.location.search
                    ).has("invitation_id")
                        ? window.location.origin +
                            "/accept-invitation.html" +
                            window.location.search
                        : window.location.origin + "/login.html"
                }
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                signupFeedback.textContent =
                    "Your account has been created successfully. You can now log in.";
                signupFeedback.style.color = "#146c43";
                signupForm.reset();
            } else {
                signupFeedback.textContent =
                    "Registration received! Check your email for a confirmation link.";
                signupFeedback.style.color = "#146c43";
            }

        } catch (error) {
            signupFeedback.textContent = error.message;
            signupFeedback.style.color = "#b42318";
        } finally {
            signupButton.disabled = false;
            signupButton.textContent = originalText;
        }
    });
}


// REAL SUPABASE LOGIN

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const loginFeedback = document.getElementById("loginFeedback");
    const forgotPassword = document.getElementById("forgotPassword");
    const loginButton = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        loginFeedback.textContent = "";

        if (!loginForm.checkValidity()) {
            loginForm.reportValidity();
            return;
        }

        const originalText = loginButton.textContent;
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: document.getElementById("loginEmail").value.trim(),
                password: document.getElementById("loginPassword").value
            });

            if (error) {
                throw error;
            }

            loginFeedback.textContent = "Login successful!";
            loginFeedback.style.color = "#146c43";

            const invitationId = new URLSearchParams(
                window.location.search
            ).get("invitation_id");

            if (invitationId) {
                window.location.href =
                    `accept-invitation.html?invitation_id=${encodeURIComponent(invitationId)}`;
            } else {
                window.location.href = "dashboard.html";
            }

        } catch (error) {
            loginFeedback.textContent = error.message;
            loginFeedback.style.color = "#b42318";
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = originalText;
        }
    });

    forgotPassword.addEventListener("click", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();

        if (!email) {
            loginFeedback.textContent =
                "Enter your email address first, then click Forgot password.";
            loginFeedback.style.color = "#b45309";
            document.getElementById("loginEmail").focus();
            return;
        }

        loginFeedback.textContent = "Sending password reset email...";
        loginFeedback.style.color = "#3478f6";

        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: window.location.origin + "/reset-password.html"
                }
            );

            if (error) {
                throw error;
            }

            loginFeedback.textContent =
                "If an account exists for this email, a password reset link will be sent.";
            loginFeedback.style.color = "#146c43";

        } catch (error) {
            loginFeedback.textContent = error.message;
            loginFeedback.style.color = "#b42318";
        }
    });
}




/* ========================================
   FLOWPILOT DASHBOARD AUTHENTICATION
======================================== */

let acceptedWorkspaceMemberships = [];

const dashboardPage = document.querySelector(".dashboard-page");

if (dashboardPage) {
    const userName = document.getElementById("userName");
    const logoutButton = document.getElementById("logoutButton");
    const dashboardFeedback = document.getElementById("dashboardFeedback");

    async function initializeDashboard() {
        try {
            // Check whether a user is logged in
            const { data, error } = await supabaseClient.auth.getUser();

            if (error || !data.user) {
                window.location.replace("login.html");
                return;
            }

            const currentUserId = data.user.id;

            console.log("Dashboard authentication started:", currentUserId);

            // Load all accepted workspace invitations
            const { data: memberships, error: membershipError } =
                await supabaseClient
                    .from("team_members")
                    .select("workspace_owner_id, member_role, id")
                    .eq("workspace_member_id", currentUserId)
                    .eq("invitation_status", "accepted");

            if (membershipError) {
                throw membershipError;
            }

            acceptedWorkspaceMemberships = memberships || [];

            // Always open the signed-in user's own workspace first
            currentWorkspaceOwnerId = currentUserId;
            currentUserRole = "owner";

            // Set up the workspace dropdown
            const workspaceSelect =
                document.getElementById("workspaceSelect");

            if (workspaceSelect) {
                workspaceSelect.replaceChildren();

                const personalOption = document.createElement("option");
                personalOption.value = "personal";
                personalOption.textContent = "My Workspace";
                workspaceSelect.appendChild(personalOption);

                acceptedWorkspaceMemberships.forEach(
                    function (membership, index) {
                        const invitedOption =
                            document.createElement("option");

                        invitedOption.value = membership.id;
                        invitedOption.textContent =
                            `Invited Workspace ${index + 1} (${membership.member_role})`;

                        workspaceSelect.appendChild(invitedOption);
                    }
                );

                // Default to the personal workspace
                workspaceSelect.value = "personal";

                // Switch between personal and invited workspaces
                workspaceSelect.addEventListener(
                    "change",
                    async function () {
                        if (workspaceSelect.value === "personal") {
                            currentWorkspaceOwnerId = currentUserId;
                            currentUserRole = "owner";
                        } else {
                            const selectedMembership =
                                acceptedWorkspaceMemberships.find(
                                    function (membership) {
                                        return membership.id ===
                                            workspaceSelect.value;
                                    }
                                );

                            if (!selectedMembership) {
                                showNotification(
                                    "Workspace not found.",
                                    "error"
                                );
                                return;
                            }

                            currentWorkspaceOwnerId =
                                selectedMembership.workspace_owner_id;

                            currentUserRole =
                                selectedMembership.member_role;
                        }

                        try {
                            await loadDashboardProjects();
                            await loadDashboardTasks();
                            await loadTaskProjects();
                            await loadTaskStatistics();
                        } catch (error) {
                            console.error(
                                "Workspace switching error:",
                                error
                            );
                            showNotification(
                                "Unable to load this workspace.",
                                "error"
                            );
                        }
                    }
                );
            }

            // Display the user's name
            const fullName = data.user.user_metadata?.full_name;
            currentUserPlan = (
                data.user.user_metadata?.selected_plan || "free"
            ).toLowerCase();
            updateInviteButtonVisibility();
            console.log("Saved user metadata:", data.user.user_metadata);
            console.log("Saved user metadata:", data.user.user_metadata);
            const dashboardPlanLabel = document.getElementById("dashboardPlanLabel");
            const userPlan = (
                data.user.user_metadata?.selected_plan || "free"
            ).toLowerCase();

            const planNames = {
                free: "Free Plan",
                pro: "Pro Plan",
                team: "Team Plan"
            };

            if (dashboardPlanLabel) {
                dashboardPlanLabel.textContent =
                    "Current Plan: " + (planNames[userPlan] || "Free Demo Plan");
            }

            if (userName) {
                userName.textContent =
                    fullName || data.user.email || "there";
            }

            // Load the personal workspace dashboard
            console.log("1. Loading dashboard projects...");
            await loadDashboardProjects();
            console.log("2. Dashboard projects finished.");

            console.log("3. Loading dashboard tasks...");
            await loadDashboardTasks();
            console.log("4. Dashboard tasks finished.");

            console.log("5. Loading task projects...");
            await loadTaskProjects();
            console.log("6. Task projects finished.");

            console.log("7. Loading task statistics...");
            await loadTaskStatistics();
            console.log("8. Task statistics finished.");

        } catch (error) {
            if (dashboardFeedback) {
                dashboardFeedback.textContent =
                    "Unable to verify your session. Please log in again.";
                dashboardFeedback.style.color = "#b42318";
            }

            console.error("Dashboard authentication error:", error);
        }
    }

    initializeDashboard();

    // Log out the current user
    if (logoutButton) {
        logoutButton.addEventListener("click", async function () {
            await handleLogout(logoutButton);
        });
    }
}


// Also connect the Settings logout button
const settingsLogoutButton = document.getElementById("settingsLogout");

if (settingsLogoutButton) {
    settingsLogoutButton.addEventListener("click", async function () {
        await handleLogout(settingsLogoutButton);
    });
}

// Shared logout function
async function handleLogout(button) {
    button.disabled = true;
    button.textContent = "Logging out...";

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.replace("index.html");
    } catch (error) {
        if (dashboardFeedback) {
            dashboardFeedback.textContent =
                "Logout failed. Please try again.";
            dashboardFeedback.style.color = "#b42318";
        }

        button.disabled = false;
        button.textContent =
            button.id === "settingsLogout" ? "Sign Out" : "Log Out";

        console.error("Logout error:", error);
    }
}


/* ========================================
   NEW PROJECT MODAL CONTROLS
======================================== */

const newProjectButton = document.getElementById("newProjectButton");
newProjectButton.hidden = currentUserRole === "member";
const projectModal = document.getElementById("projectModal");
const closeProjectModal = document.getElementById("closeProjectModal");
const cancelProjectButton = document.getElementById("cancelProjectButton");
const projectModalOverlay = document.getElementById("projectModalOverlay");
const newProjectForm = document.getElementById("newProjectForm");
const projectNameInput = document.getElementById("projectName");
const projectDescriptionInput =
    document.getElementById("projectDescription");
const projectStatusInput = document.getElementById("projectStatus");
const projectFormFeedback =
    document.getElementById("projectFormFeedback");
const saveProjectButton =
    document.getElementById("saveProjectButton");

// Stores the ID when editing; null means we are creating a project.
let editingProjectId = null;

function setProjectModalMode(isEditing) {
    const modalHeading = projectModal?.querySelector("h2, h3");

    if (modalHeading) {
        modalHeading.textContent = isEditing
            ? "Edit Project"
            : "New Project";
    }

    if (saveProjectButton) {
        saveProjectButton.textContent = isEditing
            ? "Save Changes"
            : "Create Project";
    }
}

function openProjectModal() {
    if (currentUserRole === "member") return;

    if (!projectModal) return;

    editingProjectId = null;

    if (newProjectForm) newProjectForm.reset();

    if (projectFormFeedback) {
        projectFormFeedback.textContent = "";
    }

    setProjectModalMode(false);

    projectModal.classList.add("is-open");
    projectModal.setAttribute("aria-hidden", "false");

    if (projectNameInput) projectNameInput.focus();
}

function openEditProjectModal(project) {
    if (!projectModal) return;

    editingProjectId = project.id;

    projectNameInput.value = project.name;
    projectDescriptionInput.value = project.description || "";
    projectStatusInput.value = project.status;

    if (projectFormFeedback) {
        projectFormFeedback.textContent = "";
    }

    setProjectModalMode(true);

    projectModal.classList.add("is-open");
    projectModal.setAttribute("aria-hidden", "false");

    projectNameInput.focus();
}

function closeProjectModalWindow() {
    if (!projectModal) return;

    projectModal.classList.remove("is-open");
    projectModal.setAttribute("aria-hidden", "true");

    editingProjectId = null;

    if (newProjectForm) newProjectForm.reset();

    if (projectFormFeedback) {
        projectFormFeedback.textContent = "";
    }

    setProjectModalMode(false);
}

if (newProjectButton) {
    newProjectButton.addEventListener("click", openProjectModal);
}

if (closeProjectModal) {
    closeProjectModal.addEventListener("click", closeProjectModalWindow);
}

if (cancelProjectButton) {
    cancelProjectButton.addEventListener("click", closeProjectModalWindow);
}

if (projectModalOverlay) {
    projectModalOverlay.addEventListener("click", closeProjectModalWindow);
}

if (newProjectForm) {
    newProjectForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const projectName = projectNameInput.value.trim();
        const projectDescription = projectDescriptionInput.value.trim();
        const projectStatus = projectStatusInput.value;
        const isEditing = editingProjectId !== null;

        if (!projectName) {
            projectFormFeedback.textContent =
                "Please enter a project name.";
            projectFormFeedback.style.color = "#b42318";
            projectNameInput.focus();
            return;
        }

       

        projectFormFeedback.textContent = "";
        saveProjectButton.disabled = true;
        saveProjectButton.textContent = isEditing
            ? "Saving changes..."
            : "Creating project...";

        try {
            const { data: userData, error: userError } =
                await supabaseClient.auth.getUser();

            if (userError) throw userError;

            if (!userData.user) {
                window.location.replace("login.html");
                return;
            }

             // CHECK THE PROJECT LIMIT BEFORE CREATING A PROJECT

            if (!isEditing && currentUserRole === "owner") {
                const projectLimits = {
                    free: 2,
                    pro: 20,
                    team: Infinity
                };

                const projectLimit = projectLimits[currentUserPlan] ?? 2;

                const { count, error: countError } = await supabaseClient
                    .from("projects")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", currentWorkspaceOwnerId);

                if (countError) {
                    projectFormFeedback.textContent =
                        "Unable to check your project limit. Please try again.";
                    projectFormFeedback.style.color = "#b42318";
                    return;
                }

                if (count >= projectLimit) {
                    const upgradePlan =
                        currentUserPlan === "free" ? "Pro" : "Team";

                    projectFormFeedback.textContent =
                        currentUserPlan === "team"
                            ? "You have reached your project limit."
                            : `You've reached your ${currentUserPlan.toUpperCase()} plan limit. Upgrade to ${upgradePlan} to create more.`;

                    projectFormFeedback.style.color = "#b42318";
                    return;
                }
            }

            let projectQuery;

            if (isEditing) {
                // Update the existing project.
                projectQuery = await supabaseClient
                    .from("projects")
                    .update({
                        name: projectName,
                        description: projectDescription,
                        status: projectStatus
                    })
                    .eq("id", editingProjectId)
                    .eq("user_id", currentWorkspaceOwnerId);
            } else {
                // Create a new project.
                projectQuery = await supabaseClient
                    .from("projects")
                    .insert({
                        user_id: currentWorkspaceOwnerId,
                        name: projectName,
                        description: projectDescription,
                        status: projectStatus
                    });
            }

            if (projectQuery.error) throw projectQuery.error;

            projectFormFeedback.textContent = isEditing
                ? "Project updated successfully!"
                : "Project created successfully!";

            projectFormFeedback.style.color = "#146c43";

            editingProjectId = null;

            await loadDashboardProjects();

            setTimeout(function () {
                closeProjectModalWindow();
            }, 1000);

        } catch (error) {
            console.error("Saving project error:", error);

            projectFormFeedback.textContent =
                error.message || "Unable to save the project.";

            projectFormFeedback.style.color = "#b42318";

        } finally {
            saveProjectButton.disabled = false;

            saveProjectButton.textContent = isEditing
                ? "Save Changes"
                : "Create Project";
        }
    });
}

/* ========================================
   LOAD PROJECTS INTO THE DASHBOARD
======================================== */

async function loadDashboardProjects() {
    const tableBody = document.getElementById("projectTableBody");
    const totalProjectsElement = document.getElementById("totalProjects");
    const activeProjectsElement = document.getElementById("activeProjects");

    if (!tableBody) return;

    try {
        // GET THE CURRENTLY LOGGED-IN USER
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            window.location.replace("login.html");
            return;
        }

        const currentUserId = userData.user.id;

        // FETCH THE USER'S PROJECTS
        const { data: projects, error: projectsError } =
            await supabaseClient
                .from("projects")
                .select("id, name, status, created_at")
                .eq("user_id", currentWorkspaceOwnerId)
                .order("created_at", { ascending: false });

                console.log("Projects returned:", projects);
                console.log("Projects query error:", projectsError);
                console.log("Workspace owner ID:", currentWorkspaceOwnerId);

        if (projectsError) throw projectsError;

        // CLEAR THE EXISTING TABLE ROWS
        tableBody.replaceChildren();

        // DISPLAY A MESSAGE IF THERE ARE NO PROJECTS
        if (!projects || projects.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 4;
            cell.textContent =
                "No projects yet. Click + New Project to begin.";

            row.appendChild(cell);
            tableBody.appendChild(row);
        } else {

            // DISPLAY EACH PROJECT
            for (const project of projects) {
                const row = document.createElement("tr");

                // PROJECT NAME
                const nameCell = document.createElement("td");
                nameCell.textContent = project.name;

                // PROJECT STATUS
                const statusCell = document.createElement("td");
                statusCell.textContent = project.status;

                // CALCULATE PROJECT PROGRESS FROM ITS TASKS
                const progressCell = document.createElement("td");

                const { data: projectTasks, error: progressError } =
                    await supabaseClient
                        .from("tasks")
                        .select("status")
                        .eq("project_id", project.id)
                        .eq("user_id", currentWorkspaceOwnerId);

                if (progressError) throw progressError;

                const tasks = projectTasks || [];

                const totalTasks = tasks.length;

                const completedCount = tasks.filter(function (task) {
                    return task.status === "Completed";
                }).length;

                const progress = totalTasks === 0
                    ? 0
                    : Math.round(
                        (completedCount / totalTasks) * 100
                    );

                // Create the progress bar container
                const progressContainer = document.createElement("div");
                progressContainer.className = "progress";
                progressContainer.style.height = "8px";
                progressContainer.style.minWidth = "100px";

                // Create the progress bar
                const progressBar = document.createElement("div");
                progressBar.className = "progress-bar";
                progressBar.style.width = progress + "%";
                progressBar.setAttribute("role", "progressbar");
                progressBar.setAttribute("aria-valuenow", progress);
                progressBar.setAttribute("aria-valuemin", "0");
                progressBar.setAttribute("aria-valuemax", "100");
                progressBar.setAttribute(
                    "aria-label",
                    project.name + " progress"
                );

                // Add the bar to its container
                progressContainer.appendChild(progressBar);

                // Display the percentage beside the bar
                const progressText = document.createElement("span");
                progressText.textContent = progress + "%";
                progressText.className = "small";

                // Display both in the table cell
                progressCell.append(progressContainer, progressText);

                // ACTIONS CELL
                const actionsCell = document.createElement("td");

                if (currentUserRole === "member") {
                    actionsCell.hidden = true;
                }

                // DELETE BUTTON
                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.textContent = "Delete";
                deleteButton.className =
                    "btn btn-sm btn-outline-danger";

                deleteButton.addEventListener("click", async function () {
                    const confirmed = await showConfirmation(
                      `Are you sure you want to delete "${project.name}"?`,
                      "Delete project",
                      "Delete"
                  );

                    if (!confirmed) return;

                    deleteButton.disabled = true;
                    deleteButton.textContent = "Deleting...";

                    try {
                        const { error: deleteError } =
                            await supabaseClient
                                .from("projects")
                                .delete()
                                .eq("id", project.id)
                                .eq("user_id", currentWorkspaceOwnerId);

                        if (deleteError) throw deleteError;

                        // REFRESH THE PROJECTS AND TASKS
                        await loadDashboardProjects();
                        await loadDashboardTasks();

                    } catch (error) {
                        console.error(
                            "Delete project error:",
                            error
                        );

                        showNotification(
                          error.message ||
                          "Unable to delete this project. Please try again.",
                            "error"
                      );

                        deleteButton.disabled = false;
                        deleteButton.textContent = "Delete";
                    }
                });

                // EDIT BUTTON
                const editButton = document.createElement("button");

                editButton.type = "button";
                editButton.textContent = "Edit";
                editButton.className =
                    "btn btn-sm btn-outline-primary me-2";

                editButton.addEventListener("click", function () {
                    openEditProjectModal(project);
                });

                // ADD BUTTONS TO THE ACTIONS CELL
                actionsCell.append(editButton, deleteButton);

                // ADD ALL CELLS TO THE ROW
                row.append(
                    nameCell,
                    statusCell,
                    progressCell,
                    actionsCell
                );

                // ADD THE ROW TO THE TABLE
                tableBody.appendChild(row);
            }
        }

        // UPDATE TOTAL PROJECTS
        if (totalProjectsElement) {
            totalProjectsElement.textContent = projects.length;
        }

        // UPDATE ACTIVE PROJECTS
        if (activeProjectsElement) {
            activeProjectsElement.textContent =
                projects.filter(function (project) {
                    return project.status === "In Progress";
                }).length;
        }

    } catch (error) {
        console.error("Loading projects error:", error);

        tableBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent =
            "Unable to load projects. Please refresh the page.";

        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

/* ========================================
   NEW TASK FORM CONTROLS
======================================== */

const newTaskButton = document.getElementById("newTaskButton");
newTaskButton.hidden = currentUserRole === "member";
const newTaskForm = document.getElementById("newTaskForm");
const cancelTaskButton = document.getElementById("cancelTaskButton");
const taskTitleInput = document.getElementById("taskTitle");

if (newTaskButton && newTaskForm) {
    newTaskButton.addEventListener("click", function () {
        if (currentUserRole === "member") return;
        newTaskForm.hidden = false;
        newTaskButton.hidden = true;

        if (taskTitleInput) {
            taskTitleInput.focus();
        }
    });
}

if (cancelTaskButton && newTaskForm) {
    cancelTaskButton.addEventListener("click", function () {
        newTaskForm.reset();

        // Exit edit mode
        window.editingTaskId = null;

        newTaskForm.hidden = true;

        if (newTaskButton) {
            newTaskButton.hidden = false;
        }

        // Restore the button label
        const saveButton = document.getElementById("saveTaskButton");
        if (saveButton) {
            saveButton.textContent = "Save Task";
        }

        const feedback = document.getElementById("taskFormFeedback");

        if (feedback) {
            feedback.textContent = "";
        }
    });
}


/* ========================================
   SAVE AND UPDATE TASKS IN SUPABASE
======================================== */

const taskForm = document.getElementById("newTaskForm");

if (taskForm) {
    taskForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = document.getElementById("taskTitle").value.trim();
        const description =
            document.getElementById("taskDescription").value.trim();
        const projectId = document.getElementById("taskProject").value;
        const status = document.getElementById("taskStatus").value;
        const dueDate = document.getElementById("taskDueDate").value;

        const feedback = document.getElementById("taskFormFeedback");
        const saveButton = document.getElementById("saveTaskButton");

        // Check whether we are creating or editing a task
        const editingTaskId = window.editingTaskId || null;
        const isEditing = Boolean(editingTaskId);

        if (!title || !projectId) {
            feedback.textContent =
                "Please enter a task title and choose a project.";
            feedback.style.color = "#b42318";
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = isEditing
            ? "Updating task..."
            : "Saving task...";

        feedback.textContent = "";

        try {
            const { data: userData, error: userError } =
                await supabaseClient.auth.getUser();

            if (userError) throw userError;

            
            if (!userData.user) {
                window.location.replace("login.html");
                return;
            }

            // CHECK THE TASK LIMIT BEFORE CREATING A NEW TASK
            if (!isEditing && currentUserRole === "owner") {
                const taskLimits = {
                    free: 20,
                    pro: Infinity,
                    team: Infinity
                };

                const taskLimit = taskLimits[currentUserPlan] ?? 20;

                const { count, error: countError } = await supabaseClient
                    .from("tasks")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", currentWorkspaceOwnerId);

                if (countError) {
                    feedback.textContent =
                        "Unable to check your task limit. Please try again.";
                    feedback.style.color = "#b42318";
                    return;
                }

                if (count >= taskLimit) {
                    feedback.textContent =
                        `You've reached your ${currentUserPlan.toUpperCase()} plan task limit. Upgrade to Pro to create more.`;
                    feedback.style.color = "#b42318";
                    return;
                }
            }

            let taskError;


            if (isEditing) {
                // UPDATE THE EXISTING TASK
                const { error } = await supabaseClient
                    .from("tasks")
                    .update({
                        project_id: projectId,
                        title: title,
                        description: description,
                        status: status,
                        due_date: dueDate || null
                    })
                    .eq("id", editingTaskId)
                    .eq("user_id", currentWorkspaceOwnerId);

                taskError = error;

            } else {
                // CREATE A NEW TASK
                const { error } = await supabaseClient
                    .from("tasks")
                    .insert({
                        user_id: currentWorkspaceOwnerId,
                        project_id: projectId,
                        title: title,
                        description: description,
                        status: status,
                        due_date: dueDate || null
                    });

                taskError = error;
            }

            if (taskError) throw taskError;

            feedback.textContent = isEditing
                ? "Task updated successfully!"
                : "Task saved successfully!";

            feedback.style.color = "#146c43";

            taskForm.reset();

            // Clear edit mode
            window.editingTaskId = null;

            await loadDashboardTasks();

            setTimeout(function () {
                taskForm.hidden = true;

                const newTaskButton =
                    document.getElementById("newTaskButton");

                if (newTaskButton) {
                    newTaskButton.hidden = false;
                }

                feedback.textContent = "";
            }, 1000);

        } catch (error) {
            console.error("Saving or updating task error:", error);

            feedback.textContent =
                error.message || "Unable to save the task.";

            feedback.style.color = "#b42318";

        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Task";
        }
    });
}



/* ========================================
   LOAD TASKS INTO THE DASHBOARD
======================================== */

async function loadDashboardTasks() {
    const taskList = document.getElementById("taskList");

    if (!taskList) return;

    if (!currentWorkspaceOwnerId) {
        console.error(
            "Cannot load tasks: currentWorkspaceOwnerId is missing."
        );
        return;
    }

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            window.location.replace("login.html");
            return;
        }

        const { data: tasks, error: tasksError } =
            await supabaseClient
                .from("tasks")
                .select("id, title, description, status, due_date, project_id")
                .eq("user_id", currentWorkspaceOwnerId)
                .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;

        // FILTER TASKS BY STATUS
const statusFilter = document.getElementById("taskStatusFilter");
const selectedStatus = statusFilter ? statusFilter.value : "All";

const filteredTasks = (tasks || []).filter(function (task) {
    return selectedStatus === "All" || task.status === selectedStatus;
});

        taskList.replaceChildren();

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No tasks have been added yet.";
            taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(function (task) {
            const taskCard = document.createElement("div");
            taskCard.className = "task-item";

            const taskTitle = document.createElement("h3");
            taskTitle.textContent = task.title;

            const taskDescription = document.createElement("p");
            taskDescription.textContent =
                task.description || "No description provided.";

            const taskStatus = document.createElement("p");
            taskStatus.textContent = "Status: " + task.status;

            const projectName = document.createElement("p");
            projectName.textContent = "Loading project...";

            const dueDate = document.createElement("p");

            if (task.due_date) {
                dueDate.textContent = "Due: " + task.due_date;
            } else {
                dueDate.textContent = "No deadline";
            }

           // CREATE THE COMPLETION BUTTON
const completeButton = document.createElement("button");
completeButton.hidden = currentUserRole === "member";
completeButton.type = "button";
completeButton.className = "btn btn-sm btn-outline-success";

if (task.status === "Completed") {
    completeButton.textContent = "Completed ✓";
    completeButton.disabled = true;
} else {
    completeButton.textContent = "Mark as Completed";
}

completeButton.addEventListener("click", async function () {
    completeButton.disabled = true;
    completeButton.textContent = "Updating...";

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            window.location.replace("login.html");
            return;
        }

        const { error: updateError } = await supabaseClient
            .from("tasks")
            .update({ status: "Completed" })
            .eq("id", task.id) 
            .eq("user_id", currentWorkspaceOwnerId);

        if (updateError) throw updateError;

        await loadDashboardTasks();

    } catch (error) {
    console.error("Completing task error:", error);

    showNotification(
        error.message || "Unable to update the task. Please try again.",
        "error"
    );

    completeButton.disabled = false;
    completeButton.textContent = "Mark as Completed";
 }
});

  // HANDLE TASK STATUS FILTER
const taskStatusFilter = document.getElementById("taskStatusFilter");

if (taskStatusFilter) {
    taskStatusFilter.addEventListener("change", function () {
        loadDashboardTasks();
    });
}


// CREATE THE EDIT BUTTON
const editTaskButton = document.createElement("button");
editTaskButton.hidden = currentUserRole === "member";
editTaskButton.type = "button";
editTaskButton.className = "btn btn-sm btn-outline-primary";
editTaskButton.textContent = "Edit";

editTaskButton.addEventListener("click", function () {
    // Remember which task is being edited
    window.editingTaskId = task.id;

    // Fill the form with the task's existing details
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value =
        task.description || "";
    document.getElementById("taskProject").value = task.project_id;
    document.getElementById("taskStatus").value = task.status;
    document.getElementById("taskDueDate").value = task.due_date || "";

    // Show the form
    const taskForm = document.getElementById("newTaskForm");
    const newTaskButton = document.getElementById("newTaskButton");
    const saveTaskButton = document.getElementById("saveTaskButton");

    taskForm.hidden = false;
    newTaskButton.hidden = true;
    saveTaskButton.textContent = "Update Task";

    document.getElementById("taskFormFeedback").textContent = "";

    document.getElementById("taskTitle").focus();
});


// CREATE THE DELETE BUTTON
    const deleteTaskButton = document.createElement("button");
    deleteTaskButton.hidden = currentUserRole === "member";
    deleteTaskButton.type = "button";
    deleteTaskButton.className = "btn btn-sm btn-outline-danger";
    deleteTaskButton.textContent = "Delete";

      deleteTaskButton.addEventListener("click", async function () {
          const confirmed = await showConfirmation(
            "Are you sure you want to delete this task?",
            "Delete task",
            "Delete"
        );
          if (!confirmed) return;

          deleteTaskButton.disabled = true;
          deleteTaskButton.textContent = "Deleting...";

          try {
              const { data: userData, error: userError } =
                  await supabaseClient.auth.getUser();

              if (userError) throw userError;

              if (!userData.user) {
                  window.location.replace("login.html");
                  return;
              }

              const { error: deleteError } = await supabaseClient
                  .from("tasks")
                  .delete()
                  .eq("id", task.id)
                  .eq("user_id", userData.user.id);

              if (deleteError) throw deleteError;

              await loadDashboardTasks();

          } catch (error) {
              console.error("Deleting task error:", error);

             showNotification(
              error.message || "Unable to delete the task. Please try again.",
              "error"
          );
   

              deleteTaskButton.disabled = false;
              deleteTaskButton.textContent = "Delete";
          }
      });


      // ADD EVERYTHING TO THE TASK CARD
      taskCard.append(
          taskTitle,
          taskDescription,
          taskStatus,
          projectName,
          dueDate,
          completeButton,
          editTaskButton,
          deleteTaskButton
      );

      taskList.appendChild(taskCard);

                        // Find the name of the project linked to this task.
                        supabaseClient
                            .from("projects")
                            .select("name")
                            .eq("id", task.project_id)
                            .eq("user_id", currentWorkspaceOwnerId)
                            .single()
                            .then(function (result) {
                                if (result.error) {
                                    projectName.textContent = "Project unavailable";
                                } else {
                                    projectName.textContent =
                                        "Project: " + result.data.name;
                                }
                            });
                    });

                } catch (error) {
                    console.error("Loading tasks error:", error);

                    taskList.replaceChildren();

                    const errorMessage = document.createElement("p");
                    errorMessage.textContent =
                        "Unable to load tasks. Please refresh the page.";

                    taskList.appendChild(errorMessage);
                }
            }

/* ========================================
   LOAD PROJECTS INTO THE TASK DROPDOWN
======================================== */

async function loadTaskProjects() {
    const projectDropdown = document.getElementById("taskProject");

    if (!projectDropdown) return;

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            window.location.replace("login.html");
            return;
        }

        const { data: projects, error: projectsError } =
            await supabaseClient
                .from("projects")
                .select("id, name")
                .eq("user_id", currentWorkspaceOwnerId)
                .order("created_at", { ascending: false });

        if (projectsError) throw projectsError;

        // Remove old options and restore the placeholder.
        projectDropdown.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose a project";
        projectDropdown.appendChild(placeholder);

        // Add each saved project to the dropdown.
        projects.forEach(function (project) {
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent = project.name;

            projectDropdown.appendChild(option);
        });

        if (projects.length === 0) {
            placeholder.textContent = "Create a project first";
        }

    } catch (error) {
        console.error("Loading task projects error:", error);

        const feedback = document.getElementById("taskFormFeedback");

        if (feedback) {
            feedback.textContent =
                "Unable to load projects. Please refresh the page.";
            feedback.style.color = "#b42318";
        }
    }
}


/* ========================================
   UPDATE TASK DASHBOARD STATISTICS
======================================== */

async function loadTaskStatistics() {
    const completedTasksElement =
        document.getElementById("completedTasks");

    const pendingTasksElement =
        document.getElementById("pendingTasks");

    const inProgressTasksElement =
        document.getElementById("inProgressTasks");

    if (
        !completedTasksElement ||
        !pendingTasksElement ||
        !inProgressTasksElement
    ) {
        return;
    }

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            window.location.replace("login.html");
            return;
        }

        const { data: tasks, error: tasksError } =
            await supabaseClient
                .from("tasks")
                .select("status")
                .eq("user_id", currentWorkspaceOwnerId)

        if (tasksError) throw tasksError;

        const completedCount = tasks.filter(function (task) {
            return task.status === "Completed";
        }).length;

        const pendingCount = tasks.filter(function (task) {
            return task.status === "Pending";
        }).length;

        const inProgressCount = tasks.filter(function (task) {
            return task.status === "In Progress";
        }).length;

        completedTasksElement.textContent = completedCount;
        pendingTasksElement.textContent = pendingCount;
        inProgressTasksElement.textContent = inProgressCount;

    } catch (error) {
    console.error("Loading task statistics error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
    });
}
}


// ========== CUSTOM NOTIFICATIONS ==========

function showNotification(message, type = "success") {
    const container = document.getElementById("notificationContainer");

    if (!container) {
        console.log(message);
        return;
    }

    const notification = document.createElement("div");
    notification.className = `app-notification ${type}`;
    notification.textContent = message;

    notification.setAttribute(
        "role",
        type === "error" ? "alert" : "status"
    );

    container.appendChild(notification);

    setTimeout(function () {
        notification.remove();
    }, 3500);
}


// ========== CUSTOM CONFIRMATION DIALOG ==========

function showConfirmation(
    message,
    title = "Are you sure?",
    confirmLabel = "Confirm"
) {
    return new Promise(function (resolve) {
        const modal = document.getElementById("confirmationModal");
        const titleElement = document.getElementById("confirmationTitle");
        const messageElement = document.getElementById("confirmationMessage");
        const cancelButton = document.getElementById("cancelConfirmation");
        const confirmButton = document.getElementById("confirmAction");

        if (
            !modal ||
            !titleElement ||
            !messageElement ||
            !cancelButton ||
            !confirmButton
        ) {
            resolve(window.confirm(message));
            return;
        }

        titleElement.textContent = title;
        messageElement.textContent = message;
        confirmButton.textContent = confirmLabel;

        modal.hidden = false;
        cancelButton.focus();

        function finish(result) {
            modal.hidden = true;

            cancelButton.removeEventListener("click", cancelHandler);
            confirmButton.removeEventListener("click", confirmHandler);
            modal.removeEventListener("click", backdropHandler);
            document.removeEventListener("keydown", escapeHandler);

            confirmButton.textContent = "Confirm";

            resolve(result);
        }

        function cancelHandler() {
            finish(false);
        }

        function confirmHandler() {
            finish(true);
        }

        function backdropHandler(event) {
            if (event.target === modal) {
                finish(false);
            }
        }

        function escapeHandler(event) {
            if (event.key === "Escape" && !modal.hidden) {
                finish(false);
            }
        }

        cancelButton.addEventListener("click", cancelHandler);
        confirmButton.addEventListener("click", confirmHandler);
        modal.addEventListener("click", backdropHandler);
        document.addEventListener("keydown", escapeHandler);
    });
}


// ========== DASHBOARD SECTION NAVIGATION ==========

const dashboardNavLinks = document.querySelectorAll(".dashboard-nav a");

const dashboardSections = [
    document.getElementById("overview"),
    document.getElementById("projects"),
    document.getElementById("tasks"),
    document.getElementById("team"),
    document.getElementById("settings")
].filter(Boolean);

dashboardNavLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
        const targetId = link.getAttribute("href").slice(1);
        const targetSection = document.getElementById(targetId);

        // Ignore links that don't target a dashboard section.
        if (!targetSection) return;

        event.preventDefault();

        // Hide all dashboard sections.
        dashboardSections.forEach(function (section) {
            section.hidden = true;
        });

        // Show the selected section.
        targetSection.hidden = false;

        if (targetId === "team") {
          loadTeamMembers();
       }

        // Update the active navigation link.
        dashboardNavLinks.forEach(function (navLink) {
            navLink.classList.remove("active");
        });

        link.classList.add("active");

        // Start the selected section at the top.
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});


// ========== SETTINGS: RESET PASSWORD ==========

const settingsResetPasswordButton =
    document.getElementById("settingsResetPassword");

if (settingsResetPasswordButton) {
    settingsResetPasswordButton.addEventListener(
        "click",
        async function () {
            const originalText = settingsResetPasswordButton.textContent;

            settingsResetPasswordButton.disabled = true;
            settingsResetPasswordButton.textContent = "Sending...";

            try {
                const { data: userData, error: userError } =
                    await supabaseClient.auth.getUser();

                if (userError) {
                    throw userError;
                }

                const email = userData.user?.email;

                if (!email) {
                    showNotification(
                        "Unable to find your account email. Please sign in again.",
                        "error"
                    );
                    return;
                }

                const { error } =
                    await supabaseClient.auth.resetPasswordForEmail(
                        email,
                        {
                            redirectTo:
                                window.location.origin +
                                "/reset-password.html"
                        }
                    );

                if (error) {
                    throw error;
                }

                showNotification(
                    "If your account is eligible, a password reset email will be sent.",
                    "success"
                );

            } catch (error) {
                console.error("Settings password reset error:", error);

                showNotification(
                    error.message ||
                    "Unable to send the password reset email. Please try again.",
                    "error"
                );

            } finally {
                settingsResetPasswordButton.disabled = false;
                settingsResetPasswordButton.textContent = originalText;
            }
        }
    );
}


// ========== PROFILE SETTINGS ==========

const profileSettingsForm =
    document.getElementById("profileSettingsForm");

if (profileSettingsForm) {
    const profileNameInput =
        document.getElementById("profileName");

    const profileEmailInput =
        document.getElementById("profileEmail");

    const saveProfileButton =
        document.getElementById("saveProfileButton");

    const profileFeedback =
        document.getElementById("profileFeedback");


    // Load the current user's profile information
    async function loadProfileSettings() {
        try {
            const { data, error } =
                await supabaseClient.auth.getUser();

            if (error) throw error;

            if (!data.user) {
                window.location.replace("login.html");
                return;
            }

            profileEmailInput.value = data.user.email || "";

            profileNameInput.value =
                data.user.user_metadata?.full_name || "";

                document.getElementById("accountCreated").value =
                  data.user.created_at
                      ? new Date(data.user.created_at).toLocaleDateString()
                      : "Unavailable";

        } catch (error) {
            console.error("Load profile error:", error);

            showNotification(
                "Unable to load your profile. Please refresh the page.",
                "error"
            );
        }
    }


    // Save the user's profile name
    profileSettingsForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const fullName = profileNameInput.value.trim();

            if (!fullName) {
                profileFeedback.textContent =
                    "Please enter your full name.";
                profileFeedback.className =
                    "mt-3 text-danger";
                return;
            }

            saveProfileButton.disabled = true;
            saveProfileButton.textContent = "Saving...";

            try {
                const { data, error } =
                    await supabaseClient.auth.updateUser({
                        data: {
                            full_name: fullName
                        }
                    });

                if (error) throw error;

                profileNameInput.value =
                    data.user.user_metadata?.full_name || fullName;

                profileFeedback.textContent =
                    "Your profile has been updated successfully.";

                profileFeedback.className =
                    "mt-3 text-success";

                showNotification(
                    "Profile updated successfully.",
                    "success"
                );

            } catch (error) {
                console.error("Save profile error:", error);

                profileFeedback.textContent =
                    error.message ||
                    "Unable to save your profile. Please try again.";

                profileFeedback.className =
                    "mt-3 text-danger";

            } finally {
                saveProfileButton.disabled = false;
                saveProfileButton.textContent = "Save Profile";
            }
        }
    );


    // Load profile information when the page initializes
    loadProfileSettings();
}


// UPDATE EMAIL ADDRESS

const updateEmailForm = document.getElementById("updateEmailForm");

if (updateEmailForm) {
    const newEmailInput = document.getElementById("newEmail");
    const updateEmailButton = document.getElementById("updateEmailButton");
    const emailUpdateFeedback = document.getElementById("emailUpdateFeedback");

    updateEmailForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const newEmail = newEmailInput.value.trim();

        if (!newEmail) {
            emailUpdateFeedback.textContent = "Please enter your new email address.";
            emailUpdateFeedback.className = "mt-3 text-danger";
            return;
        }

        updateEmailButton.disabled = true;
        updateEmailButton.textContent = "Updating...";

        try {
            const { data, error } = await supabaseClient.auth.updateUser({
                email: newEmail
            });

            if (error) {
                throw error;
            }

            emailUpdateFeedback.textContent =
                "Confirmation instructions have been sent if required. Check your email inboxes to complete the change.";
            emailUpdateFeedback.className = "mt-3 text-success";

            showNotification(
                "Email update requested successfully.",
                "success"
            );

            newEmailInput.value = "";
        } catch (error) {
            console.error("Email update error:", error);

            emailUpdateFeedback.textContent =
                error.message || "Unable to update your email. Please try again.";
            emailUpdateFeedback.className = "mt-3 text-danger";

            showNotification(
                "Unable to update your email.",
                "error"
            );
        } finally {
            updateEmailButton.disabled = false;
            updateEmailButton.textContent = "Update Email";
        }
    });
}



 
     
    // TEAM INVITATION FORM VISIBILITY

    const inviteTeamMemberButton = document.getElementById(
        "inviteTeamMemberButton"
    );

    const inviteMemberFormContainer = document.getElementById(
        "inviteMemberFormContainer"
    );

    const inviteMemberForm = document.getElementById(
        "inviteMemberForm"
    );

    const cancelTeamInvitationButton = document.getElementById(
        "cancelTeamInvitationButton"
    );


    // CHECK TEAM MANAGEMENT PERMISSION

    
    // UPDATE INVITATION BUTTON VISIBILITY

    function updateInviteButtonVisibility() {
        const canManageTeam =
            currentUserRole === "owner" ||
            currentUserRole === "admin";

        if (inviteTeamMemberButton) {
            inviteTeamMemberButton.hidden = !canManageTeam;
            inviteTeamMemberButton.disabled = false;
        }
    }

    // SET INITIAL VISIBILITY
      updateInviteButtonVisibility();

    // KEEP THE INVITATION FORM CLOSED INITIALLY
      if (inviteMemberFormContainer) {
         inviteMemberFormContainer.hidden = true;
    }


        console.log("Current user role:", currentUserRole);
        console.log("Current user plan:", currentUserPlan);
       console.log(
        "Can manage team:",
        currentUserRole === "owner" ||
        currentUserRole === "admin"
    );
        console.log(
            "Invite button found:",
            Boolean(inviteTeamMemberButton)
        );

    // SHOW INVITE BUTTON TO OWNERS AND ADMINS

    if (inviteTeamMemberButton) {
        inviteTeamMemberButton.hidden = !(
            currentUserRole === "owner" ||
            currentUserRole === "admin"
        );

        inviteTeamMemberButton.disabled = false;
    }


    // KEEP INVITATION FORM HIDDEN INITIALLY

    if (inviteMemberFormContainer) {
        inviteMemberFormContainer.hidden = true;
    }


    // OPEN AND CLOSE THE INVITATION FORM

    if (
        inviteTeamMemberButton &&
        inviteMemberFormContainer &&
        inviteMemberForm &&
        cancelTeamInvitationButton
    ) {

        // OPEN THE FORM

        inviteTeamMemberButton.addEventListener("click", function () {

           if (
                currentUserRole !== "owner" &&
                currentUserRole !== "admin"
            ) {
                return;
            }

            // FREE PLAN: ASK USER TO UPGRADE

            if (currentUserPlan === "free") {
                showNotification(
                    "Upgrade to Pro to invite team members.",
                    "error"
                );
                return;
            }

            // PRO AND TEAM PLANS: OPEN THE FORM

            inviteMemberFormContainer.hidden = false;
            inviteTeamMemberButton.disabled = true;

            const firstInput =
                inviteMemberForm.querySelector("input");

            if (firstInput) {
                firstInput.focus();
            }
        });


        // CANCEL THE INVITATION

        cancelTeamInvitationButton.addEventListener("click", function () {

            inviteMemberFormContainer.hidden = true;
            inviteTeamMemberButton.disabled = false;
            inviteMemberForm.reset();

        });

    }





// SAVE TEAM MEMBERS TO SUPABASE

const teamInvitationForm = document.getElementById("inviteMemberForm");

if (teamInvitationForm) {
    const inviteNameInput = document.getElementById("inviteMemberName");
    const inviteEmailInput = document.getElementById("inviteMemberEmail");
    const inviteRoleInput = document.getElementById("inviteMemberRole");
    const inviteFeedback = document.getElementById("inviteMemberFeedback");
    const sendInvitationButton = document.getElementById("sendTeamInvitationButton");
    const inviteContainer = document.getElementById("inviteMemberFormContainer");
    const inviteButton = document.getElementById("inviteTeamMemberButton");

    teamInvitationForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const memberName = inviteNameInput.value.trim();
        const memberEmail = inviteEmailInput.value.trim().toLowerCase();
        const memberRole = inviteRoleInput.value;

        if (!memberName || !memberEmail) {
            inviteFeedback.textContent =
                "Please enter the member's name and email.";
            inviteFeedback.className = "mt-3 text-danger";
            return;
        }

        sendInvitationButton.disabled = true;
        sendInvitationButton.textContent = "Saving...";

        try {
            const { data: userData, error: userError } =
                await supabaseClient.auth.getUser();

            if (userError) throw userError;

            if (!userData.user) {
                throw new Error("Please sign in again.");
            }

           // SEND INVITATION THROUGH THE EDGE FUNCTION

            const { data, error } = await supabaseClient.functions.invoke(
                "smooth-handler",
                {
                    body: {
                        name: memberName,
                        email: memberEmail,
                        role: memberRole,
                        workspace_owner_id: currentWorkspaceOwnerId
                    }
                }
            );

            if (error) {
                let message = error.message;

                if (error.context && typeof error.context.json === "function") {
                    try {
                        const details = await error.context.json();
                        if (details.error) message = details.error;
                        if (details.message) message = details.message;
                    } catch {
                        // Keep the original error message.
                    }
                }

                throw new Error(message);
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            inviteFeedback.textContent =
                "Invitation sent successfully! Ask the recipient to check their inbox.";
            inviteFeedback.className = "mt-3 text-success";

            showNotification("Invitation sent successfully!", "success");

            teamInvitationForm.reset();
            inviteContainer.hidden = true;
            inviteButton.disabled = false;

            await loadTeamMembers();

        } catch (error) {
            console.error("Save team member error:", error);

            inviteFeedback.textContent =
                error.message || "Unable to save the team member.";

            inviteFeedback.className = "mt-3 text-danger";

            showNotification("Unable to save the team member.", "error");

        } finally {
            sendInvitationButton.disabled = false;
            sendInvitationButton.textContent = "Send Invitation";
        }
    });
}


// LOAD TEAM MEMBERS FROM SUPABASE

async function loadTeamMembers() {
    const teamTableBody = document.getElementById("teamMembersTableBody");
    const teamMemberCount = document.getElementById("teamMemberCount");

    if (!teamTableBody || !teamMemberCount) {
        return;
    }

    teamTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4">
                Loading team members...
            </td>
        </tr>
    `;

    try {
        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!userData.user) {
            throw new Error("Please sign in to view your team.");
        }

        const { data: members, error } = await supabaseClient
            .from("team_members")
            .select("id, member_name, member_email, member_role, invitation_status, invited_at")
            .eq("workspace_owner_id", currentWorkspaceOwnerId)
            .order("invited_at", { ascending: false });

        if (error) throw error;

        teamMemberCount.textContent = members.length;

        if (members.length === 0) {
            teamTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <p class="mb-1">No team members yet.</p>
                        <small class="text-secondary">
                            Invite someone to start building your team.
                        </small>
                    </td>
                </tr>
            `;
            return;
        }

        teamTableBody.innerHTML = "";

        members.forEach(function (member) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = member.member_name;

            const emailCell = document.createElement("td");
            emailCell.textContent = member.member_email;

            const roleCell = document.createElement("td");
            roleCell.textContent =
                member.member_role === "admin"
                    ? "Administrator"
                    : "Member";

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className =
                member.invitation_status === "accepted"
                    ? "badge text-bg-success"
                    : "badge text-bg-secondary";

            statusBadge.textContent =
                member.invitation_status.charAt(0).toUpperCase() +
                member.invitation_status.slice(1);

            statusCell.appendChild(statusBadge);

            
            const workspaceCell = document.createElement("td");

            if (member.invitation_status === "accepted") {
                const viewWorkspaceButton = document.createElement("button");

                viewWorkspaceButton.type = "button";
                viewWorkspaceButton.className = "btn btn-sm btn-outline-primary";
                viewWorkspaceButton.textContent = "View Workspace";

                viewWorkspaceButton.addEventListener("click", function () {
                    // We will connect this button to workspace switching next.
                    showNotification(
                        "Workspace selection will be connected in the next step.",
                        "info"
                    );
                });

                workspaceCell.appendChild(viewWorkspaceButton);
            } else {
                workspaceCell.textContent = "Not available";
            }

            
           
            // ACTION COLUMN
            const actionCell = document.createElement("td");

            // Only workspace owners and administrators can remove members.
            if (
                currentUserRole === "owner" ||
                currentUserRole === "admin"
            ) {
                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className =
                    "btn btn-sm btn-outline-danger";
                removeButton.textContent = "Remove";

               
                removeButton.addEventListener("click", function () {
                    const modalElement = document.getElementById(
                        "removeTeamMemberModal"
                    );

                    const modalName = document.getElementById(
                        "removeTeamMemberName"
                    );

                    const confirmButton = document.getElementById(
                        "confirmRemoveTeamMemberButton"
                    );

                    modalName.textContent = member.member_name;

                    const removeModal = bootstrap.Modal.getOrCreateInstance(
                        modalElement
                    );

                    // Run the deletion only after confirmation.
                    confirmButton.onclick = async function () {
                        confirmButton.disabled = true;
                        confirmButton.textContent = "Removing...";

                        try {
                            const { data, error: removeError } =
                                await supabaseClient
                                    .from("team_members")
                                    .delete()
                                    .eq("id", member.id)
                                    .eq(
                                        "workspace_owner_id",
                                        currentWorkspaceOwnerId
                                    )
                                    .select("id");

                            if (removeError) throw removeError;

                            if (!data || data.length === 0) {
                                throw new Error(
                                    "No team member was removed. Check your permissions."
                                );
                            }

                            removeModal.hide();

                            showNotification(
                                `${member.member_name} was removed successfully.`,
                                "success"
                            );

                            await loadTeamMembers();
                        } catch (error) {
                            console.error("Remove team member error:", error);

                            showNotification(
                                error.message ||
                                    "Unable to remove this team member.",
                                "error"
                            );
                        } finally {
                            confirmButton.disabled = false;
                            confirmButton.innerHTML =
                                '<i class="bi bi-trash me-1"></i> Remove Member';
                        }
                    };

                    removeModal.show();
                });


                actionCell.appendChild(removeButton);
            } else {
                               actionCell.textContent = "—";
            }

            row.append(
                nameCell,
                emailCell,
                roleCell,
                statusCell,
                actionCell
            );

            teamTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Load team members error:", error);

        teamTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    Unable to load team members. Please refresh the page.
                </td>
            </tr>
        `;

        showNotification(
            "Unable to load team members.",
            "error"
        );
    }
}
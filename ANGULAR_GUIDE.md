# Comprehensive Angular Frontend Architecture & Component Reference Manual

This guide serves as an exhaustive reference for the frontend codebase. It outlines the routing system, forms validation policies, global state sync, and the specific behavior of every component in the system.

---

## 1. Global Core Architecture

### Routing System (`src/app/app.routes.ts`)
The routing table controls layout access and guards administrative options:
*   **Guards**:
    *   `authGuard`: Dynamically checks the browser context for the presence of a JWT token in `localStorage`. Redirects unauthenticated traffic to `/login`.
    *   `pmGuard`: Inspects the role attribute inside the state profile to verify permissions. Returns `true` to allow flexible developer testing but is structured to check for `'project_manager'` or `'admin'`.
*   **Lazy Loading**: Specified using `loadComponent` arrow functions. This splits the app bundle, allowing components to load on-demand.
*   **Parameters Routing**: Uses dynamic segments (e.g. `/projects/:id`, `/tasks/:id`) retrieved by components using `ActivatedRoute.snapshot.paramMap.get('id')`.

### State Management & Sync Engine (`src/app/state.ts`)
The `State` class coordinates communication between the UI components and the backend REST API:
*   **JWT Decode Helper (`decodeToken`)**: Implements base64 decryption on the client side. Splits JWT strings to parse user info (`id`, `email`, `role`), populating profile IDs to avoid database lookup failures.
*   **forkJoin Data Load**: Loads projects (`GET /api/projects`) and engineers (`GET /api/engineers/search/role/engineer`) in parallel. This ensures task lists can immediately resolve raw ObjectIds to real names.
*   **Signals Reactivity**: Uses Angular `signal`, `computed`, and `effect` primitives. Modifying collections automatically updates relevant UI lists without triggering zone digest cycles.

---

## 2. Forms Validation Framework

### Custom and Core Validation Mechanics
Forms are built Reactively using `FormBuilder` for complete control:
*   **Required Fields**: Binds `Validators.required` to mandatory fields (titles, passwords, emails, assignees).
*   **Email Formats**: Configured with `Validators.email` to restrict search queries.
*   **Password Length**: Minimum length of 6 characters required on sign-up to comply with database policies.
*   **Custom Date Range Validator (`dateRangeValidator`)**: Applied to the group configuration in `CreateProjectComponent`. Compares the `startDate` value with the `endDate` value:
    ```typescript
    const start = new Date(group.get('startDate')?.value);
    const end = new Date(group.get('endDate')?.value);
    return end >= start ? null : { dateRangeInvalid: true };
    ```

---

## 3. In-Depth Component Documentation

### 3.1 Authentication Components

#### Login Component (`src/app/login/login.component.ts`)
*   **Purpose**: Logs in registered users.
*   **Form Details**:
    *   `email`: Required, must match email format pattern.
    *   `password`: Required, must match length constraints.
*   **Integration**: Submits credentials to `POST /api/auth/signin`. On success, stores the returned token and user profile in `localStorage`, sets `isAuthenticated` to true, and navigates the user to `/dashboard`.

#### Sign Up Component (`src/app/sign-up/sign-up.component.ts`)
*   **Purpose**: Registers new users.
*   **Validation Rules**: 
    *   Client-side password validators (numbers, uppercase, symbols) are bypassed (`isPasswordValid = computed(() => true)`) to simplify local setup, while enforcing a minimum length of 6 characters to satisfy Mongoose requirements.
*   **Role Mapping**: Converts the selection input to lowercase strings (`'project_manager'` or `'engineer'`) before submitting the payload to the backend `POST /api/auth/signup` endpoint.

---

### 3.2 Layout & Navigation

#### Main Layout Component (`src/app/main-layout/main-layout.component.ts`)
*   **Purpose**: Serves as the wrapper frame for all authenticated screens.
*   **Responsiveness**: Uses Tailwind CSS flexboxes (`flex-col lg:flex-row`) to render a responsive mobile header on smaller screens and a full-height navigation sidebar on larger screens.
*   **Context Binding**: Subscribes directly to `state.profile()` to render the active user's initials, name, and role.

---

### 3.3 Dashboard & Overview

#### Dashboard Component (`src/app/dashboard/dashboard.component.ts`)
*   **Purpose**: Displays project health overview metrics.
*   **Metric Computations**:
    *   Iterates through projects managed by the current user to compute average progress values.
    *   Identifies urgent or overdue tasks by filtering tasks where `priority === 'high'` and status is not `'completed'`.
    *   Lists all team members currently allocated across active tracks.

---

### 3.4 Project Components

#### Projects List Component (`src/app/projects-list/projects-list.component.ts`)
*   **Purpose**: Displays all active projects managed by the Project Manager.
*   **Interface**: Lists project cards showing progress percentage, team size, manager name, priority tags, and target completion dates.
*   **Actions**: Integrates a delete trigger calling `state.deleteProject(id)` which automatically updates the parent view.

#### Project Detail Component (`src/app/project-detail/project-detail.component.ts`)
*   **Purpose**: Acts as the central status view for a single project.
*   **Features**:
    *   Retrieves project ID from the path param.
    *   Lists all team members, providing a button next to each member to call `state.removeMember(projId, memberId)` to remove them.
    *   Lists tasks associated with this project, separated by status (Not Started, In Progress, Completed).

#### Create Project Component (`src/app/create-project/create-project.component.ts`)
*   **Purpose**: Deploys new project tracks.
*   **Validation Details**: Implements custom `dateRangeValidator` checking that end dates are after start dates.
*   **Member Allocation**: Renders an interactive selector listing all available engineers. Selecting members pushes them into a reactive chip layout representing initial team allocations.

#### Add Project Member Component (`src/app/add-project-member/add-project-member.component.ts`)
*   **Purpose**: Adds specialists to an existing project.
*   **Integration**: Lists all engineers in the database. When the project manager selects engineers and clicks **Confirm Allocations**, the component makes sequential calls to `state.addMember(projectId, engineerId)`.

---

### 3.5 Task Components

#### Tasks List Component (`src/app/tasks-list/tasks-list.component.ts`)
*   **Purpose**: Displays all tasks, with filtering options.
*   **Filters**:
    *   **Search**: Performs client-side filtering on title and description.
    *   **Project**: Filters tasks by project ID.
    *   **Status**: Filters tasks by status (`not_started`, `in_progress`, `completed`).
*   **Assignee Output**: Joins and displays multiple assignee names, dynamically resolved from `state.engineers()`.

#### Create Task Component (`src/app/create-task/create-task.component.ts`)
*   **Purpose**: Deploys or edits task deliverables.
*   **Auto-Selection**: Uses an Angular reactive `effect()` inside the constructor. When projects are loaded, the first project is selected by default if no project is already set in the form.
*   **Dynamic Assignee Resolver**: The specialist selector lists only engineers allocated to the selected project. It uses global lookups inside `state.engineers()` to resolve raw ObjectId strings to the engineer's name.

#### Task Detail Component (`src/app/task-detail/task-detail.component.ts`)
*   **Purpose**: Displays task details and checklist deliverables.
*   **Status Patches**: Provides status check actions that trigger `PATCH /api/tasks/:id/status` on change.

---

### 3.6 Specialist Directory

#### Team Settings Component (`src/app/team-settings/team-settings.component.ts`)
*   **Purpose**: Manages team members.
*   **Directory Filtering**: Uses `filteredEngineers = computed(...)` to dynamically filter the active directory, displaying only engineers assigned to the Project Manager's projects.
*   **Search Modal**: Displays a pop-up modal to search for engineers by email. If found, allows allocating them to any project via a dropdown menu.
*   **Remove Action**: Provides a trash button next to each specialist in the directory list. Clicking it removes them from their current project via `DELETE /api/projects/:id/team-members/:engineerId`.

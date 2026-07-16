# ProjectOS UI Generation Prompt for Google Stitch

Build a complete, production-ready UI for a project management web app called ProjectOS. The UI must match a modern enterprise dashboard style with a light theme, indigo/blue primary accents, rounded cards, glassy panels, clean spacing, and responsive layouts. Use a visual language similar to a polished SaaS admin product. Keep the app responsive for desktop and mobile. Use Inter-style typography, Material Symbols icons, soft shadows, rounded-2xl cards, clear hierarchy, and empty/loading/error states.

## Backend API Surface

### Auth endpoints:
- POST /api/auth/signup
- POST /api/auth/signin

### User endpoints:
- GET /api/users (admin only)
- GET /api/users/me
- GET /api/users/:id
- PATCH /api/users/profile
- PATCH /api/users/:id
- DELETE /api/users/:id

### Project endpoints:
- GET /api/projects/stats
- GET /api/projects
- POST /api/projects (create)
- GET /api/projects/:id
- PUT /api/projects/:id (update)
- DELETE /api/projects/:id (delete)
- PATCH /api/projects/:id/status
- POST /api/projects/:id/team-members (add member)
- DELETE /api/projects/:id/team-members/:engineerId (remove member)

### Task endpoints:
- PATCH /api/tasks/bulk-status
- GET /api/tasks/project/:projectId
- POST /api/tasks/project/:projectId (create)
- PATCH /api/tasks/:id/status
- POST /api/tasks/:id/engineers (add engineer)
- DELETE /api/tasks/:id/engineers/:engineerId (remove engineer)
- DELETE /api/tasks/:id (delete)
- GET /api/tasks/:id (view details)

### Engineer workflow endpoints:
- GET /api/engineers/search/email/:email
- GET /api/engineers/search/role/:role
- POST /api/engineers/batch/current-project
- GET /api/engineers/:engineerId/assignments
- PATCH /api/engineers/:engineerId/current-project
- DELETE /api/engineers/:engineerId/current-project
- PATCH /api/engineers/:engineerId/current-task
- DELETE /api/engineers/:engineerId/current-task
- POST /api/engineers/:engineerId/assign-task

## User Roles and Permissions

- **admin**: can view all users, manage roles, access user management area, view dashboards
- **project_manager**: can create/update/delete projects, manage team members, create/update/delete tasks, assign engineers to tasks/projects, update statuses
- **engineer**: can view assigned projects/tasks, update task status for their own tasks, view profile

All protected routes require JWT bearer auth in Authorization header.

## Data Models

**User**: name, email, role, lastlogin, profile (phone, linkedin, github), completedProjects

**Project**: name, description, startDate, endDate, status (not_started, in_progress, completed), priority (low, medium, high), projectManager, teamMembers (array), tasks (array)

**Task**: title, description, engineersAssigned (array), status (not_started, in_progress, completed), project (ref)

**Engineer**: projects (array), Tasks (array), completedTasks (array), currentProject, currentTask, availability (status: available, busy, on_leave)

---

## Pages and Screens Required

### 1. **Login Page** (`/login`)
- Email and password form
- "Sign in" button
- Social login options (Google, GitHub)
- Link to signup page
- Remember me checkbox
- Forgot password link
- Brand logo and brand messaging
- Split layout with branding on left side

### 2. **Signup Page** (`/signup`)
- Name, email, password fields
- Role selector (project_manager or engineer)
- Terms and conditions checkbox
- "Create account" button
- Social signup (Google, GitHub)
- Link to login page
- Same visual style as login

### 3. **Dashboard Page** (`/dashboard`)
- **KPI Cards Section**: total projects count, active tasks count, team members count, hours logged
- **Project Statistics Card**: donut/pie chart showing task distribution by status (not_started, in_progress, completed)
- **Recent Projects Section**: mini cards showing 5-6 most recent projects with status, progress bar, due date
- **Quick Actions Panel**: buttons for "New Project", "Assign Task", "View All Projects"
- **Team Activity Feed**: recent task updates, member assignments, project status changes
- **Your Current Assignments** (for engineers): card showing current project and current task with quick access
- **Quick Stats**: total hours logged this week, tasks completed this month, projects managed
- Responsive grid layout

### 4. **Projects List Page** (`/projects`)
- **Header**: "Projects" title, "New Project" button (green/primary gradient)
- **Search Bar**: live search by project name
- **Filter Controls**: 
  - Status filter (all, not_started, in_progress, completed)
  - Priority filter (all, low, medium, high)
  - Owner filter (all, everyone, specific managers)
  - View toggle (grid view, list view)
- **Grid/List Display**:
  - Project card with: name, description, status badge, priority badge, progress bar, team member avatars, due date, action menu (3-dot)
  - Action menu with: View Details, Edit, Delete
  - Hover effects with translate and border highlight
- **Empty State**: "No projects yet. Create one to get started." with Create Project button
- **Pagination** or infinite scroll if many projects

### 5. **Create Project Page** (`/projects/new`)
- **Form Fields**:
  - Project name (required, text)
  - Description (optional, textarea)
  - Start date (date picker, default today)
  - End date (date picker, optional)
  - Priority (dropdown: low, medium, high)
  - Status (dropdown: not_started, in_progress, completed)
- **Team Members Section**: 
  - Multi-select/search box to add initial team members
  - Display selected engineers as removable chips
  - Search engineers by name/email
- **Buttons**: "Create Project" (primary), "Cancel" (secondary)
- **Validation**: show inline error messages for required fields
- **Loading state** on submit button

### 6. **Project Details Page** (`/projects/:id`)
- **Header Section**: project name, status badge, priority badge, breadcrumb navigation
- **Project Information Panel**:
  - Description, start date, end date, created by (project manager)
  - Edit button (pencil icon) opens edit form or modal
  - Delete button (trash icon) with confirmation modal
- **Team Members Section**:
  - List of current team members with name, role, avatar
  - "Add Member" button opens add member modal/panel
  - Each member has remove button (X icon) with confirmation
  - Search team members by name
- **Tasks Section**:
  - Table or list of all project tasks
  - Columns: task title, assigned engineers, status (with color chip), due date, action menu
  - "Create Task" button (opens create task modal or navigates to new task page)
  - Each task has: Edit button, Delete button (with confirmation), View Details button
  - Bulk select tasks with checkboxes for bulk status update
  - Filter tasks by status
- **Project Statistics**: progress bar, completion percentage, task count by status
- **Responsive**: stack vertically on mobile

### 7. **Edit Project Page** (`/projects/:id/edit`)
- Same form as Create Project but pre-populated with existing data
- "Save Changes" button
- "Cancel" button
- "Delete Project" button (secondary, destructive red)
- Confirmation modal before delete
- Loading state on save

### 8. **Add Member to Project Modal/Panel** (`/projects/:id/add-member`)
- **Search Box**: search engineers by name or email
- **Results List**: display matching engineers with role badges, availability status
- **Select Action**: clicking an engineer adds them to project
- **Confirmation**: "Engineer added to project" toast/notification
- **Filter**: filter by role (project_manager, engineer) or availability status
- **Empty State**: "No engineers found" if search returns nothing

### 9. **Task Details Page** (`/tasks/:id`)
- **Header**: task title, status badge, project breadcrumb
- **Task Information Panel**:
  - Description, project name (link), status
  - Edit button (pencil icon)
  - Delete button (trash icon) with confirmation
  - Mark as complete/incomplete toggle
- **Assigned Engineers Section**:
  - List of engineers assigned to this task
  - "Add Engineer" button opens add engineer modal
  - Each engineer has remove button with confirmation
  - Show engineer name, role, and avatar
- **Status Control**:
  - Dropdown to change status (not_started, in_progress, completed)
  - Save button
- **Activity/Comments** (optional): show assignment changes and status updates
- **Quick Navigation**: Previous task / Next task buttons

### 10. **Edit Task Page** (`/tasks/:id/edit`)
- **Form Fields**:
  - Task title (required)
  - Description (optional, textarea)
  - Status (dropdown)
  - Priority (optional)
  - Assigned engineers (multi-select with search)
- **Buttons**: "Save Changes", "Cancel", "Delete Task" (destructive)
- **Confirmation modal** before delete
- Pre-populated with existing task data

### 11. **Create Task Page** (`/projects/:id/tasks/new`)
- **Form Fields**:
  - Task title (required)
  - Description (optional)
  - Assign engineers (multi-select with search)
  - Status (default: not_started)
  - Priority (optional)
- **Buttons**: "Create Task", "Cancel"
- Project context shown in header
- Inline validation

### 12. **Delete Project Confirmation Modal**
- Title: "Delete Project?"
- Message: "This project and all its tasks will be permanently deleted. This cannot be undone."
- Show project name and task count
- Buttons: "Delete" (red/destructive), "Cancel"
- Checkbox: "I understand this cannot be undone"
- Disable delete button until checkbox is checked

### 13. **Delete Task Confirmation Modal**
- Title: "Delete Task?"
- Message: "This task will be permanently deleted. This cannot be undone."
- Show task title and assigned engineers count
- Buttons: "Delete" (red), "Cancel"
- Checkbox: "I understand this cannot be undone"

### 14. **Add/Remove Member from Project**
- **Add Member Modal**:
  - Search box to find engineers
  - Display results with role badge
  - Click to add (POST /api/projects/:id/team-members)
  - Confirmation toast
- **Remove Member Confirmation**:
  - "Remove {engineer name} from project?"
  - Buttons: "Remove", "Cancel"
  - Delete button triggers DELETE /api/projects/:id/team-members/:engineerId

### 15. **Add/Remove Engineer from Task**
- **Add Engineer Modal**:
  - Search box for engineers
  - Show only engineers assigned to the project
  - Click to add (POST /api/tasks/:id/engineers)
  - Confirmation toast
- **Remove Engineer Confirmation**:
  - "Remove {engineer name} from task?"
  - Buttons: "Remove", "Cancel"

### 16. **Bulk Task Status Update**
- **Bulk Action Bar**: appears when tasks are selected via checkboxes
- Status dropdown selector
- "Apply to X tasks" button
- Calls PATCH /api/tasks/bulk-status with taskIds array and new status

### 17. **Team/Engineer Management Page** (`/team`)
- **Engineer Search Section**:
  - Search by email (GET /api/engineers/search/email/:email)
  - Search by role (GET /api/engineers/search/role/:role)
  - Display results in table: name, email, role, current project, current task, availability status
- **Current Assignments Section** (for each engineer):
  - Current Project selector
  - Current Task selector
  - Buttons: "Set as Current", "Clear"
  - Calls PATCH/DELETE /api/engineers/:engineerId/current-project and /current-task
- **Batch Assignment Tool**:
  - Multi-select engineers
  - Select a project
  - "Assign to Project" button
  - Calls POST /api/engineers/batch/current-project
- **Availability Status**:
  - Toggle or dropdown for each engineer: available, busy, on_leave
  - Reflects in Engineer model

### 18. **Roles & Permissions Page** (`/settings/roles`) (admin/project_manager)
- **Role Overview Cards**:
  - Admin: can manage users, view all projects, manage roles
  - Project Manager: can create projects, manage team members, assign tasks
  - Engineer: can view assigned projects/tasks, update task status
- **Permission Matrix Table**: roles vs. actions (view, create, edit, delete for users/projects/tasks)
- Informational only (no edits here)

### 19. **User Profile Page** (`/profile`)
- **Profile Information**:
  - Name (editable)
  - Email (read-only or minimal edit)
  - Role (read-only, display badge)
  - Last login date
- **Profile Details Section** (editable):
  - Phone
  - LinkedIn URL
  - GitHub URL
  - "Save Profile" button
- **Account Section**:
  - Change password (optional)
  - Logout button
- **Completed Projects/Tasks Stats**: count, links to view
- Form validation and inline error messages

### 20. **Admin User Management Page** (`/admin/users`) (admin only)
- **User List Table**:
  - Columns: name, email, role, last login, status (active/inactive), actions
  - Sort by column
  - Search by name or email
  - Pagination
- **Actions per user**: Edit, Delete (with confirmation)
- **Edit User Modal/Page**:
  - Name, email, role (dropdown)
  - "Save Changes", "Cancel"
- **Delete User Confirmation**:
  - "Delete user {name}?"
  - Warning about associated data
  - Buttons: "Delete", "Cancel"
- **Bulk Actions**: checkbox selection, bulk delete (with confirmation)
- **Empty State**: "No users found"

---

## Design & Interaction Requirements

### Layout & Navigation
- **App Shell**: consistent top navigation bar with logo, search, notifications, help, profile menu
- **Sidebar Navigation**: dashboard, projects, tasks, team, settings, roles (admin), user profile
- **Active Route Highlighting**: current page in sidebar
- **Mobile Responsive**: hamburger menu on mobile, hide sidebar on xs/sm screens
- **Breadcrumb Navigation**: on detail pages (Projects > Project Name > Task Name)

### Form Design
- **Labels**: clear, above input fields
- **Placeholders**: helpful examples
- **Validation**: inline error messages, red borders on invalid fields, success checkmarks
- **Required Fields**: marked with red asterisk
- **Submit Buttons**: primary gradient color, disabled state, loading spinner on submit
- **Cancel Buttons**: secondary gray color
- **Responsive**: full width on mobile, appropriate width on desktop

### Buttons & Actions
- **Primary Actions** (create, save, add): indigo gradient, white text
- **Secondary Actions** (cancel, edit): gray outline
- **Destructive Actions** (delete, remove): red outline or red text, confirmation required
- **Icon Buttons**: circular, with hover background, for secondary actions
- **Loading States**: spinner, disabled state, "Saving..." text
- **Disabled States**: grayed out, cursor-not-allowed

### Cards & Containers
- **Project Cards**: rounded-2xl, subtle border, hover lift effect (translate-y -4px), status badge top-right
- **Task Cards**: clean layout, status on left, due date on right
- **User Cards**: avatar, name, role badge, action menu
- **Stats Cards**: large number, label below, icon top-left, metric on top-right

### Status & Priority Badges
- **Status Badges**:
  - not_started: gray
  - in_progress: blue/indigo
  - completed: green
- **Priority Badges**:
  - low: green outline
  - medium: orange outline
  - high: red outline
- **Availability Badges** (engineers):
  - available: green
  - busy: orange
  - on_leave: gray

### Modals & Panels
- **Confirmation Modals**: title, message, buttons (confirm/cancel)
- **Action Modals**: form content, buttons
- **Toast Notifications**: success (green), error (red), info (blue)
- **Drawer Panels** (optional): for add/edit workflows, slide from right
- **Close Button**: X in top-right corner

### Empty States
- "No projects yet. Create one to get started."
- "No tasks assigned. Check back soon."
- "No team members. Add engineers to this project."
- "No search results. Try a different query."
- Include illustration or icon and CTA button

### Loading & Error States
- **Skeleton Screens**: on card/table loads
- **Loading Spinners**: on buttons and full-page loads
- **Error Messages**: red toast, clear message, retry button
- **Error Pages**: 404, 500, permission denied with back button

### Accessibility & Polish
- **Color Contrast**: ensure readable text on all backgrounds
- **Focus States**: visible outline on interactive elements
- **Hover Effects**: subtle highlight, cursor pointer
- **Transitions**: smooth 200-300ms transitions on hover, focus, state changes
- **Icons**: Material Symbols Outlined, 24px default size
- **Spacing**: consistent 8px grid-based spacing

### Data & Connectivity
- Forms can use mock data on first load (projects, engineers, tasks)
- Structure UI so API calls can be wired in:
  - Auth: JWT token storage and bearer header injection
  - Projects: populate list from GET /api/projects, create from POST, edit from PUT, delete from DELETE
  - Tasks: populate from GET /api/tasks/project/:projectId, CRUD operations
  - Team: populate from searches and assignment endpoints
  - User Profile: GET /api/users/me, PATCH /api/users/profile
- Use loading/error states during API calls
- Toast notifications on success/failure

### Visual Style
- **Color Palette**:
  - Primary: #4648d4 (indigo), #6063ee (indigo light)
  - Secondary: #855300 (orange)
  - Tertiary: #006c49 (green)
  - Surface: #f8f9ff (near-white)
  - Surface containers: various shades of light blue/lavender
  - Error: #ba1a1a (red)
  - On-surface: #0b1c30 (dark blue-gray)
- **Typography**: Inter font, clear hierarchy
- **Shadows**: subtle drop shadows on cards, not excessive
- **Borders**: 1px, #c7c4d7 (light gray-purple), rounded corners
- **Border Radius**: 0.5rem on inputs/small elements, 0.75rem on cards, 9999px on badges
- **Gradients**: primary gradient background on buttons and highlights

---

## Summary

Build a feature-complete project management UI with:
1. ✅ Full CRUD for Projects (Create, Read, Update, Delete pages & modals)
2. ✅ Full CRUD for Tasks (Create, Read, Update, Delete pages & modals)
3. ✅ Add/Remove Team Members from Projects
4. ✅ Add/Remove Engineers from Tasks
5. ✅ Role-based access control (admin, project_manager, engineer)
6. ✅ Authentication (login, signup)
7. ✅ Dashboard with stats and quick actions
8. ✅ Team management and engineer assignment workflows
9. ✅ User profile and admin user management
10. ✅ Bulk operations and advanced filtering
11. ✅ Responsive design and polished SaaS aesthetic
12. ✅ Empty/loading/error states
13. ✅ Confirmation modals for destructive actions
14. ✅ Toast notifications for user feedback

Use the data models and API endpoints provided to structure the forms and interactions. Keep the UI clean, modern, and production-ready.

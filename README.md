# Todo Management Platform

A modern full-stack Todo Management Application built with **React, TypeScript, Tailwind CSS, Vercel Serverless Functions and Supabase PostgreSQL**.

This project demonstrates secure authentication, protected APIs, CRUD operations, relational database design, search, filtering and user-based data management.

---

## 🚀 Live Demo

```
https://todo-management-platform.vercel.app/login

```

---

## 📌 Project Overview

The Todo Management Platform allows users to securely create, manage and organize their personal tasks.

Each user has their own protected workspace where they can:

- Create new todos
- Update existing todos
- Mark tasks as completed or pending
- Delete tasks
- Search todos
- Filter tasks by status
- Manage data securely through authentication

The application was developed as a full-stack software engineering assessment project.

---

# ✨ Features

## 🔐 Authentication

- User registration
- User login
- Secure logout
- Protected routes
- Session management
- JWT-based authentication
- Password hashing handled by Supabase Auth

---

## 📝 Todo Management

Users can:

✅ Create todos  
✅ Edit todos  
✅ Delete todos  
✅ Mark todos as completed  
✅ Change todos back to pending  
✅ View personal todo list  

---

## 🔎 Search & Filtering

Implemented:

- Search todos by title
- Filter by status:
  - All
  - Pending
  - Completed

---

## 🎨 User Interface

- Responsive design
- Modern Tailwind CSS styling
- Mobile-friendly layout
- Loading states
- Error handling
- User-friendly forms

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| React Router | Client-side routing |
| Context API | Authentication state management |

---

## Backend

| Technology | Purpose |
|---|---|
| Vercel Serverless Functions | REST API layer |
| Node.js | Backend runtime |
| Supabase | Authentication and database |
| PostgreSQL | Relational database |

---

# 🏗️ System Architecture

```
                User
                 |
                 |
          React + TypeScript
                 |
                 |
        Protected API Requests
                 |
                 |
       Vercel Serverless Functions
                 |
                 |
          Supabase PostgreSQL
                 |
                 |
          Supabase Auth + JWT
```

---

# 🔄 Authentication Flow

1. User registers an account
2. Supabase Auth securely stores credentials
3. User logs in
4. Supabase creates a secure session token
5. Frontend stores authentication state
6. Protected routes verify user sessions
7. API requests are executed only for authenticated users

---

# 🗄️ Database Design

## Todos Table

| Column | Type |
|---|---|
| id | UUID |
| user_id | UUID (Foreign Key) |
| title | Text |
| description | Text |
| status | Enum |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## Relationship

```
Users
 |
 |
 | 1 : Many
 |
Todos
```

Each user can only access their own todos.

---

# 🔒 Security Implementation

The application includes:

- JWT/session authentication
- Protected API endpoints
- Supabase Row Level Security (RLS)
- User-based data isolation
- Input validation
- Secure environment variables
- No sensitive keys stored in source code

---

# 📂 Project Structure

```
todo-management-platform

│
├── api
│   └── todos
│       ├── GET
│       ├── POST
│       ├── PUT
│       └── DELETE
│
├── src
│   ├── components
│   ├── pages
│   ├── context
│   ├── hooks
│   ├── services
│   └── utils
│
├── public
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── .gitignore
```

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure you have:

- Node.js installed
- npm installed
- Supabase account

---

## 1. Clone Repository

```bash
git clone https://github.com/SenadhiMandina/todo-management-platform.git
```

Navigate into the project:

```bash
cd todo-management-platform
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create:

```
.env.local
```

Add:

```env
VITE_SUPABASE_URL=your_supabase_project_url

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 4. Start Development Server

Run:

```bash
npm run dev
```

Application will run at:

```
http://localhost:5173
```

---

# 🚀 Deployment

The application is deployed using Vercel.

Deployment steps:

1. Connect GitHub repository with Vercel
2. Configure environment variables
3. Deploy project

Required environment variables:

```
VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY
```

---

# 🧪 Testing Checklist

Before deployment, verify:

✅ User registration works  
✅ Login works  
✅ Logout works  
✅ Protected routes block unauthorized users  
✅ Todos can be created  
✅ Todos can be updated  
✅ Todos can be deleted  
✅ Search works  
✅ Filtering works  
✅ Responsive design works  

---

# 📚 Documentation

Additional documentation:

| File | Description |
|---|---|
| ARCHITECTURE.md | System architecture explanation |
| API_DOCUMENTATION.md | REST API documentation |
| SECURITY.md | Security practices |
| INTERVIEW_NOTES.md | Project explanation for interviews |
| DEPLOYMENT.md | Deployment guide |

---

# 🔄 Laravel / Next.js Equivalent Mapping

Although this project uses React + Vercel Functions + Supabase, the architecture maps closely to Laravel + Next.js.

| Laravel / Next.js | This Project |
|---|---|
| Laravel Controllers | Vercel Serverless Functions |
| Laravel Middleware | JWT Verification |
| Laravel Sanctum | Supabase Authentication |
| Laravel Models | Supabase Database Queries |
| PostgreSQL | Supabase PostgreSQL |
| Next.js Frontend | React Frontend |

---

# 💡 Future Improvements

Possible future enhancements:

- Todo categories
- Due dates and reminders
- Drag-and-drop task management
- Notifications
- Team collaboration
- Advanced analytics dashboard

---

# 👨‍💻 Author

**Senadhi Mandina**

GitHub:

https://github.com/SenadhiMandina

---

# 📄 License

This project was developed for educational and software engineering assessment purposes.

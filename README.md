# Karakurum Silkrute Traders

Wholesale and retail trading platform for blankets, home textiles, decorative items, and other sourced goods, with cargo and customs support from Danyore.

---

## ✨ Key Features

### 🛒 Frontend (React)
-   **Dynamic Product Discovery**: Search, filter by category, and toggle views (Grid/List).
-   **Hook-Based State Management**: Optimized data fetching using custom `useProducts` hook.
-   **Premium UI/UX**: Built with **Framer Motion** for smooth animations and **Tailwind-inspired** sleek styling.
-   **Advanced Admin Dashboard**: Real-time product management, stock tracking, and analytics.
-   **New! Image Upload During Creation**: Upload multiple product images simultaneously while adding new products.

### ⚙️ Backend (Node.js/Express)
-   **Secure Authentication**: Multi-role (User/Admin) protection using JWT and Bcrypt.
-   **Flexible Payments**: Integrated with **Stripe** and **JazzCash** for international and local transactions.
-   **Media Optimization**: Automated image handling via **Cloudinary**.
-   **Communication**: Transactional emails powered by **Resend**.
-   **Robust Security**: Rate limiting, Helmet security headers, and Joi input validation.
-   **Database**: PostgreSQL managed with Prisma. Use `prisma db push` for the project database and `prisma db seed` for starter data.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Framer Motion, Lucide Icons, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js, Prisma |
| **Database** | PostgreSQL, Redis (Caching) |
| **Integrations** | Cloudinary (Media), Stripe & JazzCash (Payments), Resend (Email) |

---

## 🚀 Getting Started

### Prerequisites
-   **Node.js** (>= 18.x)
-   **PostgreSQL** (Running instance)
-   **Cloudinary** account (For image storage)

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd E-Commerce-main
    ```

2.  **Setup the Backend**:
    ```bash
    cd server
    npm install
    # Copy server/.env.example to server/.env and set DATABASE_URL to the new database.
    npx prisma db push
    npx prisma db seed
    npm run dev
    ```

3.  **Setup the Frontend**:
    ```bash
    cd ../client
    npm install
    # Create .env 
    npm run dev
    ```

---

## 📂 Project Structure

```text
E-Commerce-main/
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── api/         # Axios API services
│   │   ├── hooks/       # Custom React Hooks (e.g., useProducts)
│   │   ├── pages/       # Page components (Admin, Shop, etc.)
│   │   └── shared/      # Global styles and constants
├── server/              # Node.js Backend
│   ├── src/
│   │   ├── modules/     # Feature-based modules (Products, Auth, etc.)
│   │   ├── config/      # DB & Cloud configurations
│   │   └── utils/       # Shared helpers
│   └── prisma/          # Prisma schema and idempotent seed data
└── README.md            # You are here
```

---

## 📝 Recent Updates

-   ✅ **Refactored Data Layer**: Introduced `useProducts` custom hook to unify product fetching across Admin and Shop pages.
-   ✅ **Enhanced Image Upload**: Enabled multi-image selection and uploading during initial product creation in the Admin panel.
-   ✅ **Security Polish**: Standardized response formats and improved error handling across the API.

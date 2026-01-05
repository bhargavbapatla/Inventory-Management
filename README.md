# 🧁 PantryPilot - Inventory Management System

> A scalable, generic inventory management dashboard tailored for the food industry. Originally built to streamline operations for home bakers, designed to scale for commercial kitchens.

## 🚀 About The Project

PantryPilot is a modern web application designed to solve the specific challenges of food inventory management: unit conversions (kg vs. grams), expiry tracking, and recipe-based stock deductions.

While currently focused on an MVP for a home baking business, the architecture is built to support multi-tenancy and complex manufacturing workflows in the future.

### Key Features (MVP)
- **Real-time Inventory Tracking:** Visual dashboard for stock levels.
- **Unit Management:** Handle ingredients in different units (kg, L, pcs).
- **Low Stock Alerts:** Automatic warnings when ingredients dip below thresholds.
- **Authentication:** Secure login for business owners.
- **Scalable Architecture:** Built with industry-standard best practices.

## 🛠️ Tech Stack

This project uses a modern, high-performance frontend stack:

- **Core:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/) (Fast HMR)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:**
  - **Server State:** React Query / Redux Toolkit (RTK)
  - **Auth State:** React Context API
- **Routing:** React Router v6 (Lazy Loading implemented)

## 📂 Project Structure

```bash
src/
├── components/     # Reusable UI components (Buttons, Cards)
├── context/        # Global application state (Auth)
├── features/       # Feature-based logic (Inventory, Recipes)
├── layouts/        # Page layouts (AuthLayout, DashboardLayout)
├── pages/          # Application views
├── routes/         # Router configuration & Route Guards
└── store/          # Redux store setup

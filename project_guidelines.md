# Releaf Project Guidelines

This document serves as a reference for the development rules, directory structure, and conventions used in the Releaf project.

## 1. Technology Stack

### Frontend (`releaf-front`)

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query) v5
- **Form Handling**: React Hook Form + Zod
- **Testing**: Vitest, React Testing Library, Storybook

### Backend (`releaf-back`)

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **Authentication**: Passport (JWT, OAuth)
- **API Documentation**: Swagger

## 2. Directory Structure

The project follows a **Feature-based Architecture**. Code is organized by business domain (feature) rather than technical type.

### Frontend Structure (`src/`)

- **`app/`**: Next.js App Router pages. Should only contain routing logic and minimal layout code. Delegates rendering to `views`.
- **`features/`**: Contains domain-specific logic and components.
  - `features/[feature-name]/components`: Components specific to this feature.
  - `features/[feature-name]/hooks`: Custom hooks for this feature.
  - `features/[feature-name]/types.ts`: Type definitions.
  - `features/[feature-name]/api.ts`: API calls.
- **`views/`**: Page-level components. Assembles features and shared components to form a complete page.
- **`shared/`**: Reusable code used across multiple features.
  - `shared/components/ui`: Generic UI components (buttons, inputs, etc.).
  - `shared/utils`: Helper functions.
  - `shared/hooks`: Global hooks.
- **`layouts/`**: Global layout components (Header, Footer, Sidebar).

### Backend Structure (`src/`)

- **`features/`**: Domain modules (e.g., `auth`, `book`, `user`).
  - Each feature module contains its own Controller, Service, Entity, and DTOs.
- **`common/`**: Global filters, guards, interceptors, and decorators.
- **`shared/`**: Shared utilities and constants.

## 3. Naming Conventions

- **Files & Directories**: `kebab-case` (e.g., `book-sale-card.tsx`, `user-profile/`).
- **Components**: `PascalCase` (e.g., `BookSaleCard`).
- **Interfaces & Types**: `PascalCase` (e.g., `User`, `BookSale`).
- **Variables & Functions**: `camelCase` (e.g., `handleSubmit`, `isLoading`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_IMAGE_COUNT`).

## 4. Development Rules

### Separation of Concerns (SoC)

- **Logic Extraction**: Extract reusable logic into custom hooks (`use...`) or utility functions. Do not keep complex logic inside UI components.
- **Single Responsibility**: Each component, function, or module should have one clear purpose.
- **DRY (Don't Repeat Yourself)**: If you find yourself copying code, refactor it into a shared component or utility.
- **Feature Isolation**: Keep feature-specific logic within its feature directory. Only move code to `shared/` if it is truly generic and used by multiple distinct features.

### Component Design

- **Presentational vs. Container**: Keep UI components (Presentational) separate from logic (Container/Hooks).
- **Composition**: Use composition over inheritance. Build complex UIs from small, single-purpose components.
- **Shadcn UI**: Use `src/shared/components/shadcn` for base UI elements. Do not modify them directly unless necessary for global styling.

### State Management

- **Server State**: Use React Query for all async data.
- **Client State**: Use Zustand for global client-side state (e.g., auth, modal).
- **Local State**: Use `useState` or `useReducer` for component-local state.

### Styling

- **Tailwind CSS**: Use utility classes for styling.
- **`cn` Utility**: Use the `cn` helper for conditional class merging.
- **Responsive Design**: Mobile-first approach.

### Testing

- **Storybook**: Create stories for all UI components, especially those in `shared/` or complex feature components.
- **Unit Tests**: Write unit tests for utility functions and complex hooks.

## 5. Workflow

1.  **Plan**: Define the feature requirements and implementation plan.
2.  **Design**: Create/Update Storybook stories for UI components.
3.  **Implement**: Write the code following the structure above.
4.  **Verify**: Test manually and run automated checks (lint, build).

# Smart Dine Frontend (React + Vite)

This is the **Frontend** for the Smart Dine application, built with **React**, **Vite**, and **Leaflet** for maps. It interacts with the backend to provide AI-powered restaurant recommendations, route planning, and social features.

## Prerequisites

-   Node.js (v14 or higher)
-   npm

## Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend/smartdine
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

1.  Create a `.env` file in the root of the frontend directory (`frontend/smartdine/.env`):
    ```env
    VITE_API_URL=http://localhost:4000
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *(Ask the dashboard admin for Supabase keys if you don't have them)*

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will start on `http://localhost:5173`.

## Features

-   **Discovery**: AI-powered search for restaurants based on mood, craving, and location.
-   **Interactive Maps**: View restaurant locations and routes using Leaflet.
-   **Social**: Add friends, chat, and see where they are eating.
-   **User Profile**: Track your dining history and preferences.
-   **Responsive Design**: Fully optimized for mobile and desktop.

## Project Structure

-   `src/components`: Reusable UI components (Header, Cards, Map, etc.)
-   `src/context`: React Context for state management (Auth, Theme).
-   `src/services`: API calls and backend interaction logic.
-   `src/assets`: Static images and icons.

## Tech Stack

-   **React** (UI Framework)
-   **Vite** (Build Tool)
-   **Leaflet / React-Leaflet** (Maps)
-   **Axios** (API Requests)
-   **CSS Modules** (Styling)

# Veneer

A premium, modern management tool for **Eww** (Elkowar's Wacky Widgets). Veneer provides a sleek GUI to manage, customize, and install your Linux desktop widgets with ease.

## Features

- **Dashboard**: Monitor and toggle your active widgets.
- **Library**: Upload and manage your custom widget configurations.
- **Customizer**: Real-time visual geometry adjustment and direct source code editing (.yuck and .scss).
- **Glassmorphism UI**: A stunning, animated interface built with React, Framer Motion, and Tailwind CSS.
- **Tauri Backend**: High-performance Rust backend for direct system and Eww interaction.

## Prerequisites

- [Eww](https://github.com/elkowar/eww) installed and configured.
- Rust and Node.js for development.

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Rust, Tauri v2.

# Veneer

A widget management tool for **Eww** (Elkowar's Wacky Widgets). Veneer provides a friendly GUI to manage, customize, and install your Linux desktop widgets with ease.

## Features

- **Dashboard**: Monitor and toggle your active widgets.
- **Library**: Upload and manage your custom widget configurations.
- **Customizer**: Real-time visual geometry adjustment and direct source code editing (.yuck and .scss).
- **Tauri Backend**: High-performance Rust backend for direct system and Eww interaction.

## 🛠️ Managing Widgets

Veneer manages your Eww widgets in a centralized directory, typically located at `~/.config/veneer/`. 

### Installing Eww
Since Veneer is a manager for Eww widgets, you must have the Eww daemon installed.
- **Source Code**: [elkowar/eww GitHub](https://github.com/elkowar/eww)
- **Documentation**: [Eww Official Documentation](https://elkowar.github.io/eww/)
- **Arch Linux**: `yay -S eww`
- For other distributions, please follow the [official installation guide](https://elkowar.github.io/eww/).

### Directory Structure & Yuck Files
Each widget is stored in its own folder inside `~/.config/veneer/`. A correct widget structure looks like this:

```text
~/.config/veneer/eww
├── eww.yuck (main yuck file)
├── eww.scss (main scss file)
└── widgets
    └── MyWidgetName/
        ├── eww.yuck     (Required: The main layout and logic)
        ├── eww.scss     (Optional: The styling)
        ├── preview.png  (Required for Community: A screenshot of your widget)
        └── veneer.json  (Required for Community: Metadata for Veneer)
```

The `eww.yuck` file is the heart of your widget where you define its structure, variables, and windows.

### Migrating Existing Configs
If you already have existing Eww configs (e.g., from `~/.config/eww/`), migrating them to Veneer is simple:
1. Create a new folder for your widget inside `~/.config/veneer/eww/widgets` (e.g., `~/.config/veneer/eww/widgets/my-old-sidebar/`).
2. Move your `eww.yuck` and `eww.scss` into this new folder.
3. Open Veneer. The app will automatically detect your widget, allowing you to launch and customize it immediately!
*(Ensure your window definitions in `eww.yuck` match the logic you want to use.)*

### Contributing to the Community Library
Have a beautiful widget you want to share with others?
1. Ensure your widget folder has a valid `veneer.json` file containing the widget's name, author, and description, along with a `preview.png` image.
2. Fork the [Veneer Community Repository](https://github.com/usoy410/Veneer_Community) (or the designated community repo).
3. Upload your widget folder to the repository.
4. Submit a Pull Request. Once approved, it will be available for all Veneer users to download directly from the app!

## Development Prerequisites
- Rust and Node.js for development.


## Installation

You can download the latest pre-compiled packages (`.deb`, `.tar.gz`, etc.) for Linux from the [Releases](https://github.com/usoy410/Veneer/releases/latest) page.

- **Debian/Ubuntu**: `sudo dpkg -i veneer_0.1.0_amd64.deb`
- **Arch Linux**: Can be built using the provided `PKGBUILD` in the repository or from the release assets.

## Development

To build Veneer from source:

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

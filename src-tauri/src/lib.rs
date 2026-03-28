use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{self, Manager};

#[tauri::command]
fn check_eww() -> bool {
    Command::new("eww").arg("--version").status().map(|s| s.success()).unwrap_or(false)
}

#[tauri::command]
fn get_eww_config_path() -> String {
    let home = std::env::var("HOME").unwrap_or_default();
    format!("{}/.config/eww", home)
}

#[tauri::command]
fn run_eww_command(args: Vec<String>) -> Result<String, String> {
    let output = Command::new("eww")
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn install_widget(name: String, yuck_content: String, scss_content: String) -> Result<(), String> {
    let config_path = PathBuf::from(get_eww_config_path());
    let widget_dir = config_path.join("widgets").join(&name);
    
    fs::create_dir_all(&widget_dir).map_err(|e| e.to_string())?;
    
    fs::write(widget_dir.join(format!("{}.yuck", name)), yuck_content).map_err(|e| e.to_string())?;
    fs::write(widget_dir.join(format!("{}.scss", name)), scss_content).map_err(|e| e.to_string())?;
    
    // Update main eww.yuck and eww.scss
    update_main_configs(&name)?;
    
    Ok(())
}

fn update_main_configs(widget_name: &str) -> Result<(), String> {
    let config_path = PathBuf::from(get_eww_config_path());
    let main_yuck = config_path.join("eww.yuck");
    let main_scss = config_path.join("eww.scss");
    
    // Ensure files exist
    if !main_yuck.exists() {
        fs::write(&main_yuck, ";; Eww Main Yuck\n").map_err(|e| e.to_string())?;
    }
    if !main_scss.exists() {
        fs::write(&main_scss, "// Eww Main SCSS\n").map_err(|e| e.to_string())?;
    }
    
    let mut yuck = fs::read_to_string(&main_yuck).unwrap_or_default();
    let include_line = format!("(include \"./widgets/{}/{}.yuck\")", widget_name, widget_name);
    if !yuck.contains(&include_line) {
        yuck.push_str(&format!("\n{}", include_line));
        fs::write(&main_yuck, yuck).map_err(|e| e.to_string())?;
    }
    
    let mut scss = fs::read_to_string(&main_scss).unwrap_or_default();
    let import_line = format!("@import \"./widgets/{}/{}.scss\";", widget_name, widget_name);
    if !scss.contains(&import_line) {
        scss.push_str(&format!("\n{}", import_line));
        fs::write(&main_scss, scss).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
fn ensure_widget_linked(_name: String, yuck_path: String) -> Result<(), String> {
    let config_path = PathBuf::from(get_eww_config_path());
    let main_yuck = config_path.join("eww.yuck");
    let main_scss = config_path.join("eww.scss");

    // Ensure files exist
    if !main_yuck.exists() {
        fs::write(&main_yuck, ";; Eww Main Yuck\n").map_err(|e| e.to_string())?;
    }
    if !main_scss.exists() {
        fs::write(&main_scss, "// Eww Main SCSS\n").map_err(|e| e.to_string())?;
    }

    let yuck_file = PathBuf::from(yuck_path);
    let widget_dir = yuck_file.parent().ok_or("Invalid yuck path")?;
    
    // Find all yuck files in the directory
    let mut all_yuck_files: Vec<PathBuf> = fs::read_dir(widget_dir).map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.extension().map_or(false, |ext| ext == "yuck"))
        .collect();

    // Sort to ensure variables.yuck is usually first if it exists
    all_yuck_files.sort_by(|a, b| {
        let a_is_var = a.file_name().unwrap_or_default() == "variables.yuck";
        let b_is_var = b.file_name().unwrap_or_default() == "variables.yuck";
        if a_is_var && !b_is_var { std::cmp::Ordering::Less }
        else if !a_is_var && b_is_var { std::cmp::Ordering::Greater }
        else { a.cmp(b) }
    });

    let mut yuck = fs::read_to_string(&main_yuck).unwrap_or_default();
    let mut added_any = false;

    for y_path in all_yuck_files {
        let rel_path = pathdiff::diff_paths(&y_path, &config_path)
            .ok_or("Could not calculate relative path")?;
        let include_line = format!("(include \"./{}\")", rel_path.to_string_lossy());
        
        if !yuck.contains(&include_line) {
            yuck.push_str(&format!("\n{}", include_line));
            added_any = true;
        }
    }

    if added_any {
        fs::write(&main_yuck, yuck).map_err(|e| e.to_string())?;
    }

    // Try to find a .scss
    let scss_path = widget_dir.join("style.scss");
    if !scss_path.exists() {
        let widget_name = yuck_file.file_stem().unwrap().to_string_lossy();
        let alt_scss = widget_dir.join(format!("{}.scss", widget_name));
        if alt_scss.exists() {
             link_scss(&alt_scss, &config_path, &main_scss)?;
        }
    } else {
        link_scss(&scss_path, &config_path, &main_scss)?;
    }

    // Trigger reload so Eww sees the new include
    let _ = Command::new("eww").arg("reload").status();
    
    Ok(())
}

fn link_scss(scss_path: &PathBuf, config_path: &PathBuf, main_scss: &PathBuf) -> Result<(), String> {
    let rel_scss_path = pathdiff::diff_paths(scss_path, config_path)
        .ok_or("Could not calculate relative path for scss")?;
    let import_line = format!("@import \"./{}\";", rel_scss_path.to_string_lossy());
    let mut scss = fs::read_to_string(main_scss).unwrap_or_default();
    if !scss.contains(&import_line) {
        scss.push_str(&format!("\n{}", import_line));
        fs::write(main_scss, scss).map_err(|e| e.to_string())?;
    }

    // Trigger reload so Eww sees the new include
    let _ = Command::new("eww").arg("reload").status();
    
    Ok(())
}

#[tauri::command]
fn update_widget_geometry(yuck_path: String, x: i32, y: i32, width: i32, height: i32) -> Result<(), String> {
    let yuck_path = PathBuf::from(yuck_path);
    
    if !yuck_path.exists() {
        return Err(format!("Widget file not found: {:?}", yuck_path));
    }
    
    let mut content = fs::read_to_string(&yuck_path).map_err(|e| e.to_string())?;
    
    // Simple replacement for :geometry (x y width height)
    // This assumes a standard eww geometry format. 
    // In a real app, this would be more robust.
    // Robust replacement for :x :y :width :height (handles quotes and units)
    let re_x = regex::Regex::new(r#":x\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();
    let re_y = regex::Regex::new(r#":y\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();
    let re_w = regex::Regex::new(r#":width\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();
    let re_h = regex::Regex::new(r#":height\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();
    
    content = re_x.replace(&content, &format!(":x {}", x)).to_string();
    content = re_y.replace(&content, &format!(":y {}", y)).to_string();
    content = re_w.replace(&content, &format!(":width {}", width)).to_string();
    content = re_h.replace(&content, &format!(":height {}", height)).to_string();
    
    fs::write(&yuck_path, content).map_err(|e| e.to_string())?;
    
    // Reload eww
    let _ = Command::new("eww").arg("reload").status();
    
    Ok(())
}

#[derive(serde::Serialize)]
struct WidgetInfo {
    id: String,
    name: String,
    status: String,
    description: String,
    path: String,
    yuck_path: String, // Added path to the .yuck file
    geometry: Geometry,
    windows: Vec<String>, // Added list of window names
}

#[derive(serde::Serialize)]
struct Geometry {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

#[tauri::command]
fn scan_widgets(app_handle: tauri::AppHandle) -> Result<Vec<WidgetInfo>, String> {
    let (width, height) = if let Ok(Some(monitor)) = app_handle.primary_monitor() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        ((size.width as f64 / scale) as i32, (size.height as f64 / scale) as i32)
    } else {
        (1920, 1080) // Fallback to common resolution
    };
    
    let config_path = PathBuf::from(get_eww_config_path());
    let mut widgets = Vec::new();
    
    if !config_path.exists() {
        return Ok(widgets);
    }

    let mut scan_dirs = vec![config_path.clone()];
    let widgets_subfolder = config_path.join("widgets");
    if widgets_subfolder.exists() {
        scan_dirs.push(widgets_subfolder);
    }

    for dir in scan_dirs {
        let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_dir() && !path.ends_with("scripts") && !path.ends_with("widgets") {
                let name = path.file_name().unwrap().to_string_lossy().to_string();
                let yuck_files: Vec<_> = fs::read_dir(&path).map_err(|e| e.to_string())?
                    .filter_map(|e| e.ok())
                    .map(|e| e.path())
                    .filter(|p| p.extension().map_or(false, |ext| ext == "yuck"))
                    .collect();

                if !yuck_files.is_empty() {
                    let mut windows = Vec::new();
                    let mut first_geometry = Geometry { x: 0, y: 0, width: 200, height: 100 };
                    let mut first_yuck_path = String::new();
                    
                    for yuck_path in &yuck_files {
                        if first_yuck_path.is_empty() {
                            first_yuck_path = yuck_path.to_string_lossy().to_string();
                        }
                        let content = fs::read_to_string(yuck_path).unwrap_or_default();
                        
                        // Extract window names
                        let re_win = regex::Regex::new(r"\(defwindow\s+([^\s\)]+)").unwrap();
                        for cap in re_win.captures_iter(&content) {
                            windows.push(cap[1].to_string());
                        }

                        // Use geometry from the first file that has it
                        let geo = extract_geometry(&content, width, height);
                        if geo.x != 0 || geo.y != 0 {
                            first_geometry = geo;
                        }
                    }
                    
                    if !windows.is_empty() {
                        widgets.push(WidgetInfo {
                            id: name.clone(),
                            name: name.clone(),
                            status: "inactive".to_string(),
                            description: format!("Existing widget in {}", name),
                            path: path.to_string_lossy().to_string(),
                            yuck_path: first_yuck_path,
                            geometry: first_geometry,
                            windows,
                        });
                    }
                }
            }
        }
    }

    Ok(widgets)
}

fn extract_geometry(content: &str, screen_w: i32, screen_h: i32) -> Geometry {
    let re_x = regex::Regex::new(r#":x\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();
    let re_y = regex::Regex::new(r#":y\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();
    let re_w = regex::Regex::new(r#":width\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();
    let re_h = regex::Regex::new(r#":height\s+("[^"]*"|[\d.-]+%?|[\d.-]+px|[\d.-]+)"#).unwrap();

    let x_raw = re_x.captures(content).and_then(|c| c.get(1)).map(|m| m.as_str()).unwrap_or("0");
    let y_raw = re_y.captures(content).and_then(|c| c.get(1)).map(|m| m.as_str()).unwrap_or("0");
    let w_raw = re_w.captures(content).and_then(|c| c.get(1)).map(|m| m.as_str()).unwrap_or("200");
    let h_raw = re_h.captures(content).and_then(|c| c.get(1)).map(|m| m.as_str()).unwrap_or("100");

    Geometry { 
        x: parse_eww_value(x_raw, screen_w), 
        y: parse_eww_value(y_raw, screen_h), 
        width: parse_eww_value(w_raw, screen_w), 
        height: parse_eww_value(h_raw, screen_h) 
    }
}

fn parse_eww_value(value: &str, total: i32) -> i32 {
    let clean = value.trim_matches('"').trim_matches('\'').trim();
    if clean.ends_with('%') {
        let percent = clean[..clean.len()-1].parse::<f32>().unwrap_or(0.0);
        return ((percent / 100.0) * total as f32) as i32;
    }
    if clean.ends_with("px") {
        return clean[..clean.len()-2].parse::<i32>().unwrap_or(0);
    }
    clean.parse::<i32>().unwrap_or(0)
}

#[tauri::command]
fn read_widget_yuck(yuck_path: String) -> Result<String, String> {
    let path = PathBuf::from(yuck_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn reload_eww() -> Result<(), String> {
    Command::new("eww")
        .arg("reload")
        .status()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn restart_eww() -> Result<(), String> {
    // Kill eww first
    let _ = Command::new("pkill").arg("eww").status();
    
    // Start daemon
    Command::new("eww")
        .arg("daemon")
        .spawn()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn install_font(path: String) -> Result<(), String> {
    let font_path = PathBuf::from(path);
    if !font_path.exists() {
        return Err("Font file not found".to_string());
    }
    
    let home = std::env::var("HOME").unwrap_or_default();
    let fonts_dir = PathBuf::from(home).join(".local/share/fonts");
    
    fs::create_dir_all(&fonts_dir).map_err(|e| e.to_string())?;
    
    let dest = fonts_dir.join(font_path.file_name().ok_or("Invalid font path")?);
    fs::copy(&font_path, &dest).map_err(|e| e.to_string())?;
    
    // Update font cache
    let _ = Command::new("fc-cache").arg("-f").status();
    
    Ok(())
}

#[tauri::command]
fn write_widget_yuck(yuck_path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(yuck_path);
    fs::write(path, content).map_err(|e| e.to_string())?;
    // Trigger reload
    let _ = Command::new("eww").arg("reload").status();
    Ok(())
}

fn resolve_scss_path(yuck_path: &str) -> Result<PathBuf, String> {
    let yuck_file = PathBuf::from(yuck_path);
    let widget_dir = yuck_file.parent().ok_or("Invalid yuck path")?;
    
    let scss_path = widget_dir.join("style.scss");
    if scss_path.exists() {
        return Ok(scss_path);
    }
    
    let widget_name = yuck_file.file_stem().unwrap().to_string_lossy();
    let alt_scss = widget_dir.join(format!("{}.scss", widget_name));
    if alt_scss.exists() {
        return Ok(alt_scss);
    }
    
    Err("No SCSS file found for this widget".to_string())
}

#[tauri::command]
fn read_widget_scss(yuck_path: String) -> Result<String, String> {
    let scss_path = resolve_scss_path(&yuck_path)?;
    fs::read_to_string(scss_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_widget_scss(yuck_path: String, content: String) -> Result<(), String> {
    let scss_path = resolve_scss_path(&yuck_path)?;
    fs::write(scss_path, content).map_err(|e| e.to_string())?;
    // Trigger reload
    let _ = Command::new("eww").arg("reload").status();
    Ok(())
}

#[tauri::command]
fn upload_widget(source_path: String) -> Result<(), String> {
    let source = PathBuf::from(source_path);
    if !source.exists() || !source.is_dir() {
        return Err("Source path must be a valid directory".to_string());
    }
    
    let widget_name = source.file_name()
        .ok_or("Invalid source path")?
        .to_string_lossy()
        .to_string();
        
    let config_path = PathBuf::from(get_eww_config_path());
    let dest = config_path.join(&widget_name);
    
    if dest.exists() {
        return Err(format!("Widget '{}' already exists in eww config", widget_name));
    }
    
    copy_dir_all(&source, &dest).map_err(|e| e.to_string())?;
    
    Ok(())
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> std::io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            check_eww,
            get_eww_config_path,
            run_eww_command,
            install_widget,
            install_font,
            update_widget_geometry,
            scan_widgets,
            reload_eww,
            restart_eww,
            ensure_widget_linked,
            read_widget_yuck,
            write_widget_yuck,
            read_widget_scss,
            write_widget_scss,
            upload_widget
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

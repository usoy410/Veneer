import { invoke } from "@tauri-apps/api/core";
import type { Widget, CommunityWidget } from "../types/widget";

/**
 * Checks if the Eww daemon is installed and ready.
 */
export async function checkEww(): Promise<boolean> {
  return invoke<boolean>("check_eww");
}

/**
 * Restarts the Eww daemon.
 */
export async function restartEww(): Promise<void> {
  return invoke<void>("restart_eww");
}

/**
 * Scans for locally installed widgets.
 */
export async function scanWidgets(): Promise<Widget[]> {
  return invoke<Widget[]>("scan_widgets");
}

/**
 * Reads the 'eww.yuck' file for a specific widget.
 */
export async function readWidgetYuck(yuckPath: string): Promise<string> {
  return invoke<string>("read_widget_yuck", { yuckPath });
}

/**
 * Reads the 'eww.scss' file for a specific widget.
 */
export async function readWidgetScss(yuckPath: string): Promise<string> {
  return invoke<string>("read_widget_scss", { yuckPath });
}

/**
 * Ensures a widget is included/linked in the main eww.yuck file.
 */
export async function ensureWidgetLinked(name: string, yuckPath: string): Promise<void> {
  return invoke<void>("ensure_widget_linked", { name, yuckPath });
}

/**
 * Runs a specific Eww command (e.g. ['open', 'window-name']).
 */
export async function runEwwCommand(args: string[]): Promise<void> {
  return invoke<void>("run_eww_command", { args });
}

/**
 * Updates the geometry configuration for a widget.
 */
export async function updateWidgetGeometry(
  yuckPath: string, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): Promise<void> {
  return invoke<void>("update_widget_geometry", { yuckPath, x, y, width, height });
}

/**
 * Writes content to the widget's 'eww.yuck' file.
 */
export async function writeWidgetYuck(yuckPath: string, content: string): Promise<void> {
  return invoke<void>("write_widget_yuck", { yuckPath, content });
}

/**
 * Writes content to the widget's 'eww.scss' file.
 */
export async function writeWidgetScss(yuckPath: string, content: string): Promise<void> {
  return invoke<void>("write_widget_scss", { yuckPath, content });
}

/**
 * Instructs the backend to copy/upload a widget from a given path.
 */
export async function uploadWidget(sourcePath: string): Promise<void> {
  return invoke<void>("upload_widget", { sourcePath });
}

/**
 * Fetches the list of community widgets from the remote registry.
 */
export async function fetchCommunityWidgets(): Promise<CommunityWidget[]> {
  return invoke<CommunityWidget[]>("fetch_community_widgets");
}

/**
 * Downloads and installs a widget from the community registry.
 */
export async function installCommunityWidget(downloadUrl: string, folderName: string | null): Promise<void> {
  return invoke<void>("install_community_widget", { downloadUrl, folderName });
}

/**
 * Deletes a local widget.
 */
export async function deleteWidget(widgetName: string): Promise<void> {
  return invoke<void>("delete_widget", { widgetName });
}

/**
 * Represents a local custom widget installed on the system.
 */
export interface Widget {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  description: string;
  path: string;
  yuck_path: string;
  scss_path?: string;
  variables_path?: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  windows: string[];
  preview?: string;
  is_community?: boolean;
  startup_scripts: string[];
}

/**
 * Represents a widget available in the community registry.
 */
export interface CommunityWidget {
  id: string;
  name: string;
  description: string;
  author: string;
  download_url: string;
  preview_url: string;
  folder_name?: string;
}

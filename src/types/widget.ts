/**
 * Represents a local custom widget installed on the system.
 */
export interface Widget {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  description: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  yuck_path: string;
  windows: string[];
  preview?: string;
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

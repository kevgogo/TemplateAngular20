// Tipos "de UI" que consume el Sidebar (no confundir con RawMenuItem)
export interface SidebarItem {
  text: string;
  link?: string | any[] | null;
  icon?: string | null;
  submenu?: SidebarItem[] | null;
}

export interface MenuNode {
  label: string;
  link?: string | any[] | null;
  icon?: string;
  children?: MenuNode[] | null;
}

// Para inputs que aceptan ambos shapes (compatibilidad)
export type AnySidebarItem = MenuNode | SidebarItem;

// Para inputs que aceptan ambos shapes (compatibilidad)
export type AnyItem = MenuNode | SidebarItem;

export interface ApiMenuResponse {
  typeResult: number;
  objectResult: RawMenuItem[];
  messageResult: string | null;
}

export interface RawMenuItem {
  id: number;
  fatherId: number | null;
  moduleId: number | null;
  name: string;
  nameSpanish: string | null;
  controller: string | null;
  action: string | null;
  description: string;
  description2: string | null;
  path: string; // si viene ya armado desde backend, se respeta
  icon: string; // ej: "fa fa-cog"
  order: number;
  status: number; // 1 = visible/activo (asumido)
  menuName: string | null;
  moduleName: string | null;
  permission: string | null;
}

export interface SidebarNode extends RawMenuItem {
  key: number; // alias de id, útil para plantillas
  text: string; // etiqueta a mostrar (nameSpanish ?? name)
  link: string | null; // ruta calculada a partir de path | controller/action
  isLeaf: boolean; // sin hijos y con link
  children: SidebarNode[]; // árbol
  title?: string;
  submenu?: SidebarNode[];
}
/** ---------------- UI: tipos que consume el Sidebar ---------------- */

// Links aceptados por Angular Router: string ('/ruta') o array (['/ruta', id])
export type RouteLink = string | any[];

/** Forma antigua usada por algunas plantillas */
export interface SidebarItem {
  text: string;
  link?: RouteLink | null; // puede venir null en data vieja
  icon?: string | null;
  submenu?: SidebarItem[] | null;
}

/** Forma actual (la que debe usar tu Sidebar) */
export interface MenuNode {
  label: string;
  link?: RouteLink; // si no hay, simplemente no se asigna
  icon?: string;
  children?: MenuNode[];
}

/** Compatibilidad: inputs que aceptan ambas formas */
export type AnySidebarItem = MenuNode | SidebarItem;
export type AnyItem = MenuNode | SidebarItem;

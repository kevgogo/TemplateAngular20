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

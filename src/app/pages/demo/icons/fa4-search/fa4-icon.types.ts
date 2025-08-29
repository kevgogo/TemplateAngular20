export interface Fa4Icon {
  name: string; // nombre principal (p.ej. 'camera-retro')
  unicode: string; // p.ej. 'f083'
  class: string; // 'fa fa-camera-retro'
  aliases: string[]; // ['photo', '...'] si aplica
}

export interface Fa4IconsPayload {
  version: string; // '4.7.0'
  icons: Fa4Icon[];
}

export type TypeResult = 0 | 1 | 2 | 3; // Ajusta si tu backend usa otros códigos

export interface ApiBase {
  typeResult: TypeResult;
  messageResult?: string | null;
}

export interface ApiObject<T> extends ApiBase {
  objectResult?: T; // algunos endpoints pueden omitirlo
}

export interface ApiArray<T> extends ApiBase {
  objectResult?: T[]; // idem
}

export interface TokenPayload {
  token?: string;
  Token?: string; // algunos backends lo devuelven capitalizado
}

export type TokenResponse = ApiBase & TokenPayload;

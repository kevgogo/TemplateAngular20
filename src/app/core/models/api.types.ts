export type TypeResult = 0 | 1 | 2 | 3;

export interface ApiBase {
  typeResult: TypeResult;
  messageResult?: string | null;
}

export interface ApiObject<T> extends ApiBase {
  objectResult?: T;
}

export interface ApiArray<T> extends ApiBase {
  objectResult?: T[];
}

export interface TokenPayload {
  token?: string;
  Token?: string;
}

export type TokenResponse = ApiBase & TokenPayload;

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export type GqlVariables = Record<string, unknown> | undefined;

export interface GqlOptions<V extends GqlVariables = GqlVariables> {
  query: string;
  variables?: V;
  operationName?: string;
  context?: {
    headers?: Record<string, string>;
    withCredentials?: boolean;
  };
}

export interface WsEvent<T = Record<string, unknown>> {
  type: string;
  payload: T;
}

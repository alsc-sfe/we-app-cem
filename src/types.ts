export interface OnlyData {
  dataPath: string;
}
export interface InstantObj {
  instant?: boolean;
  once?: boolean;
  onlyData?: OnlyData;
}

export interface EventCallbackParams {
  type: string;
  target: string;
  prevTarget: string;
  data: any;
  prevData: any;
  [prop: string]: any;
}

export interface EventCallback {
  __guid?: string;
  (params: EventCallbackParams): void;
}

export interface EvCallback {
  guid?: string;
  (params: any): void;
}

export type DataCallback = (params: any) => void;

export interface ElementType<T> {
  getName: () => string;
  isValid: () => boolean;

  getValue: () => Promise<T>;
  setValue: (value: T) => void;
  reset?: () => void;
  setDisabled?: (status: boolean) => void;
  getValueInfo?: () => void;
  // Comment TODO
  isObject?: boolean;
}

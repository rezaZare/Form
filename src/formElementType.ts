export interface FormElementType {
  getName: () => string | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  getValue: () => Promise<any> | any;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  setValue: (value: any) => void;
  isValid?: (
    value?: any,
    changeAppearance?: boolean
  ) => Promise<boolean> | boolean | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onChange?: (value: any) => void;
  reset?: () => void;
  setDisabled?: (disable: boolean) => void;
  isSuccessSubscribe?: boolean;
  doNotResetAfterSubmit?: boolean;
  // Comment TODO
  isObject?: boolean;
}

import { type Ref, useContext, useEffect, useImperativeHandle } from "react";

import { FormContext } from "./form";
import type { FormElementType } from "./formElementType";

export interface UseFormProps<T> {
  ref?: Ref<FormElementType>;
  name: string;
  doNotSubscribe?: boolean;
  getValue: () => Promise<T | undefined> | T;
  reset?: () => void;
  isValid?: (
    _value?: any,
    changeAppearance?: boolean
  ) => Promise<boolean> | boolean;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  setValue: any;
  setDisable?: (disabled: boolean) => void;
  isObject?: boolean;
  doNotResetAfterSubmit?: boolean;
}

export interface UseFormReturnType {
  isConfirmation?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onChangeForm?:
    | ((name: string, value?: any, isValid?: boolean) => Promise<void>)
    | undefined;
}

export function useForm<T>({
  ref,
  name,
  getValue,
  setValue,
  isValid,
  reset,
  setDisable,
  doNotSubscribe,
  isObject,
  doNotResetAfterSubmit,
}: UseFormProps<T>): UseFormReturnType {
  const formContext = useContext(FormContext);

  function getName() {
    return name;
  }
  const methods: FormElementType = {
    getName,
    getValue,
    setValue,
    isValid,
    setDisabled: setDisable,
    reset,
    isObject,
    doNotResetAfterSubmit,
  };

  useImperativeHandle(ref, () => methods);
  useEffect(() => {
    if (!doNotSubscribe) {
      if (formContext != null) {
        formContext.subscribe(methods);

        return () => {
          formContext.unsubscribe(name);
        };
      }
    }
  }, []);

  return {
    onChangeForm: !doNotSubscribe ? formContext?.onChange : undefined,
    isConfirmation: formContext?.isConfirmation,
  };
}

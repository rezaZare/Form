import {
  createContext,
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
  SetStateAction,
} from "react";
import { v4 as uuidv4 } from "uuid";

import { useLogger } from "./useLogger";

import type { FormElementType } from "./formElementType";
import {
  getFormValue,
  getObjectDetail,
  getOnlyFormValue,
  getValueFromObject,
} from "./util";

export interface FormBaseProp {
  /**
   * this field is used for components that do not need to be subscribed
   */
  doNotSubscribe?: boolean;
  doNotResetAfterSubmit?: boolean;
}

export interface FormProps<T> extends PropsWithChildren {
  value: T;
  id?: keyof T;
  actions?: ReactNode;
  onSubmit?: (data: T | undefined) => Promise<boolean>;
  onInvalidData?: (invalidNames: string[]) => void;
  onCancel?: () => void;
  onChange?: (name: string, value: any, isValid: boolean) => void;
  saveButtonTitle?: string;
  cancelButtonTitle?: string;
  resetAfterSubmit?: boolean;
  disableEnterKeySubmit?: boolean;
  isConfirmation?: boolean;
  ignoreConfirmationItems?: string[];
}
export type FormRefType<T> = {
  submit: () => void;
  getValues: () => Promise<T | undefined>;
  setValues: (data: T) => void;
  setFieldValues?: (name: string, value: any) => void;
  reset: () => void;
  isValid: () => Promise<boolean>;
  setLoading: (data: SetStateAction<boolean>) => void;
  state: Map<string, FormElementType>;
};

interface FormContextType {
  subscribe: (element: FormElementType) => void;
  unsubscribe: (elementName?: string) => void;
  getId?: () => number | string | undefined;
  onChange?: (name: string, isValid: boolean, value?: any) => Promise<void>;
  submit?: () => void;
  reset?: () => void;
  loading?: boolean;
  disabled?: boolean;
  isConfirmation?: boolean;
  disabledSubmitButton?: boolean;
}

export const FormContext = createContext<FormContextType | null>(null);

interface CustomWindow<T> extends Window {
  formRef?: FormRefType<T>;
}

function FormComponent<T>(
  {
    resetAfterSubmit = true,
    value,
    actions,
    children,
    id,
    onInvalidData,
    onSubmit,
    onChange,
    disableEnterKeySubmit = false,
  }: FormProps<T>,
  ref?: ForwardedRef<FormRefType<T>>
) {
  const [state, setState] = useState<Map<string, FormElementType>>(
    new Map<string, FormElementType>()
  );
  const validListRef = useRef<Map<string, boolean>>(new Map<string, boolean>());
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [disabledSubmitButton, setDisabledSubmitButton] = useState(true);
  const [loaded, setLoaded] = useState<boolean>(false);
  const formId = uuidv4();
  const divRef = useRef<HTMLDivElement | null>(null);
  const log = useLogger("Form");
  const customWindow = window as CustomWindow<T>;

  useEffect(() => {
    divRef.current?.addEventListener("keyup", handleEnterKey);
    setFormData(value);
    customWindow.formRef = refMethod;

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      divRef.current?.removeEventListener("keyup", handleEnterKey);
    };
  }, []);

  useMemo(() => {
    loaded && setFormData(value);
  }, [value]);

  useEffect(() => {
    setLoaded(true);
  }, [value]);

  const refMethod: FormRefType<T> = {
    submit,
    getValues,
    setValues,
    reset: handleReset,
    isValid,
    setLoading,

    state,
  };
  useImperativeHandle(ref, () => refMethod);

  function setValues(data: T) {
    setFormData(data);
  }
  async function submit() {
    await handleSubmit();
  }
  async function isValid() {
    const formData = await getFormValue<T>(value, state);

    return formData.isValid;
  }
  async function getValues() {
    const formData = await getFormValue<T>(value, state);

    if (formData.isValid) {
      return formData.data;
    }

    return undefined;
  }
  function getId() {
    if (id && value) {
      const idValue = value[id];

      if (typeof idValue === "string") {
        return idValue.toString();
      }
      if (typeof idValue === "number") {
        return Number(idValue.toString());
      }
    }

    return undefined;
  }

  async function setFormData(data: T) {
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        const component = state.get(key);

        if (typeof value === "object" && !component?.isObject) {
          const objDetails = getObjectDetail({ name: key, value });
          if (objDetails.length > 0) {
            for (const info of objDetails) {
              const currentState = await state.get(info.name)?.getValue();

              if (JSON.stringify(currentState) !== JSON.stringify(value)) {
                const field = state.get(info.name);
                field?.setValue(info.value);
                const isValidValue = await field?.isValid?.(info.value, false);
                updateValidateList(
                  info.name,
                  info.value,
                  isValidValue ?? false
                );
                log.info("setValue:", info, isValidValue);
              }
            }
          }
        } else {
          const field = state.get(key);
          field?.setValue(value);
          const isValidValue = await field?.isValid?.(value, false);
          updateValidateList(key, value, isValidValue ?? false);

          log.info("setValue:", { key: key, value: value }, isValidValue);
        }
      }
      enableSubmitButtonIfSatisfy();
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  async function setFieldValue(data: any, fieldName: string) {
    log.info("setFieldValue:", fieldName, data);

    if (data) {
      // if (fieldName.includes(".")) {
      //   const val = getValue(fieldName, data);
      //   state.get(fieldName)?.setValue(val);
      // }

      // const value = data[fieldName];

      // const key = fieldName;
      const component = state.get(fieldName);
      //TODO:
      if (typeof value === "object" && !component?.isObject) {
        const val = getValueFromObject(fieldName, data);
        component?.setValue(val);

        const isValidValue = await component?.isValid?.(val, false);
        updateValidateList(fieldName, value, isValidValue ?? false);

        // const objDetails = getObjectDetail({ name: key, value });
        // log.info("setFieldValue: objDetails --> ", objDetails);
        // if (objDetails.length > 0) {
        //   const obj = objDetails.find(item => item.name == fieldName);
        //   if (obj) {
        //     state.get(obj.name)?.setValue(obj.value);
        //     log.info("setField:", obj);
        //   }
        // }
      } else {
        const field = state.get(fieldName);
        field?.setValue(value);
        const isValidValue = await field?.isValid?.(value, false);
        updateValidateList(fieldName, value, isValidValue ?? false);
        log.info("setField:", { key: fieldName, value: value }, isValidValue);
      }
      enableSubmitButtonIfSatisfy();
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  async function handleFieldChange(
    name: string,
    newValue: any,
    isValid: boolean
  ) {
    updateValidateList(name, newValue, isValid);
    enableSubmitButtonIfSatisfy();
  }

  function updateValidateList(name: string, newValue: any, isValid: boolean) {
    if (name && validListRef.current.has(name)) {
      validListRef.current?.set(name, isValid);
      onChange?.(name, newValue, isValid);
    }
    log.info(validListRef.current);
  }

  function enableSubmitButtonIfSatisfy() {
    let isValid = true;
    validListRef.current?.forEach((value: boolean, key: string) => {
      if (value == false) {
        isValid = false;
        log.info("Not Valid", key, value);
      } else {
        log.info("Valid", key, value);
      }
    });
    setDisabledSubmitButton(!isValid);

    return isValid;
  }

  async function subscribe(element: FormElementType) {
    const elementName = element.getName();

    if (elementName) {
      state.set(elementName, element);
      const valid = await element.isValid?.(undefined, false);
      validListRef.current.set(elementName, valid ?? false);
      updateValidateList(elementName, undefined, valid ?? false);
      enableSubmitButtonIfSatisfy();
      log.info("subscribe:", elementName, valid);
      setState(state);

      if (loaded) {
        setFieldValue(value, elementName);
      }
    }
  }
  function unsubscribe(elementName?: string) {
    if (elementName) {
      state.delete(elementName);
      validListRef.current.delete(elementName);
      log.info("unsubscribe:", elementName);
      setState(state);
    }
  }
  const disabledAllComponent = (disable: boolean) => {
    setDisabled(disable);
    // biome-ignore lint/complexity/noForEach: <explanation>
    state.forEach((value) => {
      if (value.setDisabled != null) {
        value.setDisabled(disable);
      }
    });
  };
  async function handleSubmit() {
    // e?.preventDefault();

    if (onSubmit) {
      const formData = await getFormValue<T>(value, state);

      log.info("submit:", formData);
      if (formData.isValid) {
        setLoading(true);
        disabledAllComponent(true);

        const result = await onSubmit(formData.data);

        disabledAllComponent(false);
        setLoading(false);
        if (resetAfterSubmit && result) {
          handleReset();
        }
      } else {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        onInvalidData?.(formData.invalidNames!);
      }
    }

    log.info(validListRef.current);
  }

  async function handleReset() {
    // biome-ignore lint/complexity/noForEach: <explanation>
    for (const item of state) {
      // const key = item[0];
      const element = item[1];
      const name = element.getName();
      if (name) {
        if (!element.doNotResetAfterSubmit) {
          element.reset?.();
          const valid = await element.isValid?.(undefined, false);

          validListRef.current.set(name, valid ?? false);
        }
      }
    }
    // state.forEach(({ reset, doNotResetAfterSubmit, getName, isValid }) => {
    //   const name = getName();
    //   if (name) {
    //     if (!doNotResetAfterSubmit) {
    //       reset?.();
    //       const valid = isValid?.(undefined, false);
    //       validListRef.current.set(name, false);
    //     } else {
    //       validListRef.current.set(name, true);
    //     }
    //   }
    // });
    // validListRef.current?.forEach((_, key: string) => {
    //   validListRef.current.set(key, false);
    // });
    enableSubmitButtonIfSatisfy();
  }
  async function handleEnterKey(e: KeyboardEvent) {
    if (e.key === "F10") {
      const formData = await getOnlyFormValue<T>(value, state);

      log.info("F10:FormValues", formData);
    }

    if (disableEnterKeySubmit) return;
    if (e.key === "Enter") {
      submit();
    }
  }

  return (
    <FormContext.Provider
      value={{
        subscribe,
        unsubscribe,
        getId,
        submit: handleSubmit,
        reset: handleReset,
        loading,
        disabled,
        onChange: handleFieldChange,
        disabledSubmitButton: disabledSubmitButton,
      }}
    >
      <div
        role="form"
        className="h-full max-h-fit w-full "
        id={formId}
        ref={divRef}
        // onSubmit={handleSubmit}
        // noValidate
      >
        {children}
        {actions && actions}
      </div>
    </FormContext.Provider>
  );
}
// Form.defaultProps = {
//   resetAfterSubmit: true,
// };
export const Form = forwardRef(FormComponent) as <T>(
  props: FormProps<T> & { ref?: ForwardedRef<FormRefType<T>> }
) => ReturnType<typeof FormComponent>;

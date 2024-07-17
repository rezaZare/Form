import type { FormElementType } from "./formElementType";

export interface KeyValue {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  value: any;
}
export function getObjectDetail(field: KeyValue) {
  const final: KeyValue[] = [];
  if (
    !Array.isArray(field.value) &&
    typeof field.value === "object" &&
    field?.value
  ) {
    for (const [key, value] of Object.entries(field?.value)) {
      if (typeof value === "object") {
        final.push(...getObjectDetail({ name: `${field.name}.${key}`, value }));
      } else {
        final.push({ name: `${field.name}.${key}`, value });
      }
    }

    return final;
  }

  return [field];
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function getValueFromObject(fieldName: string, data: any): any {
  const fieldNames = fieldName.split(".");
  let currentLevel = data;

  for (const key of fieldNames) {
    if (
      currentLevel &&
      typeof currentLevel === "object" &&
      key in currentLevel
    ) {
      currentLevel = currentLevel[key];
    } else {
      // Return a default value or handle the case where the field doesn't exist
      return undefined;
    }
  }

  return currentLevel;
}

interface FormValue<T> {
  isValid: boolean;
  data: T | undefined;
  invalidNames?: string[];
}
interface FormElements {
  value: FormElementType;
  key: string;
}

export async function getFormValue<T>(
  value: unknown,
  state: Map<string, FormElementType>
): Promise<FormValue<T>> {
  const obj = value;
  let haveError = false;
  const invalidNames: string[] = [];
  const formElements: FormElements[] = [];

  state.forEach((val, key) => {
    formElements.push({
      key,
      value: val,
    });
  });

  for (const _state of formElements) {
    const objName = _state.key;
    const { getValue, isValid } = _state.value;
    const value = await getValue();
    const valid = await isValid?.(value, true);

    if (valid) {
      // const value = await getValue();
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      let schema = obj as any;
      const pList = objName.split(".");
      for (let i = 0; i < pList.length - 1; i++) {
        const elem = pList[i];
        if (!schema[elem]) schema[elem] = {};
        schema = schema[elem];
      }
      schema[pList[pList.length - 1]] = value ?? "";
    } else {
      haveError = true;
      invalidNames.push(objName);
    }
  }

  if (haveError) {
    return {
      isValid: false,
      data: undefined,
      invalidNames: invalidNames,
    };
  }

  return {
    isValid: true,
    data: obj as T,
  };
}
export async function getOnlyFormValue<T>(
  value: unknown,
  state: Map<string, FormElementType>
): Promise<FormValue<T>> {
  const obj = value;
  const formElements: FormElements[] = [];

  state.forEach((val, key) => {
    formElements.push({
      key,
      value: val,
    });
  });

  for (const _state of formElements) {
    const objName = _state.key;
    const { getValue } = _state.value;
    const value = await getValue();
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let schema = obj as any;
    const pList = objName.split(".");
    for (let i = 0; i < pList.length - 1; i++) {
      const elem = pList[i];
      if (!schema[elem]) schema[elem] = {};
      schema = schema[elem];
    }
    schema[pList[pList.length - 1]] = value;
  }

  return {
    isValid: true,
    data: obj as T,
  };
}

export function isDebugMode() {
  const debugMode = localStorage.getItem("debug");
  if (debugMode) {
    return true;
  }

  return false;
}

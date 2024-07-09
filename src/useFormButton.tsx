import { useContext } from "react";

import { FormContext } from "./form";

//this hook only use for the button
export function useFormButton() {
  const formContext = useContext(FormContext);

  return {
    submit: formContext?.submit,
    reset: formContext?.reset,
    formLoading: formContext?.loading,
    formDisabled: formContext?.disabled,
    disabledSubmitButton: formContext?.disabledSubmitButton,
  };
}

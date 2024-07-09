# Form

This package is made to manage React forms.

All form components must use Form Hook and implement the functions required by this hook, passing them as inputs to the hook.

## Usage

```typescript
const { onChangeForm } = useForm<string>({
  name: props.name ?? "",
  getValue,
  setValue: setValue,
  isValid,
  reset,
  setDisable: setDisabled,
  doNotResetAfterSubmit: props.doNotResetAfterSubmit,
  doNotSubscribe: props.doNotSubscribe,
});
```

Each component should send its changes to the form component via onChangeForm, so that the form can be aware of component changes.

```typescript
interface Profile {
  firstName: string;
  lastName: string;
  tel: string;
}

const handleSubmit = async (data?: Profile) => {
  console.log(data); //==> { firstName: 'John', lastName: 'Doe' }

  return true; // return true if submit was successful else return false
};

// Render
<Form<Profile> onSubmit={handleSubmit} value={state}>
  <TextInput name="firstName" required />
  <TextInput name="lastName" required />

  <Button label="Save" type={ButtonType.SUBMIT} />
</Form>;
```

In the handleSubmit method, if the return false, the form will not reset. Otherwise, the form will reset.‍

Unless the `doNotResetAfterSubmit` prop is set to true.

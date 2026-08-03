"use client";

import { ChoiceButton, Field, FieldDescription, FieldLabel, Input } from "@kuvend/ui";

export type DisplayPreference = {
  mode: "pseudonym" | "name";
  name: string;
};

const storageKey = "kuvend.displayPreference.v1";
export const defaultDisplayPreference: DisplayPreference = { mode: "pseudonym", name: "" };

export function readDisplayPreference(): DisplayPreference {
  if (typeof window === "undefined") return defaultDisplayPreference;
  try {
    const value = JSON.parse(
      localStorage.getItem(storageKey) ?? "null",
    ) as Partial<DisplayPreference> | null;
    if (value?.mode === "name" && typeof value.name === "string")
      return { mode: "name", name: value.name };
    return { ...defaultDisplayPreference };
  } catch {
    return { ...defaultDisplayPreference };
  }
}

export function saveDisplayPreference(value: DisplayPreference) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

export function displayPreferenceLabel(value: DisplayPreference) {
  return value.mode === "name" && value.name.trim() ? value.name.trim() : "Pseudonim i rastësishëm";
}

export function DisplayPreferenceEditor({
  value,
  onChange,
}: {
  value: DisplayPreference;
  onChange: (value: DisplayPreference) => void;
}) {
  return (
    <Field>
      <FieldLabel>Si dëshiron të shfaqesh?</FieldLabel>
      <div className="position-tabs identity-tabs" role="group" aria-label="Emri publik">
        <ChoiceButton
          selected={value.mode === "pseudonym"}
          onClick={() => onChange({ ...value, mode: "pseudonym" })}
        >
          Me pseudonim
        </ChoiceButton>
        <ChoiceButton
          selected={value.mode === "name"}
          onClick={() => onChange({ ...value, mode: "name" })}
        >
          Me emrin tim
        </ChoiceButton>
      </div>
      {value.mode === "pseudonym" ? (
        <FieldDescription>
          Kuvend krijon një pseudonim të rastësishëm për këtë kontribut.
        </FieldDescription>
      ) : (
        <>
          <FieldLabel htmlFor="display-public-name">Emri që dëshiron të shfaqet</FieldLabel>
          <Input
            id="display-public-name"
            value={value.name}
            onChange={(event) => onChange({ mode: "name", name: event.target.value })}
            minLength={2}
            maxLength={80}
            placeholder="Emri ose emri publik"
            aria-describedby="display-public-name-help"
          />
          <FieldDescription id="display-public-name-help">
            Shfaqet publikisht siç e shkruan dhe shënohet si i paverifikuar. Mund ta ndryshosh më
            vonë.
          </FieldDescription>
        </>
      )}
    </Field>
  );
}

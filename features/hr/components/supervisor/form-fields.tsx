"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface SupervisorFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
}

export function SupervisorFormFields<T extends FieldValues>({
  control,
}: SupervisorFormFieldsProps<T>) {
  return (
    <div className="grid gap-4">
      <Controller
        name={"name" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input
              {...field}
              id="name"
              placeholder="Masukkan nama lengkap"
              autoComplete="off"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"nip" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="nip">NIP</FieldLabel>
            <Input
              {...field}
              id="nip"
              placeholder="Masukkan NIP"
              autoComplete="off"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"field" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="field">Bidang</FieldLabel>
            <Input
              {...field}
              id="field"
              placeholder="Masukkan bidang"
              autoComplete="off"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name={"phone" as FieldPath<T>}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phone">No. HP</FieldLabel>
              <Input
                {...field}
                id="phone"
                placeholder="085xxxxx"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name={"email" as FieldPath<T>}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="email@example.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name={"maxInterns" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="maxInterns">Maksimal Intern</FieldLabel>
            <Input
              id="maxInterns"
              type="number"
              min={1}
              max={50}
              placeholder="5"
              autoComplete="off"
              value={field.value ?? 5}
              onChange={(e) => field.onChange(e.target.valueAsNumber || 5)}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}

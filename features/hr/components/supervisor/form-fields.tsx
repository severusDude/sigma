"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";

interface SupervisorFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
}

export function SupervisorFormFields<T extends FieldValues>({
  control,
}: SupervisorFormFieldsProps<T>) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Name */}
      <Controller
        name={"name" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="md:col-span-2">
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input
              {...field}
              autoFocus
              id="name"
              placeholder="Masukkan nama lengkap"
              autoComplete="off"
              maxLength={100}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* NIP */}
      <Controller
        name={"nip" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="nip">NIP</FieldLabel>
            <InputGroup>
              <InputGroupInput
                {...field}
                id="nip"
                placeholder="Masukkan NIP"
                autoComplete="off"
                maxLength={18}
                aria-invalid={fieldState.invalid}
              />
              <InputGroupAddon align="inline-end">
                {field.value.length}/18
              </InputGroupAddon>
            </InputGroup>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Field */}
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

      <div className="md:grid md:grid-cols-2 md:gap-4">
        {/* Phone */}
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

        {/* Email */}
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

      {/* Number of Interns allowed */}
      <Controller
        name={"maxInterns" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="maxInterns">Maksimal Intern</FieldLabel>
            <NumberField
              {...field}
              id="maxInterns"
              value={field.value}
              onValueChange={field.onChange}
              defaultValue={5}
              min={1}
              max={50}
            >
              <NumberFieldGroup aria-invalid={fieldState.invalid}>
                <NumberFieldInput className="text-left" />
                <NumberFieldDecrement className="rounded-none!" />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectItemType } from "@/lib/types";

interface SupervisorFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  teamOptions: { id: string; name: string }[];
}

export function SupervisorFormFields<T extends FieldValues>({
  control,
  teamOptions,
}: SupervisorFormFieldsProps<T>) {
  type TeamId = (typeof teamOptions)[number]["id"];

  const teamSelect: SelectItemType<TeamId>[] = teamOptions.map((team) => ({
    label: team.name,
    value: team.id,
  }));

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

      {/* Team */}
      <Controller
        name={"teamId" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="teamId">Team</FieldLabel>
            <Select
              value={field.value || ""}
              items={teamSelect}
              onValueChange={(val) => field.onChange(val || undefined)}
            >
              <SelectTrigger
                id="teamId"
                value={field.value}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Pilih team" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {teamOptions.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

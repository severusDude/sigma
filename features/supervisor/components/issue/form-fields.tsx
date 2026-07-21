"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { InternSelect } from "./intern-select";

interface InternOption {
  id: string;
  name: string;
}

interface IssueFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  internOptions: InternOption[];
}

export function IssueFormFields<T extends FieldValues>({
  control,
  internOptions,
}: IssueFormFieldsProps<T>) {
  return (
    <div className="grid gap-4">
      <Controller
        name={"title" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="title">Judul Rencana Kegiatan</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="title"
                placeholder="Misal: Pengolahan Data Regsosek 2024"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </InputGroup>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"description" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="block-start">
                <span className="text-xs text-muted-foreground">
                  Jelaskan ruang lingkup kegiatan ini...
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(field.value || "").length}/500
                </span>
              </InputGroupAddon>
              <InputGroupTextarea
                {...field}
                id="description"
                rows={12}
                maxLength={500}
                aria-invalid={fieldState.invalid}
                className="resize-none min-h-28"
              />
            </InputGroup>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"internProfileId" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="intern">Assign ke Intern</FieldLabel>
            <InternSelect
              options={internOptions}
              value={field.value ?? ""}
              onValueChange={(val) => field.onChange(val || undefined)}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name={"startDate" as FieldPath<T>}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="startDate">Tanggal Mulai</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="startDate"
                  type="date"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </InputGroup>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name={"endDate" as FieldPath<T>}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="endDate">Tanggal Selesai</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="endDate"
                  type="date"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </InputGroup>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  );
}

"use client";

import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { CreateInternInput } from "../../schemas/intern-schemas";

interface InternFormFieldsProps {
  control: Control<CreateInternInput>;
  departmentOptions: { id: string; name: string }[];
}

export function InternFormFields({ control, departmentOptions }: InternFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input {...field} id="name" placeholder="Masukkan nama lengkap" aria-invalid={fieldState.invalid} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="nik"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="nik">NIK</FieldLabel>
            <Input {...field} id="nik" placeholder="Masukkan NIK" aria-invalid={fieldState.invalid} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="institution"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="institution">Institusi</FieldLabel>
            <Input {...field} id="institution" placeholder="Masukkan asal institusi" aria-invalid={fieldState.invalid} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phone">No. HP</FieldLabel>
              <Input {...field} id="phone" placeholder="085xxxxx" aria-invalid={fieldState.invalid} />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input {...field} id="email" type="email" placeholder="email@example.com" aria-invalid={fieldState.invalid} />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="departmentId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="department">Departemen</FieldLabel>
            <Select value={field.value || ""} onValueChange={(val) => field.onChange(val || undefined)}>
              <SelectTrigger id="department" aria-invalid={fieldState.invalid}>
                <SelectValue placeholder="Pilih departemen" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="periodStart"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="periodStart">Tanggal Mulai</FieldLabel>
              <Input
                {...field}
                id="periodStart" type="date"
                value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value || "")}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="periodEnd"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="periodEnd">Tanggal Selesai</FieldLabel>
              <Input
                {...field}
                id="periodEnd" type="date"
                value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value || "")}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  );
}

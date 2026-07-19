"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogbookFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  issueOptions?: { id: string; title: string }[];
}

export function LogbookFormFields<T extends FieldValues>({
  control,
  issueOptions = [],
}: LogbookFormFieldsProps<T>) {
  return (
    <div className="grid gap-4">
      <Controller
        name={"date" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Tanggal</FieldLabel>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {field.value
                      ? format(new Date(field.value), "d MMMM yyyy", { locale: id })
                      : "Pilih tanggal"}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date)}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"activity" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="activity">Kegiatan</FieldLabel>
            <Textarea
              {...field}
              id="activity"
              placeholder="Deskripsikan kegiatan yang dilakukan"
              rows={4}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"duration" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="duration">Durasi (menit)</FieldLabel>
            <Input
              {...field}
              id="duration"
              type="number"
              min={1}
              max={480}
              placeholder="480"
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {issueOptions.length > 0 && (
        <Controller
          name={"issueId" as FieldPath<T>}
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="issue">Tugas Terkait</FieldLabel>
              <Select
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || undefined)}
              >
                <SelectTrigger id="issue">
                  <SelectValue placeholder="Pilih tugas (opsional)" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {issueOptions.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, ChevronsUpDownIcon, ClockIcon } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
      {/* Date & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name={"date" as FieldPath<T>}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Tanggal Kegiatan</FieldLabel>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      autoFocus
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {field.value
                        ? format(new Date(field.value), "EEEE, d MMMM yyyy", {
                            locale: id,
                          })
                        : "Pilih tanggal"}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(
                          new Date(
                            Date.UTC(
                              date.getFullYear(),
                              date.getMonth(),
                              date.getDate(),
                            ),
                          ),
                        );
                      }
                    }}
                    locale={id}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Durasi</span>
          <div className="flex items-center flex-1 gap-2">
            <Controller
              name={"startTime" as FieldPath<T>}
              control={control}
              render={({ field }) => (
                <InputGroup>
                  <InputGroupAddon>
                    <ClockIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="time"
                    value={field.value || "08:00"}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </InputGroup>
              )}
            />
            <span className="text-xs text-muted-foreground shrink-0">s/d</span>
            <Controller
              name={"endTime" as FieldPath<T>}
              control={control}
              render={({ field, fieldState }) => (
                <InputGroup>
                  <InputGroupAddon>
                    <ClockIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="time"
                    value={field.value || "16:00"}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                  {fieldState.error && (
                    <p className="text-[10px] text-destructive mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </InputGroup>
              )}
            />
          </div>
        </div>
      </div>

      {/* Activity */}
      <Controller
        name={"activity" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="activity">Deskripsi Kegiatan</FieldLabel>

            <InputGroup>
              <InputGroupAddon align="block-start">
                <span className="text-xs text-muted-foreground">
                  Apa yang Anda kerjakan hari ini?
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(field.value || "").length}/500
                </span>
              </InputGroupAddon>
              <InputGroupTextarea
                {...field}
                id="activity"
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

      {/* Issue (searchable combobox) */}
      {issueOptions.length > 0 && (
        <ComboBoxField
          control={control}
          name={"issueId" as FieldPath<T>}
          options={issueOptions}
        />
      )}
    </div>
  );
}

function ComboBoxField<T extends FieldValues>({
  control,
  name,
  options,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  options: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedLabel = options.find((o) => o.id === field.value)?.title;

        return (
          <Field>
            <FieldLabel htmlFor="issue">Tugas Terkait</FieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between w-full text-xs font-normal"
                  >
                    {selectedLabel || "Pilih tugas (opsional)"}
                    <ChevronsUpDownIcon className="ml-2 opacity-50 size-4 shrink-0" />
                  </Button>
                }
              />
              <PopoverContent className="w-(--anchor-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari tugas..." />
                  <CommandEmpty>Tidak ada tugas ditemukan</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.title}
                          onSelect={() => {
                            field.onChange(
                              field.value === option.id ? "" : option.id,
                            );
                            setOpen(false);
                          }}
                        >
                          {option.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>
        );
      }}
    />
  );
}

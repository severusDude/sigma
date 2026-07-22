"use client";

import { useMemo, useState } from "react";

import { ChevronDownIcon } from "lucide-react";

import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface InternOption {
  id: string;
  name: string;
}

interface InternSelectProps {
  options: InternOption[];
  value: string | string[];
  onValueChange: (value: string | string[] | undefined) => void;
  multiple?: boolean;
}

export function InternSelect({
  options,
  value,
  onValueChange,
  multiple = false,
}: InternSelectProps) {
  const [open, setOpen] = useState(false);

  const dedupedOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  }, [options]);

  const selectedInterns = multiple ? (value as string[]) : [];

  function toggleIntern(id: string) {
    if (multiple) {
      const next = selectedInterns.includes(id)
        ? selectedInterns.filter((i) => i !== id)
        : [...selectedInterns, id];
      onValueChange(next);
    } else {
      onValueChange(id);
      setOpen(false);
    }
  }

  function handleSelectNone() {
    if (multiple) {
      onValueChange([]);
      setOpen(false);
    } else {
      onValueChange(undefined);
      setOpen(false);
    }
  }

  const selectedName = !multiple
    ? dedupedOptions.find((o) => o.id === value)?.name
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="justify-between w-full h-8 text-xs font-normal min-w-40"
          >
            <span className="truncate">
              {multiple
                ? selectedInterns.length === 0
                  ? "Semua Intern"
                  : `${selectedInterns.length} intern dipilih`
                : (selectedName ?? "Semua Intern (default)")}
            </span>
            <ChevronDownIcon className="size-3.5 ml-2 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="p-0 w-(--anchor-width)" align="start">
        <Command>
          <CommandInput placeholder="Cari intern..." />
          <CommandList>
            <CommandEmpty>Tidak ada intern.</CommandEmpty>
            <CommandGroup>
              {!multiple && (
                <CommandItem
                  value=""
                  onSelect={handleSelectNone}
                  data-checked={!value}
                >
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">SA</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">Semua Intern</span>
                </CommandItem>
              )}
              {dedupedOptions.map((intern) => (
                <CommandItem
                  key={intern.id}
                  value={intern.id}
                  onSelect={() => toggleIntern(intern.id)}
                  data-checked={
                    multiple
                      ? selectedInterns.includes(intern.id)
                      : value === intern.id
                  }
                >
                  {multiple && (
                    <Checkbox
                      checked={selectedInterns.includes(intern.id)}
                      className="size-3.5"
                    />
                  )}
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {initials(intern.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-nowrap">{intern.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {multiple && selectedInterns.length > 0 && (
          <div className="flex items-center gap-1.5 p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 text-xs"
              onClick={() => {
                handleSelectNone();
                setOpen(false);
              }}
            >
              Reset filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

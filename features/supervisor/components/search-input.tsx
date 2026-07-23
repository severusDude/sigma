"use client"

import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useDebounce } from "@uidotdev/usehooks"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Cari nama ...",
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300)

  useEffect(() => {
    onChange(debouncedValue)
  }, [debouncedValue, onChange])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <SearchIcon className="size-4 opacity-50" />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    </InputGroup>
  )
}

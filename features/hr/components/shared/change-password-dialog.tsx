"use client";

import { useState } from "react";

import z from "zod";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { EyeClosedIcon, EyeIcon, LockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ButtonGroup } from "@/components/ui/button-group";
import { setPasswordSchema } from "@/features/auth/schemas";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { setPassword } from "../../actions/set-password-action";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChangePasswordDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.input<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    mode: "onChange",
    values: {
      userId: userId ?? "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutateAsync, isPending: isSubmitting } = useMutation({
    mutationKey: ["set-password", userId],
    mutationFn: async (values: z.input<typeof setPasswordSchema>) => {
      const result = await setPassword(values);

      if (!result.success) throw new Error(result.error!);
      return result.data!;
    },
  });

  async function onSubmit(values: z.input<typeof setPasswordSchema>) {
    console.log("clicked");
    const mutationPromise = mutateAsync(values);

    toast.promise(mutationPromise, {
      loading: "Menyimpan perubahan... ",
      success: "Perubahan berhasil disimpan",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menyimpan perubahan",
    });
    try {
      await mutationPromise;
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  }

  function _resetDialog() {
    form.reset({
      userId: userId,
      newPassword: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      _resetDialog();
    }

    onOpenChange(isOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="w-5xl!">
        <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <LockIcon />
              </AlertDialogMedia>
              <AlertDialogTitle>Ubah Password</AlertDialogTitle>
              <AlertDialogDescription>
                Ubah password untuk akun{" "}
                <span className="font-medium text-foreground">{userName}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Alert variant="info">
              <AlertDescription>
                User tidak akan diarahkan untuk mengganti password ini.
              </AlertDescription>
            </Alert>

            {/* New Password */}
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="newPassword">Password Baru</FieldLabel>
                  <ButtonGroup>
                    <Input
                      {...field}
                      id="newPassword"
                      placeholder="Masukkan password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    <Button
                      size="icon"
                      type="button"
                      variant="outline"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <EyeIcon
                        size={16}
                        className={cn(showPassword ? "hidden" : "block")}
                      />
                      <EyeClosedIcon
                        size={16}
                        className={cn(showPassword ? "block" : "hidden")}
                      />
                    </Button>
                  </ButtonGroup>

                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Confirm Password */}
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="confirmPassword">
                    Konfirmasi Password
                  </FieldLabel>
                  <ButtonGroup>
                    <Input
                      {...field}
                      id="confirmPassword"
                      placeholder="Masukkan password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    <Button
                      size="icon"
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <EyeIcon
                        size={16}
                        className={cn(showConfirmPassword ? "hidden" : "block")}
                      />
                      <EyeClosedIcon
                        size={16}
                        className={cn(showConfirmPassword ? "block" : "hidden")}
                      />
                    </Button>
                  </ButtonGroup>

                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                className="px-4 py-4"
              >
                Batal
              </AlertDialogCancel>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 px-8 py-4"
              >
                {isSubmitting && <Spinner />}
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </AlertDialogFooter>
          </FieldGroup>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

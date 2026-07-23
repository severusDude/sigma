"use client";

import { useState } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { SupervisorProfile } from "@/generated/prisma/client";

import {
  changePassword,
  toggleSupervisorStatus,
} from "../actions/profile-actions";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini harus diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage({
  user,
  profile,
}: {
  user: { id: string; name: string; email: string; image?: string | null; username?: string | null };
  profile: SupervisorProfile | null;
}) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingState, setPendingState] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(profile?.isActive ?? true);
  const [toggling, setToggling] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(data: PasswordForm) {
    const result = await changePassword(data.currentPassword, data.newPassword);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Password berhasil diubah");
    reset();
  }

  async function handleToggle() {
    setPendingState(!isActive);
    setConfirmOpen(true);
  }

  async function confirmToggle() {
    setConfirmOpen(false);
    setToggling(true);
    const result = await toggleSupervisorStatus(user.id, pendingState);

    if (!result.success) {
      toast.error(result.error);
      setToggling(false);
      return;
    }

    setIsActive(pendingState);
    setToggling(false);
    toast.success(pendingState ? "Status aktif" : "Status nonaktif");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Informasi akun dan pengaturan profile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto Profile</CardTitle>
          <CardDescription>Upload foto profile Anda</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-20">
            <AvatarImage src={previewUrl ?? user.image ?? ""} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Format: JPG, PNG. Maksimal 2MB. (Fitur upload belum tersedia)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Data Diri</CardTitle>
            <CardDescription>Informasi data diri Anda (tidak dapat diubah)</CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Aktif" : "Tidak Aktif"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Nama Lengkap</FieldLabel>
              <Input value={user.name} disabled />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={user.email} disabled />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input value={(user as { username?: string }).username ?? "-"} disabled />
            </Field>
            <Field>
              <FieldLabel>NIP</FieldLabel>
              <Input value={profile?.nip ?? "-"} disabled />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Bidang</FieldLabel>
              <Input value={profile?.field ?? "-"} disabled />
            </Field>
            <Field>
              <FieldLabel>Telepon</FieldLabel>
              <Input value={profile?.phone ?? "-"} disabled />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Max Intern Bimbingan</FieldLabel>
              <Input value={profile?.maxInterns != null ? String(profile.maxInterns) : "-"} disabled />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ketersediaan</CardTitle>
          <CardDescription>Atur ketersediaan Anda untuk menerima intern bimbingan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Terima Intern Baru</p>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? "Anda tersedia untuk menerima intern bimbingan"
                  : "Anda tidak tersedia untuk menerima intern bimbingan"}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={toggling}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingState
                ? "Anda akan mengaktifkan ketersediaan untuk menerima intern bimbingan."
                : "Anda akan menonaktifkan ketersediaan untuk menerima intern bimbingan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              Ya, {pendingState ? "Aktifkan" : "Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
          <CardDescription>Password minimal 8 karakter</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field>
              <FieldLabel>Password Saat Ini</FieldLabel>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  {...register("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                >
                  {showCurrent ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <FieldError>{errors.currentPassword.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Password Baru</FieldLabel>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                >
                  {showNew ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <FieldError>{errors.newPassword.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel>Konfirmasi Password Baru</FieldLabel>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                >
                  {showConfirm ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <FieldError>{errors.confirmPassword.message}</FieldError>
              )}
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              Simpan Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

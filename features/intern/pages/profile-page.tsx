"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EyeIcon, EyeOffIcon, Loader2Icon, UploadIcon } from "lucide-react";
import imageCompression from "browser-image-compression";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { InternProfile } from "@/generated/prisma/client";

import { changePassword } from "../actions/profile-actions";


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
  profile: (InternProfile & { team?: { name: string } | null }) | null;
}) {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Hanya file gambar yang diizinkan");
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File terlalu besar. Maksimal 2MB")
        return
      }
      setAvatarFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  async function handleUpload() {
    if (!avatarFile) return

    setUploading(true)
    try {
      const compressedFile = await imageCompression(avatarFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.8,
      })

      const formData = new FormData()
      formData.append("file", compressedFile, "avatar.webp")

      const res = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Gagal mengupload foto profile")
      }

      const { url } = await res.json()

      setPreviewUrl(url)
      setAvatarFile(null)
      toast.success("Foto profile berhasil diperbarui")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengupload foto profile")
    } finally {
      setUploading(false)
    }
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function formatDate(date: Date | string | null | undefined) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  }

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
          <div className="space-y-3 flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={!avatarFile || uploading}
              >
                {uploading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <UploadIcon className="size-4" />
                )}
                {uploading ? "Mengupload..." : "Simpan"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Format: JPG, PNG, WebP. Maksimal 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Diri</CardTitle>
          <CardDescription>Informasi data diri Anda (tidak dapat diubah)</CardDescription>
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
              <FieldLabel>NIK</FieldLabel>
              <Input value={profile?.nik ?? "-"} disabled />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Institusi</FieldLabel>
              <Input value={profile?.institution ?? "-"} disabled />
            </Field>
            <Field>
              <FieldLabel>Telepon</FieldLabel>
              <Input value={profile?.phone ?? "-"} disabled />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Team</FieldLabel>
              <Input value={profile?.team?.name ?? "-"} disabled />
            </Field>
            <Field>
              <FieldLabel>Periode</FieldLabel>
              <Input
                value={
                  profile?.periodStart && profile?.periodEnd
                    ? `${formatDate(profile.periodStart)} — ${formatDate(profile.periodEnd)}`
                    : "-"
                }
                disabled
              />
            </Field>
          </div>
        </CardContent>
      </Card>

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

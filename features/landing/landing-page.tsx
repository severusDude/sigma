"use client";

import { useState } from "react";
import {
  Zap,
  Menu,
  X,
  Check,
  ChevronRight,
  Star,
  Building2,
  Users,
  FileText,
  MapPin,
  QrCode,
  GraduationCap,
  BarChart3,
  Shield,
  ArrowUpRight,
  Sigma,
} from "lucide-react";
import { ToggleTheme } from "@/features/landing/components/toggle-theme";

const S = {
  section: "border-y-2 border-black",
  container: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
  btn: "inline-flex items-center gap-2 px-6 py-3 border-2 border-black font-body font-medium text-sm transition-all duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] active:translate-x-1 active:translate-y-1",
  btnPrimary:
    "bg-black text-white shadow-hard-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-hard",
  btnSecondary:
    "bg-white text-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
  card: "bg-white border-2 border-black shadow-hard p-6",
  label:
    "inline-block px-3 py-1 border-2 border-black text-xs font-body font-bold uppercase tracking-wider w-fit",
};

const stats = [
  { value: "100%", label: "Informasi Lengkap di Hari Pertama" },
  { value: "90%", label: "Logbook Tepat Waktu" },
  { value: "0", label: "Dokumen Fisik (Zero Paper)" },
  { value: "Real-time", label: "Monitoring Seluruh Aktivitas" },
];

const features = [
  {
    icon: FileText,
    title: "Logbook Digital",
    desc: "Catat kegiatan harian dengan mudah. Supervisor bisa review dan beri feedback langsung.",
  },
  {
    icon: BarChart3,
    title: "Penilaian Terstruktur",
    desc: "5 komponen penilaian objektif. Nilai otomatis terkalkulasi dan terdokumentasi.",
  },
  {
    icon: Shield,
    title: "Dokumen Otomatis",
    desc: "Generate sertifikat, surat tugas, dan rekap absensi dalam 1 klik.",
  },
];

const steps = [
  {
    num: "01",
    title: "Daftar & Ditempatkan",
    desc: "HR mendaftarkan Intern, menentukan Supervisor dan team penempatan. Intern langsung mendapat informasi lengkap di dashboard personal.",
  },
  {
    num: "02",
    title: "Aktivitas Harian",
    desc: "Intern isi logbook, lakukan presensi, dan ajukan bimbingan. Supervisor monitoring secara real-time.",
  },
  {
    num: "03",
    title: "Evaluasi & Selesai",
    desc: "Supervisor menilai, HR generate dokumen kelengkapan. Sertifikat terbit otomatis dengan QR code verifikasi.",
  },
];

const personas = [
  {
    role: "Intern",
    bg: "bg-[#b7c6c2]",
    shadow: "",
    text: "text-black",
    items: [
      "Informasi magang jelas di hari pertama",
      "Logbook & presensi digital dari HP",
      "Download sertifikat & dokumen sendiri",
    ],
  },
  {
    role: "HR",
    bg: "bg-[#ffe17c]",
    shadow: "shadow-hard-lg",
    text: "text-black",
    items: [
      "Kelola siklus magang dari A-Z",
      "Generate dokumen batch untuk banyak Intern",
      "Dashboard monitoring real-time",
    ],
  },
  {
    role: "Supervisor",
    bg: "bg-[#272727]",
    shadow: "",
    text: "text-white",
    items: [
      "Monitoring logbook Intern bimbingan",
      "Review & beri feedback langsung",
      "Penilaian terstruktur dengan format baku",
    ],
  },
  {
    role: "Admin",
    bg: "bg-white",
    shadow: "",
    text: "text-black",
    items: [
      "Konfigurasi sistem & template dokumen",
      "Audit log seluruh aktivitas",
      "Manajemen user & role",
    ],
  },
];

const testimonials = [
  {
    quote:
      "Dulu rekap logbook butuh 2 hari. Sekarang cukup lihat dashboard — status semua Intern terpantau real-time.",
    name: "Mbak Fitri",
    role: "HR — BPS Kota Tasikmalaya",
    rating: 5,
  },
  {
    quote:
      "Intern langsung tahu tugas dan Supervisor sejak hari pertama. Tidak ada lagi kebingungan di minggu awal.",
    name: "Pak Dedi",
    role: "Supervisor — BPS Kota Tasikmalaya",
    rating: 5,
  },
  {
    quote:
      "Isi logbook dari HP, check-in pakai QR code. Simpel banget! Sertifikat juga bisa didownload langsung.",
    name: "Rizky",
    role: "Intern — BPS Kota Tasikmalaya",
    rating: 5,
  },
];

const partners = [
  "BPS",
  "BPS TASIKMALAYA",
  "Perguruan Tinggi",
  "Perseorangan",
  "BPS",
  "BPS TASIKMALAYA",
  "Perguruan Tinggi",
  "Perseorangan",
];

const navItems: { label: string; href: string }[] = [
  // { label: 'Beranda', href: '#beranda' },
  // { label: 'Fitur', href: '#fitur' },
  // { label: 'Pengguna', href: '#pengguna' },
  // { label: 'Kontak', href: '#kontak' },
];

function Nav() {
  const [open, setOpen] = useState(false);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 py-8 left-0 right-0 z-50 h-16 bg-[#ffe17c] border-b-2 border-black">
      <div
        className={S.container + " flex items-center justify-between h-full"}
      >
        <a
          href="#beranda"
          onClick={(e) => handleNav(e, "#beranda")}
          className="flex items-center gap-2"
        >
          <span className="flex items-center justify-center size-8 bg-black">
            <Sigma className="w-5 h-5 text-[#ffe17c]" />
          </span>
          <span className="font-display text-xl font-extrabold text-black tracking-tight">
            SIGMA
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleNav(e, item.href)}
              className="font-body text-sm font-medium text-black hover:opacity-60 transition-opacity"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ToggleTheme />
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#ffe17c] border-t-2 border-black absolute top-20 left-0 right-0">
          <div className="flex flex-col p-6 gap-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNav(e, item.href)}
                className="font-body text-base font-medium text-black py-2"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section
      id="beranda"
      className="relative pt-16 bg-[#ffe17c] border-b-2 border-black overflow-hidden md:h[100vh-26px]"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className={"relative z-10 " + S.container + " py-16 lg:py-24"}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Hero Content */}
          <div className="flex flex-col gap-8">
            <span className={S.label + " bg-white"}>
              BPS Kota Tasikmalaya — Sistem Informasi Management Magang
            </span>

            <div>
              <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold text-black leading-[0.92] tracking-tighter">
                Sistem Magang BPS
                <span
                  className="block text-transparent"
                  style={{
                    WebkitTextStroke: "2px #000",
                    WebkitTextFillColor: "transparent",
                    textShadow: "none",
                  }}
                >
                  Kota Tasikmalaya
                </span>
              </h1>
              <p className="mt-6 font-body text-lg text-black/70 max-w-lg leading-relaxed">
                Platform digital untuk mengelola magang di BPS Kota Tasikmalaya
                — dari penempatan, logbook, presensi, hingga penerbitan
                sertifikat, dalam satu ekosistem terpadu.
              </p>
            </div>

            {/* Stats Section */}
            {/*<div className="grid grid-cols-3 gap-6 py-4 border-y-2 border-black/20">
              {stats.map((s) => (
                <div key={s.value}>
                  <div className="font-display text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold text-black leading-none tracking-tight">
                    {s.value}
                  </div>
                  <div className="mt-1 font-body text-xs text-black/60 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>*/}

            <div className="flex flex-wrap gap-4">
              <a
                href="/sign-in"
                className={S.btn + " " + S.btnSecondary + " px-8 py-4"}
              >
                Kontribusi Sekarang
              </a>
            </div>
          </div>

          {/* Hero Ilustration */}
          <div className="relative">
            <div className="bg-white border-2 border-black rounded-2xl shadow-hard-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-black">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-body text-xs font-bold text-black/40 uppercase tracking-wider">
                    Dashboard Intern
                  </div>
                  <span
                    className={
                      S.label + " text-xs py-0.5 px-2 bg-[#b7c6c2] border-black"
                    }
                  >
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-lg bg-[#b7c6c2]/70 border border-black/10 p-3 flex flex-col justify-between">
                    <span className="font-mono text-xs text-black/50">
                      Pembimbing
                    </span>
                    <span className="font-body text-sm font-bold text-black">
                      Pak Dedi
                    </span>
                  </div>
                  <div className="h-16 rounded-lg bg-[#171e19] border border-black/10 p-3 flex flex-col justify-between">
                    <span className="font-mono text-xs text-white/50">
                      Team
                    </span>
                    <span className="font-body text-sm font-bold text-white">
                      Statistik
                    </span>
                  </div>
                </div>
                <div className="border-t-2 border-black/10 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-black">
                      Logbook Hari Ini
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      3/5
                    </span>
                  </div>
                  <div className="h-2 bg-black/10 rounded-none">
                    <div className="h-full w-3/5 bg-[#b7c6c2] rounded-none" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-black text-white font-body text-xs font-bold flex items-center justify-center border-2 border-black cursor-pointer hover:bg-[#ffe17c] hover:text-black transition-colors">
                    Isi Logbook
                  </div>
                  <div className="flex-1 h-8 bg-white text-black font-body text-xs font-bold flex items-center justify-center border-2 border-black cursor-pointer hover:bg-black hover:text-white transition-colors">
                    Check-in
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofBar() {
  return (
    <div className="bg-[#171e19] border-b-2 border-black overflow-hidden py-5">
      <div
        className="flex overflow-x-hidden whitespace-nowrap"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        }}
      >
        <div
          className="flex gap-16 animate-[marquee_30s_linear_infinite]"
          style={{ willChange: "transform" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.animationPlayState = "paused")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.animationPlayState = "running")
          }
        >
          {[...partners, ...partners].map((name, i) => (
            <span
              key={i}
              className="font-display text-lg font-extrabold text-[#b7c6c2] opacity-50 tracking-wide"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProblemVsSolution() {
  return (
    <section className={S.section + " bg-white"}>
      <div className={S.container + " py-16 lg:py-24"}>
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-black tracking-tight">
            Dari Manual ke Digital
          </h2>
          <p className="mt-3 font-body text-base text-black/60">
            Lihat perbedaan sebelum dan sesudah menggunakan SIGMA
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#f4f4f5] border-2 border-black/30 border-dashed p-8 opacity-70">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-10 h-10 bg-black/10 border-2 border-black/30">
                <X className="w-5 h-5 text-black/40" />
              </span>
              <h3 className="font-display text-xl font-bold text-black">
                Sebelum SIGMA
              </h3>
            </div>
            <ul className="space-y-4">
              {[
                "Informasi magang tidak jelas — Intern bingung hari pertama",
                "Logbook dikumpulkan manual (buku fisik / file terpisah)",
                "Presensi dicatat di kertas — rekap manual",
                "Sertifikat diketik satu per satu — butuh 7 hari",
                "Tidak ada dashboard monitoring real-time",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 font-body text-sm text-black/60"
                >
                  <X className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#ffe17c] border-2 border-black shadow-hard-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-10 h-10 bg-black">
                <Check className="w-5 h-5 text-[#ffe17c]" />
              </span>
              <h3 className="font-display text-xl font-bold text-black">
                Setelah SIGMA
              </h3>
            </div>
            <ul className="space-y-4">
              {[
                "Informasi lengkap di dashboard personal — hari pertama siap!",
                "Logbook digital — real-time, bisa direview Supervisor",
                "Presensi QR code & geofence — rekap otomatis",
                "Generate sertifikat & dokumen dalam 1 klik",
                "Dashboard monitoring untuk Admin, HR, dan Supervisor",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 font-body text-sm text-black"
                >
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-black" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section
      id="fitur"
      className={"border-y-2 border-black bg-[#ffe17c] scroll-mt-16"}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className={"relative z-10 " + S.container + " py-16 lg:py-24"}>
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-black tracking-tight">
            Hal Yang Ditawarkan SIGMA
          </h2>
          <p className="mt-3 font-body text-base text-black/60">
            Sistem yang membantu mengelola proses program magang
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white border-2 border-black p-6 transition-all duration-200 shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              <span className="flex items-center justify-center w-16 h-16 bg-[#b7c6c2] border-2 border-black transition-colors duration-200 group-hover:bg-[#ffe17c] mb-5">
                <f.icon className="w-8 h-8 text-black" />
              </span>
              <h3 className="font-display text-xl font-extrabold text-black tracking-tight mb-2">
                {f.title}
              </h3>
              <p className="font-body text-sm text-black/60 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className={"border-y-2 border-black bg-[#171e19]"}>
      <div className={S.container + " py-16 lg:py-24"}>
        <div className="text-center mb-16">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-white tracking-tight">
            Cara Kerja SIGMA
          </h2>
          <p className="mt-3 font-body text-base text-white/40">
            Tiga langkah sederhana — dari pendaftaran hingga kelulusan
          </p>
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-0 md:gap-0">
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-[#272727] -translate-y-1/2 z-0" />
          <div className="flex flex-col md:flex-row gap-12 md:gap-0 w-full relative z-10">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="flex-1 flex flex-col items-center text-center md:px-6"
              >
                <div className="relative flex items-center justify-center w-14 h-14 border-4 border-[#b7c6c2] rounded-full bg-[#171e19] mb-6">
                  <span className="font-display text-lg font-extrabold text-[#b7c6c2]">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-display text-lg font-extrabold text-white tracking-tight mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-white/50 leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonasSection() {
  return (
    <section id="pengguna" className={S.section + " bg-white scroll-mt-16"}>
      <div className={S.container + " py-16 lg:py-24"}>
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-black tracking-tight">
            Dibuat untuk Semua Pihak
          </h2>
          <p className="mt-3 font-body text-base text-black/60">
            Setiap stakeholder mendapat pengalaman yang sesuai perannya
          </p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {personas.map((p) => (
            <div
              key={p.role}
              className={
                p.bg +
                " border-2 border-black p-6 " +
                p.shadow +
                " flex flex-col transition-all duration-200 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              }
            >
              <span
                className={
                  S.label + " bg-white border-black text-xs mb-5 self-start"
                }
              >
                {p.role}
              </span>
              <ul className="space-y-3 flex-1">
                {p.items.map((item) => (
                  <li
                    key={item}
                    className={
                      "flex items-start gap-3 font-body text-sm " +
                      (p.text === "text-white"
                        ? "text-white/80"
                        : "text-black/70")
                    }
                  >
                    <Check
                      className={
                        "w-4 h-4 mt-0.5 shrink-0 " +
                        (p.text === "text-white" ? "text-white" : "text-black")
                      }
                    />
                    <span
                      className={
                        p.text === "text-white"
                          ? "text-white font-medium"
                          : "text-black font-medium"
                      }
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className={"border-y-2 border-black bg-[#b7c6c2]"}>
      <div className={S.container + " py-16 lg:py-24"}>
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold text-black tracking-tight">
            Apa Kata Mereka
          </h2>
          <p className="mt-3 font-body text-base text-black/60">
            Testimoni dari pengguna SIGMA di BPS Kota Tasikmalaya
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white border-2 border-black p-6"
              style={{ borderRadius: "2px 1.5rem 2px 1.5rem" }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-[#ffbc2e] text-[#ffbc2e]"
                  />
                ))}
              </div>
              <p className="font-body text-sm text-black/70 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t-2 border-black/10 pt-4">
                <div className="font-display text-sm font-extrabold text-black">
                  {t.name}
                </div>
                <div className="font-body text-xs text-black/50">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section
      className={
        "border-y-2 border-black bg-[#ffe17c] overflow-hidden relative"
      }
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className={
          "relative z-10 " + S.container + " py-20 lg:py-28 text-center"
        }
      >
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-extrabold text-black tracking-tight max-w-3xl mx-auto leading-[0.92]">
          Siap Digitalisasi Program Magang{" "}
          <span
            className="block text-transparent"
            style={{
              WebkitTextStroke: "2px #000",
              WebkitTextFillColor: "transparent",
            }}
          >
            di Instansi Anda?
          </span>
        </h2>
        <p className="mt-6 font-body text-lg text-black/70 max-w-xl mx-auto">
          Bergabung dengan BPS Kota Tasikmalaya dalam transformasi digital
          manajemen magang. Mulai dari yang sederhana, tanpa ribet.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href="#" className={S.btn + " " + S.btnPrimary + " px-10 py-4"}>
            Ajukan Demo Sekarang <ArrowUpRight className="w-4 h-4" />
          </a>
          <a href="#" className={S.btn + " " + S.btnSecondary + " px-10 py-4"}>
            Hubungi Kami
          </a>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer id="kontak" className="bg-[#171e19] border-t-2 border-black">
      <div className={S.container + " py-16"}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Info Section Footer */}
          <div>
            <a href="#" className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-10 h-10 bg-[#ffe17c]">
                <Sigma className="w-5 h-5 text-black" />
              </span>
              <span className="font-display text-xl font-extrabold text-white tracking-tight">
                SIGMA
              </span>
            </a>
            <p className="font-body text-sm text-white/40 leading-relaxed">
              Sistem Informasi Management Magang untuk BPS Kota Tasikmalaya.
              Digitalisasi program magang dari hulu ke hilir.
            </p>
          </div>
          <div></div>
          <div></div>
          {/* Adress Section Footer */}
          <div>
            <h4 className="font-body text-xs font-bold text-white/60 uppercase tracking-widest mb-4">
              Kontak
            </h4>
            <ul className="space-y-3">
              <li className="font-body text-sm text-white/40">
                BPS Kota Tasikmalaya
              </li>
              <li className="font-body text-sm text-white/40">
                Jln. Sukarindik No. 71
              </li>
              <li className="font-body text-sm text-white/40">
                Tasikmalaya 46151
              </li>
              <li>
                <a
                  href="mailto:sigma@bpstasikmalaya.go.id"
                  className="font-body text-sm text-white/40 hover:text-white transition-colors"
                >
                  sigma@bpstasikmalaya.go.id
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t-2 border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/30">
            &copy; 2026 SIGMA — BPS Kota Tasikmalaya. All rights reserved.
          </p>
          <div className="flex gap-3">
            {[Building2, GraduationCap, Shield, BarChart3].map((Icon, i) => (
              <div
                key={i}
                className="flex items-center justify-center w-10 h-10 bg-[#272727] border border-white/10 text-white/40 hover:bg-[#ffe17c] hover:text-black hover:border-black transition-all cursor-pointer"
              >
                <Icon className="w-5 h-5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main>
      <Nav />
      <HeroSection />
      <SocialProofBar />
      <ProblemVsSolution />
      <FeatureGrid />
      <PersonasSection />
      <FooterSection />
    </main>
  );
}

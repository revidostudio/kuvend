"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Info,
  LockKeyhole,
  Menu,
  ShieldCheck,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { Button, Card, CardContent, Progress, ProgressLabel, ProgressValue } from "./primitives";
import { cn } from "./lib";

export function AppShell({
  children,
  action,
  active = "proposals",
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  active?: "proposals" | "how" | "transparency";
}) {
  const links = [
    { id: "proposals", label: "Propozimet", href: "/" },
    { id: "how", label: "Si funksionon", href: "/#si-funksionon" },
    { id: "transparency", label: "Transparenca", href: "/transparenca" },
  ] as const;
  return (
    <div className="min-h-dvh bg-[var(--kuvend-canvas)] text-[var(--kuvend-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--kuvend-border)] bg-[var(--kuvend-canvas)]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[var(--kuvend-content)] items-center gap-4 px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Hap menunë">
            <Menu />
          </Button>
          <a
            href="/"
            className="mr-auto text-xl font-bold tracking-tight text-[var(--kuvend-ink)] sm:text-2xl"
          >
            Kuvend
          </a>
          <nav aria-label="Kryesor" className="hidden items-stretch self-stretch md:flex">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                aria-current={active === link.id ? "page" : undefined}
                className="relative flex items-center px-4 text-sm font-medium text-[var(--kuvend-ink-soft)] hover:text-[var(--kuvend-ink)] aria-[current=page]:text-[var(--kuvend-ink)] aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-4 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-[var(--kuvend-red)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          {action}
        </div>
        <div className="border-t border-[var(--kuvend-border)]">
          <div className="mx-auto flex h-9 max-w-[var(--kuvend-content)] items-center justify-center gap-2 px-4 text-xs text-[var(--kuvend-ink-soft)]">
            <ShieldCheck className="size-3.5" /> I pavarur dhe joqeveritar
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

export function TrustNotice({
  title = "Privatësia jote është e mbrojtur",
  children,
  compact = false,
}: {
  title?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 border-l-2 border-[var(--kuvend-focus)] bg-[var(--kuvend-surface)] p-4",
        compact && "p-3",
      )}
    >
      <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[var(--kuvend-focus)]" />
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-[var(--kuvend-ink)]">{title}</p>
        <div className="text-sm leading-5 text-[var(--kuvend-ink-soft)]">{children}</div>
      </div>
    </div>
  );
}

export function ProposalCard({
  href,
  title,
  summary,
  category,
  location,
  status,
  turnout,
}: {
  href: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  status: string;
  turnout?: number;
}) {
  return (
    <a
      href={href}
      className="group block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25"
    >
      <Card className="h-full transition-colors group-hover:border-[var(--kuvend-border-strong)]">
        <CardContent className="grid gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--kuvend-ink-soft)]">
            <span className="font-medium text-[var(--kuvend-red)]">{category}</span>
            <span aria-hidden>·</span>
            <span>{location}</span>
            <span aria-hidden>·</span>
            <span>{status}</span>
          </div>
          <h2 className="text-lg font-semibold leading-6 tracking-tight text-[var(--kuvend-ink)] sm:text-xl">
            {title}
          </h2>
          <p className="line-clamp-3 text-sm leading-6 text-[var(--kuvend-ink-soft)]">{summary}</p>
          <div className="flex min-h-8 items-center justify-between border-t border-[var(--kuvend-border)] pt-3 text-xs text-[var(--kuvend-ink-soft)]">
            <span>
              {turnout ? `${turnout.toLocaleString("sq-AL")} pjesëmarrës` : "Hap për pjesëmarrje"}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-[var(--kuvend-ink)]">
              Shiko <ChevronRight className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export function Wizard({
  step,
  total,
  title,
  children,
  back,
  next,
  nextLabel = "Vazhdo",
  busy = false,
}: {
  step: number;
  total: number;
  title: string;
  children: React.ReactNode;
  back?: () => void;
  next: () => void;
  nextLabel?: string;
  busy?: boolean;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-6.25rem)] max-w-2xl grid-rows-[auto_1fr_auto]">
      <div className="px-4 py-6 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--kuvend-ink-soft)]">
          Hapi {step} nga {total}
        </p>
        <div className="mt-3 flex gap-1" aria-label={`Hapi ${step} nga ${total}`}>
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full bg-[var(--kuvend-border)]",
                index < step && "bg-[var(--kuvend-red)]",
              )}
            />
          ))}
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      <div className="px-4 pb-8 sm:px-6">{children}</div>
      <div className="sticky bottom-0 border-t border-[var(--kuvend-border)] bg-[var(--kuvend-canvas)]/95 px-4 pb-[var(--kuvend-safe-bottom)] pt-3 backdrop-blur sm:px-6">
        <div className="flex gap-3">
          {back && (
            <Button variant="outline" onClick={back} className="flex-1">
              <ArrowLeft /> Kthehu
            </Button>
          )}
          <Button onClick={next} disabled={busy} className="flex-1">
            {nextLabel}
            {nextLabel === "Konfirmo" ? <Check /> : <ChevronRight />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-[var(--kuvend-border-strong)] p-8 text-center">
      <Info className="size-5 text-[var(--kuvend-ink-soft)]" />
      <h3 className="font-semibold">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-[var(--kuvend-ink-soft)]">{description}</p>
      {action}
    </div>
  );
}

export function FileUploader({
  id,
  accept,
  file,
  kind,
  previewUrl,
  progress = 0,
  status = "idle",
  error,
  onFileSelect,
  onRemove,
}: {
  id: string;
  accept: string;
  file: File | null;
  kind: "document" | "image" | "video";
  previewUrl?: string;
  progress?: number;
  status?: "idle" | "preparing" | "ready" | "uploading" | "complete" | "error";
  error?: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const statusLabel = {
    idle: "Zgjidh një skedar",
    preparing: "Po përgatitet",
    ready: "Gati për ngarkim",
    uploading: "Po ngarkohet",
    complete: "U ngarkua",
    error: "Nuk mund të ngarkohet",
  }[status];

  function select(files: FileList | null) {
    const nextFile = files?.[0];
    if (nextFile) onFileSelect(nextFile);
  }

  return (
    <div data-slot="file-uploader" className="grid gap-3">
      <input
        ref={inputRef}
        id={id}
        className="sr-only"
        type="file"
        accept={accept}
        onChange={(event) => select(event.currentTarget.files)}
      />
      {!file ? (
        <div
          className="grid min-h-40 place-items-center gap-3 rounded-lg border border-dashed border-[var(--kuvend-border-strong)] bg-[var(--kuvend-surface-raised)] p-5 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            select(event.dataTransfer.files);
          }}
        >
          <span className="grid size-11 place-items-center rounded-lg bg-[var(--kuvend-surface)] text-[var(--kuvend-ink-soft)]">
            <UploadCloud className="size-5" aria-hidden="true" />
          </span>
          <div className="grid gap-1">
            <strong className="text-sm text-[var(--kuvend-ink)]">Hidhe skedarin këtu</strong>
            <span className="text-xs leading-5 text-[var(--kuvend-ink-soft)]">
              ose zgjidhe nga pajisja jote
            </span>
          </div>
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            Zgjidh skedar
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--kuvend-border)] bg-[var(--kuvend-surface-raised)]">
          <div className="relative grid min-h-36 place-items-center overflow-hidden bg-[var(--kuvend-surface)]">
            {kind === "image" && previewUrl ? (
              <img
                src={previewUrl}
                alt={`Pamje paraprake e ${file.name}`}
                className="max-h-52 w-full object-contain"
              />
            ) : kind === "video" && previewUrl ? (
              <video
                src={previewUrl}
                controls
                preload="metadata"
                aria-label={`Pamje paraprake e ${file.name}`}
                className="max-h-52 w-full"
              />
            ) : (
              <span className="grid justify-items-center gap-2 text-[var(--kuvend-ink-soft)]">
                {kind === "video" ? (
                  <Video className="size-9" aria-hidden="true" />
                ) : kind === "image" ? (
                  <ImageIcon className="size-9" aria-hidden="true" />
                ) : (
                  <FileText className="size-9" aria-hidden="true" />
                )}
                <span className="text-xs">Pamja paraprake nuk është e disponueshme</span>
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2"
              onClick={onRemove}
              aria-label={`Hiq ${file.name}`}
            >
              <X />
            </Button>
          </div>
          <div className="grid gap-3 p-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--kuvend-ink)]">
                  {file.name}
                </p>
                <p className="text-xs text-[var(--kuvend-ink-soft)]">{formatFileSize(file.size)}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()}>
                Zëvendëso
              </Button>
            </div>
            {status !== "idle" && (
              <Progress value={progress} aria-live="polite" aria-label={`Përparimi i ${file.name}`}>
                <ProgressLabel>{statusLabel}</ProgressLabel>
                <ProgressValue>{Math.round(progress)}%</ProgressValue>
              </Progress>
            )}
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm leading-5 text-[var(--kuvend-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

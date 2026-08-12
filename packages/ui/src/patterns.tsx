"use client";

import * as React from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Info,
  LockKeyhole,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { siClaude, siGoogle, siOpenai } from "simple-icons";
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Progress,
  ProgressLabel,
  ProgressValue,
} from "./primitives";
import { cn } from "./lib";

export type PhoneCountryOption = {
  value: string;
  label: string;
  callingCode: string;
};

export function PhoneNumberField({
  countries,
  country,
  onCountryChange,
  phoneInputProps,
}: {
  countries: PhoneCountryOption[];
  country: PhoneCountryOption;
  onCountryChange: (country: PhoneCountryOption) => void;
  phoneInputProps: React.ComponentProps<typeof Input>;
}) {
  return (
    <div
      data-slot="phone-number-field"
      className="flex min-h-12 w-full rounded-md border border-[var(--kuvend-border-strong)] bg-[var(--kuvend-surface-raised)] outline-none focus-within:border-[var(--kuvend-focus)] focus-within:ring-3 focus-within:ring-[var(--kuvend-focus)]/20"
    >
      <Combobox
        items={countries}
        value={country}
        onValueChange={(option) => {
          if (option) onCountryChange(option);
        }}
      >
        <ComboboxInputGroup className="w-[46%] min-w-0 shrink-0 sm:w-48">
          <ComboboxInput
            aria-label="Shteti dhe kodi telefonik"
            autoComplete="country"
            className="h-12 min-h-12 truncate rounded-r-none border-0 bg-transparent pr-10 font-semibold focus-visible:border-0 focus-visible:ring-0"
          />
          <ComboboxTrigger
            aria-label="Kërko ose ndrysho shtetin"
            className="h-12 min-h-12 rounded-r-none"
          />
        </ComboboxInputGroup>
        <ComboboxPortal>
          <ComboboxPositioner>
            <ComboboxPopup className="min-w-72">
              <ComboboxEmpty>Nuk u gjet asnjë shtet.</ComboboxEmpty>
              <ComboboxList>
                {(option: PhoneCountryOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    <span className="flex min-w-0 items-center justify-between gap-3">
                      <span className="truncate">{option.label}</span>
                      <span className="shrink-0 text-[var(--kuvend-ink-soft)]">
                        +{option.callingCode}
                      </span>
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </ComboboxPositioner>
        </ComboboxPortal>
      </Combobox>
      <Input
        {...phoneInputProps}
        className={cn(
          "h-12 min-h-12 min-w-0 rounded-l-none border-0 border-l border-l-[var(--kuvend-border)] bg-transparent focus-visible:border-l-[var(--kuvend-border)] focus-visible:ring-0",
          phoneInputProps.className,
        )}
      />
    </div>
  );
}
export type PublicNavigationSection = "proposals" | "how" | "trust";

const publicNavigation = [
  { id: "proposals", label: "Propozimet", href: "/" },
  { id: "how", label: "Si funksionon", href: "/si-funksionon" },
  { id: "trust", label: "Besimi", href: "/besimi" },
] as const;

export function PublicSiteHeader({
  active,
  onNotifications,
  onPropose,
}: {
  active?: PublicNavigationSection;
  onNotifications?: () => void;
  onPropose?: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const notificationAction = onNotifications ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Njoftimet"
      title="Njoftimet"
      onClick={onNotifications}
    >
      <Bell />
    </Button>
  ) : (
    <a
      data-slot="button"
      data-variant="ghost"
      aria-label="Njoftimet"
      title="Njoftimet"
      href="/?action=notifications"
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <Bell />
    </a>
  );

  const proposeAction = onPropose ? (
    <Button type="button" size="sm" className="min-w-11" aria-label="Propozo" onClick={onPropose}>
      <Plus /> <span className="hidden sm:inline">Propozo</span>
    </Button>
  ) : (
    <a
      data-slot="button"
      data-variant="primary"
      aria-label="Propozo"
      href="/?action=proposal"
      className={cn(buttonVariants({ size: "sm" }), "min-w-11")}
    >
      <Plus /> <span className="hidden sm:inline">Propozo</span>
    </a>
  );

  return (
    <header
      data-slot="public-header"
      className="sticky top-0 z-40 border-b border-[var(--kuvend-border)] bg-[var(--kuvend-surface-raised)]/95 backdrop-blur"
    >
      <div className="relative mx-auto flex min-h-16 max-w-[var(--kuvend-content)] items-center gap-2 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <a
          href="/"
          aria-label="Kuvend, kreu"
          className="mr-auto inline-flex min-h-11 items-center gap-2.5 rounded-md text-xl font-extrabold tracking-[-0.035em] text-[var(--kuvend-ink)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25 lg:mr-0 lg:justify-self-start"
        >
          <img src="/mark.svg" alt="" className="size-7" />
          <span>Kuvend</span>
        </a>
        <nav aria-label="Kryesor" className="hidden h-16 items-stretch lg:flex">
          {publicNavigation.map((link) => (
            <a
              key={link.id}
              href={link.href}
              aria-current={active === link.id ? "page" : undefined}
              className="relative flex min-w-32 items-center justify-center px-4 text-sm font-medium text-[var(--kuvend-ink-soft)] outline-none hover:bg-[var(--kuvend-surface)] hover:text-[var(--kuvend-ink)] focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--kuvend-focus)]/25 aria-[current=page]:font-semibold aria-[current=page]:text-[var(--kuvend-ink)] aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-4 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-[var(--kuvend-red)]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-1.5 lg:justify-self-end">
          {notificationAction}
          {proposeAction}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={menuOpen ? "Mbyll menunë" : "Hap menunë"}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <nav
            id="public-mobile-menu"
            aria-label="Menuja celulare"
            className="absolute inset-x-0 top-full z-50 grid gap-1 border-y border-[var(--kuvend-border)] bg-[var(--kuvend-surface-raised)] p-3 shadow-[var(--kuvend-shadow-overlay)] lg:hidden"
          >
            {publicNavigation.map((link) => (
              <a
                key={link.id}
                href={link.href}
                aria-current={active === link.id ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-md px-3 text-sm font-semibold text-[var(--kuvend-ink-soft)] outline-none hover:bg-[var(--kuvend-surface)] hover:text-[var(--kuvend-ink)] focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25 aria-[current=page]:border-l-2 aria-[current=page]:border-[var(--kuvend-red)] aria-[current=page]:bg-[var(--kuvend-surface)] aria-[current=page]:text-[var(--kuvend-ink)]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/transparenca"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-12 items-center rounded-md px-3 text-sm font-semibold text-[var(--kuvend-ink-soft)] outline-none hover:bg-[var(--kuvend-surface)] hover:text-[var(--kuvend-ink)] focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25"
            >
              Transparenca e plotë
            </a>
          </nav>
        )}
      </div>
      <a
        data-slot="public-trust-strip"
        href="/besimi"
        className="flex min-h-11 items-center justify-center gap-2 border-t border-[var(--kuvend-border)] bg-[var(--kuvend-ink)] px-4 py-2 text-center text-xs text-[var(--kuvend-surface-raised)] outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--kuvend-focus)]"
      >
        <ShieldCheck className="size-3.5 text-[var(--kuvend-red)]" />
        <strong>Beta eksperimentale.</strong>
        <span>I pavarur dhe joqeveritar.</span>
        <span className="font-semibold underline underline-offset-2">Çfarë garanton?</span>
      </a>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer
      data-slot="public-footer"
      className="border-t border-[var(--kuvend-border)] bg-[var(--kuvend-surface)]"
    >
      <div
        data-slot="public-footer-grid"
        className="mx-auto grid max-w-[var(--kuvend-content)] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]"
      >
        <div data-slot="public-footer-intro" className="grid content-start gap-3">
          <a
            href="/"
            className="inline-flex min-h-11 w-fit items-center gap-2.5 rounded-md text-xl font-extrabold tracking-[-0.035em] text-[var(--kuvend-ink)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25"
          >
            <img src="/mark.svg" alt="" className="size-7" /> Kuvend
          </a>
          <p className="max-w-sm text-sm leading-6 text-[var(--kuvend-ink-soft)]">
            Infrastrukturë qytetare e hapur, e pavarur dhe jokomerciale për propozime dhe votim
            këshillues.
          </p>
          <p className="text-xs leading-5 text-[var(--kuvend-ink-soft)]">
            Nuk është i lidhur me Kuvendin e Shqipërisë, një parti ose institucion shtetëror.
          </p>
        </div>
        <nav data-slot="public-footer-nav" aria-label="Besimi" className="grid content-start gap-1">
          <strong className="mb-2 text-sm text-[var(--kuvend-ink)]">Besimi</strong>
          {[
            ["/besimi", "Qendra e besimit"],
            ["/rreth-kuvendit", "Kush qëndron pas Kuvend"],
            ["/privatesia", "Privatësia"],
            ["/siguria", "Siguria"],
            ["/financimi", "Financimi"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="flex min-h-11 items-center text-sm text-[var(--kuvend-ink-soft)] outline-none hover:text-[var(--kuvend-ink)] focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25"
            >
              {label}
            </a>
          ))}
        </nav>
        <nav
          data-slot="public-footer-nav"
          aria-label="Rregullat dhe kontakti"
          className="grid content-start gap-1"
        >
          <strong className="mb-2 text-sm text-[var(--kuvend-ink)]">Rregullat dhe kontakti</strong>
          {[
            ["/si-funksionon", "Si funksionon"],
            ["/transparenca", "Transparenca"],
            ["/moderimi", "Moderimi"],
            ["/kushtet", "Kushtet e përdorimit"],
            ["mailto:privacy@kuvend.org", "privacy@kuvend.org"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="flex min-h-11 items-center text-sm text-[var(--kuvend-ink-soft)] outline-none hover:text-[var(--kuvend-ink)] focus-visible:ring-3 focus-visible:ring-[var(--kuvend-focus)]/25"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-[var(--kuvend-border)] px-4 py-4 text-center text-xs text-[var(--kuvend-ink-soft)]">
        Kodi është i hapur · Rezultatet janë këshilluese dhe jo përfaqësuese
      </div>
    </footer>
  );
}

export function AppShell({
  children,
  active = "proposals",
  onNotifications,
  onPropose,
}: {
  children: React.ReactNode;
  active?: PublicNavigationSection;
  onNotifications?: () => void;
  onPropose?: () => void;
}) {
  return (
    <div className="min-h-dvh bg-[var(--kuvend-canvas)] text-[var(--kuvend-ink)]">
      <PublicSiteHeader
        active={active}
        {...(onNotifications ? { onNotifications } : {})}
        {...(onPropose ? { onPropose } : {})}
      />
      {children}
      <PublicSiteFooter />
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

export type ExternalResearchAction = {
  id: string;
  label: string;
  description: string;
  icon: "chatgpt" | "claude" | "google";
  disabled?: boolean;
};

const researchProviderIcons = {
  chatgpt: siOpenai,
  claude: siClaude,
  google: siGoogle,
};

export function ExternalResearchActions({
  actions,
  onSelect,
}: {
  actions: ExternalResearchAction[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Search data-icon="inline-start" /> Hulumto me AI ose Google
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hulumto këtë propozim</DialogTitle>
          <DialogDescription>
            Krahaso pretendimet, kontrollo provat dhe kërko këndvështrime të tjera.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-[var(--kuvend-border)] bg-[var(--kuvend-surface)] p-3 text-sm leading-5 text-[var(--kuvend-ink-soft)]">
          <strong className="text-[var(--kuvend-ink)]">Po hap një shërbim të jashtëm.</strong> Ai
          mund të shohë adresën tënde IP dhe tekstin publik të propozimit që përfshihet në lidhje.
        </div>
        <div className="grid gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="outline"
              disabled={action.disabled}
              className="h-auto min-h-14 w-full justify-start gap-3 px-3 py-2 text-left"
              onClick={() => {
                onSelect(action.id);
                setOpen(false);
              }}
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--kuvend-surface)] text-[var(--kuvend-ink)]"
              >
                <svg viewBox="0 0 24 24" className="size-4" focusable="false">
                  <path d={researchProviderIcons[action.icon].path} fill="currentColor" />
                </svg>
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="font-semibold text-[var(--kuvend-ink)]">{action.label}</span>
                <span className="whitespace-normal text-xs font-normal leading-4 text-[var(--kuvend-ink-soft)]">
                  {action.description}
                </span>
              </span>
            </Button>
          ))}
        </div>
        <p className="text-xs leading-5 text-[var(--kuvend-ink-soft)]">
          Kuvend nuk u dërgon këtyre shërbimeve votën, telefonin, dëshminë anonime apo të dhëna
          private.
        </p>
      </DialogContent>
    </Dialog>
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

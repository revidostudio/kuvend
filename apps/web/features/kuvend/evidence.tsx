"use client";

import type { EvidenceItem } from "@kuvend/contracts";
import {
  Button,
  ChoiceButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FileUploader,
  Input,
  NativeSelect,
} from "@kuvend/ui";
import { FileUp, Link2, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const labels: Record<EvidenceItem["type"], string> = {
  source: "Burim",
  document: "Dokument",
  image: "Imazh",
  video: "Video",
};

export function EvidenceEditor({
  items,
  onChange,
  limit,
}: {
  items: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
  limit: number;
}) {
  const helpId = useId();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EvidenceItem["type"]>("source");
  const [method, setMethod] = useState<"link" | "upload">("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileStatus, setFileStatus] = useState<"idle" | "preparing" | "ready" | "error">("idle");
  const [fileError, setFileError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const readerRef = useRef<FileReader | null>(null);

  useEffect(() => {
    if (!file || (type !== "image" && type !== "video")) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, type]);

  function reset() {
    setTitle("");
    setUrl("");
    readerRef.current?.abort();
    setFile(null);
    setFileProgress(0);
    setFileStatus("idle");
    setFileError("");
    setMethod("link");
  }

  function chooseFile(nextFile: File) {
    readerRef.current?.abort();
    const maxBytes =
      type === "video" ? 50 * 1024 * 1024 : type === "image" ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
    if (nextFile.size > maxBytes) {
      setFile(null);
      setFileStatus("error");
      setFileProgress(0);
      setFileError(
        `Skedari është shumë i madh. Kufiri është ${type === "video" ? "50 MB" : type === "image" ? "10 MB" : "20 MB"}.`,
      );
      return;
    }
    setFile(nextFile);
    setFileError("");
    setFileStatus("preparing");
    setFileProgress(0);
    if (!title.trim()) setTitle(nextFile.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onprogress = (event) => {
      if (event.lengthComputable) setFileProgress(Math.round((event.loaded / event.total) * 100));
    };
    reader.onload = () => {
      setFileProgress(100);
      setFileStatus("ready");
    };
    reader.onerror = () => {
      setFileProgress(0);
      setFileStatus("error");
      setFileError("Skedari nuk mund të lexohet. Provo një skedar tjetër.");
    };
    reader.readAsArrayBuffer(nextFile);
  }

  function removeFile() {
    readerRef.current?.abort();
    setFile(null);
    setFileProgress(0);
    setFileStatus("idle");
    setFileError("");
  }

  function add() {
    if (method !== "link" || !title.trim() || !url.startsWith("https://") || items.length >= limit)
      return;
    onChange([...items, { type, title: title.trim(), url }]);
    reset();
    setOpen(false);
  }

  const canAdd = method === "link" && title.trim().length > 1 && url.startsWith("https://");

  return (
    <fieldset className="evidence-editor" aria-describedby={helpId}>
      <FieldLegend optional>Prova dhe media</FieldLegend>
      <FieldDescription id={helpId}>
        Shto materiale që mbështesin kontributin. Asgjë nuk hapet automatikisht.
      </FieldDescription>
      <Button
        type="button"
        variant="outline"
        className="evidence-add-button"
        onClick={() => setOpen(true)}
        disabled={items.length >= limit}
      >
        <Plus data-icon="inline-start" /> Shto provë ose media
        <span className="evidence-limit">
          {items.length}/{limit}
        </span>
      </Button>
      <EvidenceList
        items={items}
        onRemove={(index) => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Shto provë ose media</DialogTitle>
            <DialogDescription>
              Zgjidh llojin dhe shto një lidhje të qartë që lexuesit mund ta kontrollojnë.
            </DialogDescription>
          </DialogHeader>
          <div className="evidence-dialog-fields">
            <Field>
              <FieldLabel htmlFor={`${helpId}-type`}>Lloji</FieldLabel>
              <NativeSelect
                id={`${helpId}-type`}
                value={type}
                onChange={(event) => {
                  const nextType = event.target.value as EvidenceItem["type"];
                  setType(nextType);
                  removeFile();
                  if (nextType === "source") setMethod("link");
                }}
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            {type !== "source" && (
              <Field>
                <FieldLabel>Si do ta shtosh?</FieldLabel>
                <div className="position-tabs" role="group" aria-label="Mënyra e shtimit">
                  <ChoiceButton selected={method === "link"} onClick={() => setMethod("link")}>
                    <Link2 /> Lidhje
                  </ChoiceButton>
                  <ChoiceButton selected={method === "upload"} onClick={() => setMethod("upload")}>
                    <FileUp /> Ngarko skedar
                  </ChoiceButton>
                </div>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor={`${helpId}-title`}>Titulli</FieldLabel>
              <Input
                id={`${helpId}-title`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Çfarë tregon ky material?"
              />
            </Field>

            {method === "link" ? (
              <Field>
                <FieldLabel htmlFor={`${helpId}-url`}>Lidhja HTTPS</FieldLabel>
                <Input
                  key="evidence-link-input"
                  id={`${helpId}-url`}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://…"
                  inputMode="url"
                />
                <FieldDescription>Pranohen vetëm lidhje të sigurta HTTPS.</FieldDescription>
              </Field>
            ) : (
              <Field key="evidence-file-field">
                <FieldLabel htmlFor={`${helpId}-file`}>Skedari</FieldLabel>
                <FileUploader
                  id={`${helpId}-file`}
                  accept={
                    type === "image"
                      ? "image/*"
                      : type === "video"
                        ? "video/*"
                        : ".pdf,.doc,.docx,.odt"
                  }
                  file={file}
                  kind={type === "source" ? "document" : type}
                  previewUrl={previewUrl}
                  progress={fileProgress}
                  status={fileStatus}
                  error={fileError}
                  onFileSelect={chooseFile}
                  onRemove={removeFile}
                />
                <FieldDescription>
                  Mund ta kontrollosh pamjen para dërgimit. Ruajtja e audituar duhet të lidhet para
                  se skedari të publikohet.
                </FieldDescription>
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulo
            </Button>
            <Button type="button" onClick={add} disabled={!canAdd || items.length >= limit}>
              Shto materialin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </fieldset>
  );
}

export function EvidenceList({
  items,
  onRemove,
}: {
  items: EvidenceItem[];
  onRemove?: (index: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="evidence-list">
      {items.map((item, index) => (
        <div key={`${item.url}-${index}`}>
          <a href={item.url} target="_blank" rel="noreferrer nofollow">
            <span>{labels[item.type]}</span>
            <strong>{item.title}</strong>
          </a>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Hiq ${item.title}`}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

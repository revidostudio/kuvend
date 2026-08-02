"use client";

import type { EvidenceItem } from "@kuvend/contracts";
import { Button, Input, NativeSelect } from "@kuvend/ui";
import { X } from "lucide-react";
import { useState } from "react";

export function EvidenceEditor({
  items,
  onChange,
  limit,
}: {
  items: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
  limit: number;
}) {
  const [type, setType] = useState<EvidenceItem["type"]>("source");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const labels = { source: "Burim", document: "Dokument", image: "Imazh", video: "Video" };

  function add() {
    if (!title.trim() || !url.startsWith("https://") || items.length >= limit) return;
    onChange([...items, { type, title: title.trim(), url }]);
    setTitle("");
    setUrl("");
  }

  return (
    <fieldset className="evidence-editor">
      <legend>
        Prova dhe media <small>Opsionale</small>
      </legend>
      <p>
        Shto burime, dokumente, imazhe ose video si lidhje HTTPS. Media nuk ngarkohet ose hapet
        automatikisht.
      </p>
      <div className="evidence-fields">
        <NativeSelect
          aria-label="Lloji i provës"
          value={type}
          onChange={(event) => setType(event.target.value as EvidenceItem["type"])}
        >
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Input
          aria-label="Titulli i provës"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titulli ose përshkrimi"
        />
        <Input
          aria-label="Lidhja e provës"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
          inputMode="url"
        />
        <Button type="button" variant="outline" onClick={add} disabled={items.length >= limit}>
          Shto
        </Button>
      </div>
      <EvidenceList
        items={items}
        onRemove={(index) => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
      />
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
  return (
    <div className="evidence-list">
      {items.map((item, index) => (
        <div key={`${item.url}-${index}`}>
          <span>
            {item.type === "image"
              ? "Imazh"
              : item.type === "video"
                ? "Video"
                : item.type === "document"
                  ? "Dokument"
                  : "Burim"}
          </span>
          <a href={item.url} target="_blank" rel="noreferrer nofollow">
            {item.title}
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

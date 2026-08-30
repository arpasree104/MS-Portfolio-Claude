"use client";
import { useRef, useState } from "react";
import { Upload, FileCheck } from "lucide-react";
import { fileToBase64 } from "@/lib/gas-client";

export function FileUpload({
  onFileReady,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg",
  maxSizeMB = 10,
  label = "อัปโหลดไฟล์",
}: {
  onFileReady: (base64: string, fileName: string, mimeType: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`ไฟล์ต้องมีขนาดไม่เกิน ${maxSizeMB} MB`);
      return;
    }

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      onFileReady(base64, file.name, file.type);
      setFileName(file.name);
    } catch {
      setError("ไม่สามารถอ่านไฟล์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-2 text-sm text-foreground/70 hover:bg-black/5 disabled:opacity-50"
      >
        {fileName ? <FileCheck size={16} className="text-status-green" /> : <Upload size={16} />}
        {loading ? "กำลังอ่านไฟล์..." : fileName || label}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <p className="text-xs text-foreground/40 mt-1">รองรับไฟล์ PDF, DOCX, XLSX, รูปภาพ (ขนาดไม่เกิน {maxSizeMB} MB)</p>
      {error && <p className="text-xs text-status-red mt-1">{error}</p>}
    </div>
  );
}

"use client";
import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GraduationCap, Users, Check } from "lucide-react";
import { gasCall } from "@/lib/gas-client";
import type { Role, UserStatus } from "@/lib/types";

const ROLE_OPTIONS: { role: "student" | "advisor"; label: string; icon: React.ElementType }[] = [
  { role: "student", label: "นักศึกษา", icon: GraduationCap },
  { role: "advisor", label: "อาจารย์ที่ปรึกษา", icon: Users },
];

const ROLE_LABELS: Record<string, string> = {
  student: "นักศึกษา",
  advisor: "อาจารย์ที่ปรึกษา",
  executive: "ผู้บริหารหลักสูตร",
  admin: "ผู้ดูแลระบบ",
};

export function RolePicker({ currentRole }: { currentRole: Role }) {
  const router = useRouter();
  const { update } = useSession();
  const [role, setRole] = useState<Role>(currentRole);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function pick(newRole: "student" | "advisor") {
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const result = await gasCall<{ role: Role; status: UserStatus }>("setInitialRole", { role: newRole });
      setRole(newRole);
      await update();
      if (result.status === "active") {
        router.push("/dashboard");
      } else if (result.status === "awaiting_profile") {
        router.push("/complete-profile");
      } else {
        setSavedMsg("บันทึกแล้ว — เปลี่ยนได้จนกว่าจะได้รับอนุมัติจากผู้ดูแลระบบ");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="text-left">
      <p className="text-sm text-foreground/60 mb-1">
        ขณะนี้เลือกไว้: <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>
      </p>
      <p className="text-xs text-foreground/50 mb-4">เลือกบทบาทของคุณ — เปลี่ยนได้ตลอดจนกว่าผู้ดูแลระบบจะอนุมัติ</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {ROLE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = role === opt.role;
          return (
            <button
              key={opt.role}
              type="button"
              disabled={saving}
              onClick={() => pick(opt.role)}
              className={clsx(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-5 text-sm font-medium transition-colors disabled:opacity-50",
                selected
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-black/10 text-foreground/70 hover:bg-black/5"
              )}
            >
              {selected && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
                  <Check size={12} />
                </span>
              )}
              <Icon size={28} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {savedMsg && <p className="text-xs text-status-green mb-2">{savedMsg}</p>}
      {errorMsg && <p className="text-xs text-status-red mb-2">{errorMsg}</p>}
      {saving && <p className="text-xs text-foreground/50 mb-2">กำลังบันทึก...</p>}
    </div>
  );
}

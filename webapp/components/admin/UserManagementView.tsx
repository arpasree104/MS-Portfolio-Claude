"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { gasCall } from "@/lib/gas-client";
import type { AppUser, Role, UserStatus } from "@/lib/types";
import { Plus, Ban, CheckCircle2 } from "lucide-react";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

const STATUS_TONE: Record<UserStatus, "green" | "yellow" | "red"> = {
  active: "green",
  pending: "yellow",
  disabled: "red",
};

const ROLE_LABELS: Record<Role, string> = {
  student: "นักศึกษา",
  advisor: "อาจารย์ที่ปรึกษา",
  executive: "ผู้บริหารหลักสูตร",
  admin: "ผู้ดูแลระบบ",
};

interface FormValues {
  Email: string;
  Role: Role;
  Status: UserStatus;
  DisplayNameTH: string;
  DisplayNameEN: string;
}

export function UserManagementView({ initialUsers }: { initialUsers: AppUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const form = useForm<FormValues>({ defaultValues: { Role: "student", Status: "active" } });

  async function onSubmit(data: FormValues) {
    await gasCall("createOrUpdateUser", { data });
    const fresh = await gasCall<AppUser[]>("listUsers", {});
    setUsers(fresh);
    setModalOpen(false);
    form.reset();
  }

  async function approve(user: AppUser) {
    await gasCall("createOrUpdateUser", { data: { Email: user.Email, Status: "active" } });
    setUsers((prev) => prev.map((u) => (u.UserId === user.UserId ? { ...u, Status: "active" } : u)));
  }

  async function disable(userId: string) {
    await gasCall("disableUser", { userId });
    setUsers((prev) => prev.map((u) => (u.UserId === userId ? { ...u, Status: "disabled" } : u)));
  }

  async function changeRole(userId: string, role: Role) {
    const user = users.find((u) => u.UserId === userId);
    if (!user) return;
    await gasCall("createOrUpdateUser", { data: { Email: user.Email, Role: role } });
    setUsers((prev) => prev.map((u) => (u.UserId === userId ? { ...u, Role: role } : u)));
  }

  return (
    <Card
      title={`ผู้ใช้งานทั้งหมด (${users.length})`}
      action={<Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> เพิ่ม/whitelist ผู้ใช้</Button>}
    >
      <Table>
        <Thead>
          <Th>อีเมล</Th>
          <Th>ชื่อ</Th>
          <Th>บทบาท</Th>
          <Th>สถานะ</Th>
          <Th>{" "}</Th>
        </Thead>
        <tbody>
          {users.map((u) => (
            <Tr key={u.UserId}>
              <Td className="text-xs">{u.Email}</Td>
              <Td className="text-xs">{u.DisplayNameTH || u.DisplayNameEN || "-"}</Td>
              <Td>
                <select
                  className="text-xs rounded border border-black/10 px-2 py-1"
                  value={u.Role}
                  onChange={(e) => changeRole(u.UserId, e.target.value as Role)}
                >
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
              </Td>
              <Td><Badge tone={STATUS_TONE[u.Status]}>{u.Status === "active" ? "ใช้งานได้" : u.Status === "pending" ? "รออนุมัติ" : "ถูกระงับ"}</Badge></Td>
              <Td>
                <div className="flex gap-2">
                  {u.Status !== "active" && u.Status !== "disabled" && (
                    <Button variant="secondary" onClick={() => approve(u)}><CheckCircle2 size={14} /> อนุมัติ</Button>
                  )}
                  {u.Status !== "disabled" && (
                    <Button variant="danger" onClick={() => disable(u.UserId)}><Ban size={14} /> ระงับ</Button>
                  )}
                  {u.Status === "disabled" && (
                    <Button variant="secondary" onClick={() => approve(u)}><CheckCircle2 size={14} /> เปิดใช้งานอีกครั้ง</Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="เพิ่ม / Whitelist ผู้ใช้งาน">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <label className="block text-sm">อีเมล Gmail
            <input type="email" className={inputClass} {...form.register("Email", { required: true })} />
          </label>
          <label className="block text-sm">ชื่อ (ไทย)
            <input className={inputClass} {...form.register("DisplayNameTH")} />
          </label>
          <label className="block text-sm">ชื่อ (อังกฤษ)
            <input className={inputClass} {...form.register("DisplayNameEN")} />
          </label>
          <label className="block text-sm">บทบาท
            <select className={inputClass} {...form.register("Role")}>
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { gasCall, fileToBase64 } from "@/lib/gas-client";
import type { ChatActivityStat, ChatContact, ChatMessage, Student } from "@/lib/types";
import { Send, Paperclip, MessageCircle, BarChart3 } from "lucide-react";

const POLL_INTERVAL_MS = 5000;

const ROLE_LABELS: Record<string, string> = {
  student: "นักศึกษา",
  advisor: "อาจารย์ที่ปรึกษา",
  executive: "ผู้บริหารหลักสูตร",
  admin: "ผู้ดูแลระบบ",
};

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || url.includes("thumbnail?id=");
}

export function ChatView({
  contacts,
  currentUserId,
  activityStats = [],
  students = [],
}: {
  contacts: ChatContact[];
  currentUserId: string;
  activityStats?: ChatActivityStat[];
  students?: Student[];
}) {
  const [view, setView] = useState<"chat" | "stats">("chat");
  const [selected, setSelected] = useState<ChatContact | null>(contacts[0] || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [fileData, setFileData] = useState<{ base64: string; name: string; mimeType: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadUnreadCounts() {
    try {
      const counts = await gasCall<Record<string, number>>("listUnreadChatCounts", {});
      setUnreadCounts(counts);
    } catch {
      // non-critical background refresh; ignore failures
    }
  }

  async function loadThread(otherUserId: string, showSpinner: boolean) {
    if (showSpinner) setLoadingThread(true);
    try {
      const msgs = await gasCall<ChatMessage[]>("listChatMessages", { otherUserId });
      setMessages(msgs);
    } finally {
      if (showSpinner) setLoadingThread(false);
    }
  }

  useEffect(() => {
    if (!selected) return;
    loadThread(selected.userId, true);
    setUnreadCounts((prev) => ({ ...prev, [selected.userId]: 0 }));

    const interval = setInterval(() => {
      loadThread(selected.userId, false);
      loadUnreadCounts();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.userId]);

  useEffect(() => {
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("ไฟล์ต้องมีขนาดไม่เกิน 10 MB");
      return;
    }
    const base64 = await fileToBase64(file);
    setFileData({ base64, name: file.name, mimeType: file.type });
    e.target.value = "";
  }

  async function handleSend() {
    if (!selected || (!text.trim() && !fileData)) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = { Body: text.trim() };
      if (fileData) {
        payload.fileBase64 = fileData.base64;
        payload.fileName = fileData.name;
        payload.fileMimeType = fileData.mimeType;
      }
      const msg = await gasCall<ChatMessage>("sendChatMessage", { toUserId: selected.userId, data: payload });
      setMessages((prev) => [...prev, msg]);
      setText("");
      setFileData(null);
    } finally {
      setSending(false);
    }
  }

  const statsRows = useMemo(() => {
    const studentByUserId = new Map(students.map((s) => [s.UserId, s]));
    return activityStats
      .map((stat) => {
        const student = studentByUserId.get(stat.userId);
        return {
          ...stat,
          name: student ? `${student.PrefixTH}${student.FirstNameTH} ${student.LastNameTH}` : stat.userId,
          studentCode: student?.StudentCode || "-",
        };
      })
      .sort((a, b) => b.messageCount - a.messageCount);
  }, [activityStats, students]);

  const showStatsTab = activityStats.length > 0 || students.length > 0;

  if (contacts.length === 0 && !showStatsTab) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-foreground/50">
        <MessageCircle size={32} className="mb-3" />
        <p className="text-sm">ยังไม่มีรายชื่อผู้ติดต่อในระบบแชท</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showStatsTab && (
        <div className="inline-flex rounded-lg border border-black/10 p-1 bg-black/[0.02]">
          <button
            onClick={() => setView("chat")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === "chat" ? "bg-primary text-white" : "text-foreground/60 hover:text-foreground"}`}
          >
            <MessageCircle size={15} /> แชท
          </button>
          <button
            onClick={() => setView("stats")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === "stats" ? "bg-primary text-white" : "text-foreground/60 hover:text-foreground"}`}
          >
            <BarChart3 size={15} /> สถิติการสนทนา
          </button>
        </div>
      )}

      {view === "stats" ? (
        <div className="card">
          <p className="text-xs text-foreground/50 mb-3">จำนวนข้อความรวมของนักศึกษาแต่ละคน (ทุกคู่สนทนา) — ไม่แสดงเนื้อหาการสนทนา เพื่อความเป็นส่วนตัวของนักศึกษาและอาจารย์ที่ปรึกษา</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-foreground/60 border-b border-black/10">
                  <th className="py-2 px-2">รหัสนักศึกษา</th>
                  <th className="py-2 px-2">ชื่อ-สกุล</th>
                  <th className="py-2 px-2">จำนวนข้อความ</th>
                  <th className="py-2 px-2">คุยล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {statsRows.map((row) => (
                  <tr key={row.userId} className="border-b border-black/5">
                    <td className="py-2 px-2 font-mono text-xs">{row.studentCode}</td>
                    <td className="py-2 px-2">{row.name}</td>
                    <td className="py-2 px-2">{row.messageCount}</td>
                    <td className="py-2 px-2 text-xs text-foreground/50">
                      {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                    </td>
                  </tr>
                ))}
                {statsRows.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-foreground/40 py-8">ยังไม่มีข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-foreground/50">
          <MessageCircle size={32} className="mb-3" />
          <p className="text-sm">ยังไม่มีรายชื่อผู้ติดต่อในระบบแชท</p>
        </div>
      ) : (
    <div className="card p-0 overflow-hidden flex h-[calc(100vh-140px)]">
      <div className="w-64 shrink-0 border-r border-black/5 overflow-y-auto">
        {contacts.map((c) => {
          const unread = unreadCounts[c.userId] || 0;
          const active = selected?.userId === c.userId;
          return (
            <button
              key={c.userId}
              onClick={() => setSelected(c)}
              className={`w-full text-left px-4 py-3 border-b border-black/5 transition-colors ${active ? "bg-primary-50" : "hover:bg-black/5"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.displayNameTH || c.displayNameEN}</p>
                  <p className="text-xs text-foreground/50">{ROLE_LABELS[c.role] || c.role}</p>
                </div>
                {unread > 0 && (
                  <span className="h-5 w-5 shrink-0 rounded-full bg-status-red text-white text-[10px] flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="px-4 py-3 border-b border-black/5">
              <p className="font-medium text-sm">{selected.displayNameTH || selected.displayNameEN}</p>
              <p className="text-xs text-foreground/50">{ROLE_LABELS[selected.role] || selected.role}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingThread && <p className="text-center text-xs text-foreground/40">กำลังโหลด...</p>}
              {!loadingThread && messages.length === 0 && (
                <p className="text-center text-xs text-foreground/40 py-8">เริ่มการสนทนา</p>
              )}
              {messages.map((m) => {
                const mine = m.FromUserId === currentUserId;
                return (
                  <div key={m.ChatMessageId} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "bg-primary text-white" : "bg-black/[0.04] text-foreground"}`}>
                      {m.Body && <p className="whitespace-pre-wrap break-words">{m.Body}</p>}
                      {m.FileUrl && isImageUrl(m.FileUrl) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.FileUrl} alt="" className="rounded-lg mt-1.5 max-w-full max-h-64 object-cover" />
                      )}
                      {m.FileUrl && !isImageUrl(m.FileUrl) && (
                        <a
                          href={m.FileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs mt-1.5 hover:underline ${mine ? "text-white/90" : "text-primary"}`}
                        >
                          <Paperclip size={12} /> ไฟล์แนบ
                        </a>
                      )}
                      <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-foreground/40"}`}>
                        {new Date(m.CreatedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-black/5 p-3">
              {fileData && (
                <div className="flex items-center gap-2 mb-2 text-xs text-foreground/60 bg-black/[0.03] rounded-lg px-3 py-1.5">
                  <Paperclip size={12} /> {fileData.name}
                  <button onClick={() => setFileData(null)} className="ml-auto text-status-red hover:underline">ลบ</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 text-foreground/50 hover:text-foreground p-2"
                  aria-label="แนบไฟล์"
                  title="แนบไฟล์"
                >
                  <Paperclip size={18} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
                <textarea
                  className="flex-1 resize-none rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={1}
                  placeholder="พิมพ์ข้อความ..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!text.trim() && !fileData)}
                  className="shrink-0 bg-primary text-white rounded-lg p-2.5 disabled:opacity-50"
                  aria-label="ส่ง"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-foreground/40 text-sm">เลือกผู้ติดต่อเพื่อเริ่มแชท</div>
        )}
      </div>
    </div>
      )}
    </div>
  );
}

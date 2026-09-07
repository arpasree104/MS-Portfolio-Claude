import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { ChatContact, ChatActivityStat, Student } from "@/lib/types";
import { ChatView } from "@/components/chat/ChatView";

export default async function ChatPage() {
  const session = await requireActiveSession();
  const role = session.user.role;
  const canSeeStats = role === "admin" || role === "executive";

  const [contacts, activityStats, students] = await Promise.all([
    callGas<ChatContact[]>("listChatContacts", session.user.email!, {}),
    canSeeStats ? callGas<ChatActivityStat[]>("listChatActivityStats", session.user.email!, {}) : Promise.resolve([]),
    canSeeStats ? callGas<Student[]>("listStudents", session.user.email!, { filters: {} }) : Promise.resolve([]),
  ]);

  return (
    <ChatView
      contacts={contacts}
      currentUserId={session.user.userId}
      activityStats={activityStats}
      students={students}
    />
  );
}

import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { ChatContact } from "@/lib/types";
import { ChatView } from "@/components/chat/ChatView";

export default async function ChatPage() {
  const session = await requireActiveSession();
  const contacts = await callGas<ChatContact[]>("listChatContacts", session.user.email!, {});

  return <ChatView contacts={contacts} currentUserId={session.user.userId} />;
}

export async function handleResetChat(
  setLoading: (loading: boolean) => void,
  resetChat: () => Promise<void>,
  setMessages: (msgs: any) => void
) {
  setLoading(true);
  await resetChat();
  setMessages([]);
  setLoading(false);
} 
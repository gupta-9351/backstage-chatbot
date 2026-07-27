import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, CircularProgress, TextField, Typography, Box, Paper } from '@material-ui/core';
import { Content, ContentHeader, Header, Page } from '@backstage/core-components';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const DEFAULT_PROMPT = 'Ask me anything about your Backstage catalog.';

export const ChatbotPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: DEFAULT_PROMPT },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    setError(undefined);
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages(previous => [...previous, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as { answer: string };
      setMessages(previous => [...previous, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setIsSending(false);
    }
  }, [input, isSending]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  const renderedMessages = useMemo(
    () =>
      messages.map((message, index) => (
        <Box
          key={`${message.role}-${index}`}
          marginBottom={1}
          padding={1.5}
          borderRadius={8}
          bgcolor={message.role === 'assistant' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(63, 81, 181, 0.08)'}
        >
          <Typography variant="caption" color="textSecondary">
            {message.role === 'assistant' ? 'Assistant' : 'You'}
          </Typography>
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
            {message.content}
          </Typography>
        </Box>
      )),
    [messages],
  );

  return (
    <Page themeId="home">
      <Header title="Chatbot" subtitle="Ask the Backstage catalog any question" />
      <Content>
        <ContentHeader title="Catalog Chat" />
        <Paper style={{ padding: 24, minHeight: '62vh', display: 'flex', flexDirection: 'column' }}>
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              marginBottom: 16,
              borderRadius: 8,
              backgroundColor: '#f5f5f5',
            }}
          >
            {renderedMessages}
          </div>

          {error && (
            <Typography color="error" style={{ marginBottom: 12 }}>
              {error}
            </Typography>
          )}

          <Box display="flex" alignItems="flex-end" style={{ gap: 16 }}>
            <TextField
              label="Type your question"
              placeholder="How do I find the team that owns service X?"
              multiline
              maxRows={4}
              fullWidth
              variant="outlined"
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={isSending || input.trim().length === 0}
              onClick={sendMessage}
              style={{ minWidth: 120, height: 48 }}
            >
              {isSending ? <CircularProgress size={20} /> : 'Send'}
            </Button>
          </Box>
        </Paper>
      </Content>
    </Page>
  );
};

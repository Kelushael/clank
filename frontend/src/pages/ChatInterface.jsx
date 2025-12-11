import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Card } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MessageSquare, Plus, Trash2, Terminal, Settings, Zap, Cloud, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatInterface = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConvo, setCurrentConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelProvider, setModelProvider] = useState('cloud');
  const [wsConnection, setWsConnection] = useState(null);
  const [commandInput, setCommandInput] = useState('');
  const [commandLogs, setCommandLogs] = useState([]);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConvo) {
      loadConversation(currentConvo.id);
    }
  }, [currentConvo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await axios.get(`${API}/conversations`);
      setConversations(res.data);
      if (res.data.length > 0 && !currentConvo) {
        setCurrentConvo(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const res = await axios.get(`${API}/conversations/${id}`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await axios.post(`${API}/conversations`, {
        title: 'New Chat',
        model_provider: modelProvider
      });
      setConversations([res.data, ...conversations]);
      setCurrentConvo(res.data);
      setMessages([]);
      toast.success('New conversation created');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const deleteConversation = async (id) => {
    try {
      await axios.delete(`${API}/conversations/${id}`);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConvo?.id === id) {
        setCurrentConvo(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const connectWebSocket = (conversationId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = BACKEND_URL.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/api/ws/chat/${conversationId}`);
    
    let streamingMessage = '';
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnection(ws);
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'stream') {
        streamingMessage += data.content;
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === 'assistant' && newMessages[newMessages.length - 1].streaming) {
            newMessages[newMessages.length - 1].content = streamingMessage;
          } else {
            newMessages.push({ role: 'assistant', content: streamingMessage, streaming: true });
          }
          return newMessages;
        });
      } else if (data.type === 'done') {
        setIsStreaming(false);
        streamingMessage = '';
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.streaming) {
            delete newMessages[newMessages.length - 1].streaming;
          }
          return newMessages;
        });
        loadConversation(conversationId);
      } else if (data.type === 'error') {
        toast.error(data.content);
        setIsStreaming(false);
        streamingMessage = '';
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error');
      setIsStreaming(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnection(null);
      wsRef.current = null;
    };

    return ws;
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConvo || isStreaming) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const ws = wsRef.current || connectWebSocket(currentConvo.id);
      
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            message: input,
            model_provider: modelProvider
          }));
        }
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setIsStreaming(false);
    }
  };

  const executeCommand = async () => {
    if (!commandInput.trim()) return;

    try {
      const res = await axios.post(`${API}/commander/execute`, {
        command: commandInput
      });
      setCommandLogs(prev => [{
        command: commandInput,
        output: res.data.stdout || res.data.stderr,
        timestamp: new Date().toISOString()
      }, ...prev]);
      setCommandInput('');
      toast.success('Command executed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Command failed');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-black" data-testid="chat-interface">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col" data-testid="sidebar">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">NEXUS</h1>
              <p className="text-xs text-zinc-500">lattice node</p>
            </div>
          </div>
          
          <Button 
            onClick={createNewConversation}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-700"
            data-testid="new-chat-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {conversations.map(convo => (
              <div
                key={convo.id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                  currentConvo?.id === convo.id
                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 shadow-sm'
                    : 'hover:bg-slate-100'
                }`}
                onClick={() => setCurrentConvo(convo)}
                data-testid={`conversation-${convo.id}`}
              >
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span className="flex-1 text-sm truncate text-slate-700">{convo.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(convo.id);
                  }}
                  data-testid={`delete-conversation-${convo.id}`}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-600">Model Provider</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className={`w-4 h-4 ${modelProvider === 'cloud' ? 'text-blue-500' : 'text-slate-400'}`} />
            <Switch
              checked={modelProvider === 'local'}
              onCheckedChange={(checked) => setModelProvider(checked ? 'local' : 'cloud')}
              data-testid="model-provider-switch"
            />
            <Cpu className={`w-4 h-4 ${modelProvider === 'local' ? 'text-indigo-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {modelProvider === 'cloud' ? 'Cloud (Groq/Fast)' : 'Local (Bundled)'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <div className="border-b border-slate-200 bg-white/80 backdrop-blur-lg px-6 py-3">
            <TabsList className="bg-slate-100" data-testid="tabs-list">
              <TabsTrigger value="chat" className="data-[state=active]:bg-white" data-testid="chat-tab">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="commander" className="data-[state=active]:bg-white" data-testid="commander-tab">
                <Terminal className="w-4 h-4 mr-2" />
                Commander
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center" data-testid="empty-chat-state">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">EMERGENT NEXUS</h2>
                    <p className="text-slate-600 mb-4">Your sovereign AI companion with truth-first reasoning and desktop autonomy.</p>
                    <div className="flex gap-2 justify-center text-sm text-slate-500">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">Persistent Memory</span>
                      <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">Commander Tools</span>
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">Co-Creator Mode</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4" data-testid="messages-container">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      data-testid={`message-${idx}`}
                    >
                      <Card
                        className={`max-w-3xl p-4 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className="bg-slate-100 px-1 py-0.5 rounded text-sm" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {msg.streaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse" />
                        )}
                      </Card>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-slate-200 bg-white/80 backdrop-blur-lg p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Message NEXUS..."
                    disabled={isStreaming || !currentConvo}
                    className="flex-1 bg-white border-slate-300 focus:border-blue-500 shadow-sm"
                    data-testid="message-input"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isStreaming || !currentConvo || !input.trim()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
                    data-testid="send-button"
                  >
                    {isStreaming ? 'Thinking...' : 'Send'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Shift+Enter for newline • Enter to send</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commander" className="flex-1 flex flex-col m-0">
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Desktop Commander</h2>
                <p className="text-slate-600 mb-6">Execute commands in the sandboxed workspace (/app/workspace)</p>
                
                <div className="mb-6">
                  <div className="flex gap-2">
                    <Input
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      placeholder="Enter command (e.g., ls -la)"
                      className="flex-1 font-mono"
                      data-testid="command-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          executeCommand();
                        }
                      }}
                    />
                    <Button onClick={executeCommand} data-testid="execute-command-button">
                      Execute
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {commandLogs.map((log, idx) => (
                    <Card key={idx} className="p-4 bg-slate-900 text-green-400 font-mono text-sm" data-testid={`command-log-${idx}`}>
                      <div className="text-blue-400 mb-2">$ {log.command}</div>
                      <pre className="whitespace-pre-wrap">{log.output}</pre>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatInterface;
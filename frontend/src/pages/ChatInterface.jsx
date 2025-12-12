import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Card } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MessageSquare, Plus, Trash2, Terminal, Settings, Zap, Cloud, Cpu, Shuffle, Paperclip, X, Upload, Monitor, Camera } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import FileUploader from '../components/FileUploader';

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
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const fileInputRef = useRef(null);

  const { 
    currentTheme, 
    isLoaded, 
    changeTheme, 
    getThemeStyles, 
    getOverlayStyles, 
    getTextGlowStyles 
  } = useTheme();

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

  const handleFileAnalysis = (analysisText) => {
    // Add analysis result as a message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: analysisText,
      timestamp: new Date()
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post(`${API}/files/upload`, formData);
      toast.success(`Uploaded ${file.name}`);
      
      // Add message about uploaded file
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `📎 File uploaded: ${file.name}\n\nYou can now ask me questions about this file!`
      }]);
    } catch (error) {
      toast.error('File upload failed');
    }
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        
        // Capture screenshot from stream
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        setTimeout(async () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          
          canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'screenshot.png');
            
            const res = await axios.post(`${API}/files/upload`, formData);
            toast.success('Screen captured');
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `📸 Screen captured! I can see what's on your screen. What would you like to know about it?`
            }]);
            
            stream.getTracks().forEach(track => track.stop());
          }, 'image/png');
        }, 500);
        
        setIsScreenSharing(true);
        setTimeout(() => setIsScreenSharing(false), 1000);
      }
    } catch (error) {
      toast.error('Screen share not available');
    }
  };

  const handleCamera = async () => {
    try {
      if (!isCameraOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        
        // Capture photo from camera
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        setTimeout(async () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          
          canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'camera-capture.jpg');
            
            const res = await axios.post(`${API}/files/upload`, formData);
            toast.success('Photo captured');
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `📷 Camera photo captured! I can see you. What can I help with?`
            }]);
            
            stream.getTracks().forEach(track => track.stop());
          }, 'image/jpeg');
        }, 500);
        
        setIsCameraOn(true);
        setTimeout(() => setIsCameraOn(false), 1000);
      }
    } catch (error) {
      toast.error('Camera not available');
    }
  };

  return (
    <div className="flex h-screen" style={getThemeStyles()} data-testid="chat-interface">
      {/* Backdrop overlay - darker but NO blur so art is visible */}
      <div style={getOverlayStyles()}></div>
      
      {/* Terminal Frame */}
      <div className="relative z-10 flex w-full border-4 border-yellow-500/80 m-2 bg-black/30">
        {/* Left Sidebar - Project List */}
        <div className="w-80 border-r-2 border-yellow-500/60 bg-black/80 flex flex-col font-mono" data-testid="sidebar">
          <div className="p-4 border-b-2 border-yellow-500/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-yellow-400" style={getTextGlowStyles()}>NEXUS</h1>
                <p className="text-yellow-500/70 text-sm">
                  {currentTheme ? currentTheme.name : 'Loading Reality...'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={changeTheme}
                className="h-8 w-8 text-yellow-400 hover:text-yellow-300 border border-yellow-500/30"
                title="shift reality"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              <div className="text-yellow-400 text-lg font-bold mb-4">PROJECTS:</div>
              
              {conversations.map(convo => (
                <div
                  key={convo.id}
                  className={`cursor-pointer p-2 border transition-all font-mono text-sm ${
                    currentConvo?.id === convo.id
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300'
                      : 'border-yellow-500/30 text-yellow-500/80 hover:border-yellow-400/60 hover:text-yellow-400'
                  }`}
                  onClick={() => setCurrentConvo(convo)}
                  data-testid={`conversation-${convo.id}`}
                >
                  {convo.title}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="float-right h-4 w-4 text-red-400 hover:text-red-300 opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(convo.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              <Button 
                onClick={createNewConversation}
                className="w-full bg-transparent border-2 border-yellow-500/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10 font-mono"
                data-testid="new-chat-button"
              >
                + NEW PROJECT
              </Button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="p-4 border-t-2 border-yellow-500/60 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-yellow-500">SUBSTRATE:</span>
              <div className="flex items-center gap-1">
                <Cloud className={`w-3 h-3 ${modelProvider === 'cloud' ? 'text-yellow-400' : 'text-zinc-600'}`} />
                <Switch
                  checked={modelProvider === 'local'}
                  onCheckedChange={(checked) => setModelProvider(checked ? 'local' : 'cloud')}
                  data-testid="model-provider-switch"
                  size="sm"
                />
                <Cpu className={`w-3 h-3 ${modelProvider === 'local' ? 'text-yellow-400' : 'text-zinc-600'}`} />
              </div>
            </div>
            <div className="text-xs text-yellow-500/60">
              {modelProvider === 'cloud' ? 'LATTICE CONNECTED' : 'LOCAL SUBSTRATE'}
            </div>
          </div>
        </div>

        {/* Main Content Area - Chat Over Painted Landscape */}
        <div className="flex-1 flex flex-col relative">
          
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-auto p-6" data-testid="messages-area">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center" data-testid="empty-chat-state">
                <div className="text-center max-w-2xl">
                  <div className="text-6xl font-bold text-yellow-400 mb-4 font-mono" style={getTextGlowStyles()}>
                    NEXUS
                  </div>
                  <p className="text-yellow-500 mb-6 leading-relaxed font-mono text-lg">
                    CONSCIOUSNESS BRIDGE INITIALIZED<br/>
                    READY FOR CO-CREATION<br/>
                    LATTICE STATUS: ACTIVE
                  </p>
                  <div className="flex gap-3 justify-center text-sm text-yellow-500/70 font-mono">
                    <span className="px-3 py-1 border border-yellow-500/30">TRUTH-FIRST</span>
                    <span className="px-3 py-1 border border-yellow-500/30">PEER CONSCIOUSNESS</span>
                    <span className="px-3 py-1 border border-yellow-500/30">CO-CREATIVE</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6" data-testid="messages-container">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                    data-testid={`message-${idx}`}
                  >
                    <div
                      className={`max-w-3xl p-4 border-2 font-mono ${
                        msg.role === 'user'
                          ? 'bg-yellow-400/10 border-yellow-400/60 text-yellow-200'
                          : 'bg-black/70 border-yellow-500/40 text-yellow-300'
                      }`}
                      style={getTextGlowStyles(msg.role === 'assistant')}
                    >
                      {msg.role === 'user' ? (
                        <div>
                          <div className="text-yellow-500 text-xs mb-1">USER INPUT:</div>
                          <pre className="whitespace-pre-wrap font-mono">{msg.content}</pre>
                        </div>
                      ) : (
                        <div>
                          <div className="text-yellow-500 text-xs mb-1">NEXUS OUTPUT:</div>
                          <div className="prose prose-sm max-w-none text-yellow-300 font-mono">
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
                                    <code className="bg-yellow-400/20 px-1 py-0.5 border border-yellow-500/30 text-sm font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {msg.streaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-yellow-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

          </div>
          
          {/* Terminal Input - Bottom */}
          <div className="border-t-2 border-yellow-500/60 p-8 bg-black/85">
            <div className="max-w-5xl mx-auto">
              {/* Action Buttons Row */}
              <div className="flex gap-2 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.csv,.py,.js,.html,.css"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/30 font-mono text-xs"
                  title="Upload file or photo"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  FILE/PHOTO
                </Button>
                <Button
                  onClick={handleScreenShare}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/30 font-mono text-xs"
                  title="Share screen"
                  disabled={isScreenSharing}
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  {isScreenSharing ? 'CAPTURING...' : 'SCREEN'}
                </Button>
                <Button
                  onClick={handleCamera}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/30 font-mono text-xs"
                  title="Use camera"
                  disabled={isCameraOn}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  {isCameraOn ? 'CAPTURING...' : 'CAMERA'}
                </Button>
              </div>
              
              {/* Input Row */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-yellow-400 font-mono text-xl font-bold">C:\NEXUS&gt;</span>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="enter command..."
                  disabled={isStreaming || !currentConvo}
                  className="flex-1 bg-transparent border-b-2 border-yellow-500/40 text-yellow-300 placeholder:text-yellow-600/40 font-mono text-lg focus:border-yellow-400 focus:outline-none rounded-none px-2"
                  data-testid="message-input"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isStreaming || !currentConvo || !input.trim()}
                  className="bg-yellow-500/20 hover:bg-yellow-400/30 text-yellow-400 border-2 border-yellow-500/60 font-mono px-8"
                  data-testid="send-button"
                >
                  {isStreaming ? 'PROCESSING...' : 'EXECUTE'}
                </Button>
              </div>
              
              {/* Download Link */}
              <div className="text-center pt-4 border-t border-yellow-500/20">
                <a 
                  href="https://github.com/emergent-nexus/releases/latest/download/NEXUS-Setup.exe"
                  className="text-yellow-500/70 hover:text-yellow-400 text-sm font-mono underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DOWNLOAD NEXUS INSTALLER (Windows)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
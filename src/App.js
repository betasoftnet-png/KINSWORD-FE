import React, { useState, useRef, useEffect,useCallback } from 'react';
import './index.css';
import {
  Plus, ChatText, Gear, CaretDown,
  PaperPlaneRight,
  Database,
  SpinnerGap,
  UserCircle, Key, CreditCard, SlidersHorizontal, SignOut,
  MagnifyingGlass, ArrowSquareOut, Warning,
  List, X,
  Image, Video, Briefcase, Newspaper, Globe, MagicWand
} from '@phosphor-icons/react';
import logo from './assests/kins-bgr.png'

function App() {
  // BNX Auth State
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const GUEST_LIMIT = 2;

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('kinsword-theme') || 'light');
  
  // View States
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'settings'
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');
  const [inputMode, setInputMode] = useState('chat'); // 'chat' | 'search'
  // const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- BNX AUTH LOGIC ---
  const fetchUserProfile = async (token) => {
    try {
      const res = await fetch('https://api.bnxmail.com/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bnx-token');
    setUser(null);
  };

  const loginWithBNX = () => {
    const clientId = 'bnx-test-app';
    const redirectUri = 'https://www.kinsword.com';
    const state = 'beta-ai-auth';
    window.location.href = `https://www.b2auth.com/?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      console.log('OAuth code detected, exchanging for token...');
      fetch('https://api.bnxmail.com/api/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantType: 'authorization_code',
          code,
          clientId: 'bnx-test-app',
          clientSecret: 'secure-test-secret-2026'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const token = data.data.access_token;
          localStorage.setItem('bnx-token', token);
          window.history.replaceState({}, document.title, "/");
          fetchUserProfile(token);
        }
      })
      .catch(err => console.error('Token exchange failed:', err));
    } else {
      const savedToken = localStorage.getItem('bnx-token');
      if (savedToken) {
        fetchUserProfile(savedToken);
      }
    }
  }, []);
  // --- END BNX AUTH LOGIC ---
  
  // Chat History Management
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('kinsword-chats');
    return saved ? JSON.parse(saved) : [{
      id: 'default',
      title: 'New Conversation',
      messages: [],
      timestamp: Date.now()
    }];
  });
  
  const [activeId, setActiveId] = useState(() => localStorage.getItem('kinsword-active-id') || 'default');
  const activeChat = conversations.find(c => c.id === activeId) || conversations[0];
  
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchCategory, setSearchCategory] = useState('all');
  const [lastQuery, setLastQuery] = useState('');
  const [searchError, setSearchError] = useState(null);
  const [resultsCache, setResultsCache] = useState({});
  const [metaCache, setMetaCache] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  
  // Language Optimization States
  const [primaryLang, setPrimaryLang] = useState('English');
  const [secondaryLang, setSecondaryLang] = useState('Tamil');
  const [isLangDialogOpen, setIsLangDialogOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(process.env.REACT_APP_GEMINI_API_KEY);

  const textareaRef = useRef(null);
  const chatBottomRef = useRef(null);

  const handleWebSearch = useCallback(async (query) => {
    console.log('Web Search initiated for:', query);
    setLoadingStates(prev => ({ ...prev, all: true }));
    try {
      const res = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      console.log('Web Search Response:', data);
      if (!res.ok) {
        setSearchError(data.error || 'An error occurred during web search.');
      } else {
        setResultsCache(prev => ({ ...prev, all: data.results || [] }));
        setMetaCache(prev => ({ ...prev, all: { total: data.total, page: data.page, pageSize: data.page_size } }));
      }
    } catch (err) {
      console.error('Web Search Fetch Error:', err);
      setSearchError(`Web Search Error: ${err.message}. Check CORS or server status.`);
    } finally {
      setLoadingStates(prev => ({ ...prev, all: false }));
    }
  }, []);

  const handleImageSearch = useCallback(async (query) => {
    console.log('Image Search initiated for:', query);
    setLoadingStates(prev => ({ ...prev, images: true }));
    try {
      const res = await fetch(`http://localhost:8000/api/search/images/?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      console.log('Image Search Response:', data);
      if (!res.ok) {
        setSearchError(data.error || 'An error occurred during image search.');
      } else {
        setResultsCache(prev => ({ ...prev, images: data.results || [] }));
        setMetaCache(prev => ({ ...prev, images: { total: data.total, page: data.page, pageSize: data.page_size } }));
      }
    } catch (err) {
      console.error('Image Search Fetch Error:', err);
      setSearchError(`Image Search Error: ${err.message}. Check CORS or server status.`);
    } finally {
      setLoadingStates(prev => ({ ...prev, images: false }));
    }
  }, []);

  const handleSearch = useCallback(async (query) => {
    setLastQuery(query);
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSearchError(null);
    
    // Trigger web search
    handleWebSearch(query);
    
    // Always trigger image search in background to be ready
    handleImageSearch(query);
    
    // If we are in another mode (videos, etc), you could add more here
  }, [searchCategory, handleImageSearch, handleWebSearch]);

  // Sync Theme to DOM
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('kinsword-theme', theme);
  }, [theme]);

  // Sync Conversations to LocalStorage
  useEffect(() => {
    localStorage.setItem('kinsword-chats', JSON.stringify(conversations));
    localStorage.setItem('kinsword-active-id', activeId);
  }, [conversations, activeId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat.messages, isTyping, inputMode, activeView]);

  // Sync Chat Prompt to Search
  useEffect(() => {
    if (inputMode === 'search' && activeChat.messages.length > 0) {
      const lastUserMsg = [...activeChat.messages].reverse().find(m => m.role === 'user')?.content;
      if (lastUserMsg && lastUserMsg !== lastQuery) {
        handleSearch(lastUserMsg);
        setInputVal(lastUserMsg);
      }
    }
  }, [inputMode, activeChat.messages, lastQuery, handleSearch]);

  const handleInput = (e) => {
    setInputVal(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newChat = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      timestamp: Date.now()
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newId);
    setActiveView('chat');
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    if (conversations.length === 1) return;
    const newConversations = conversations.filter(c => c.id !== id);
    setConversations(newConversations);
    if (activeId === id) {
      setActiveId(newConversations[0].id);
    }
  };

  const getGuestUserMessageCount = () => {
    return conversations.reduce((acc, chat) => 
      acc + chat.messages.filter(m => m.role === 'user').length, 0
    );
  };

  const handleSend = async () => {
    if (!inputVal.trim()) return;

    if (inputMode === 'search') {
      handleSearch(inputVal.trim());
      return;
    }

    // Guest Limit Check
    if (!user) {
      const messageCount = getGuestUserMessageCount();
      if (messageCount >= GUEST_LIMIT) {
        setShowLoginModal(true);
        return;
      }
    }

    const userMsg = inputVal.trim();
    const updatedMessages = [...activeChat.messages, { role: 'user', content: userMsg }];
    
    setConversations(prev => prev.map(c => 
      c.id === activeId 
        ? { ...c, messages: updatedMessages, title: c.title === 'New Conversation' ? userMsg.substring(0, 30) : c.title } 
        : c
    ));
    
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    try {
      // Build Optimization Prompt
      let optimizationInstruction = `Respond in ${primaryLang}.`;
      if (secondaryLang !== 'None' && secondaryLang !== primaryLang) {
        optimizationInstruction = `Respond primarily in ${primaryLang}, but naturally blend in the speaking tone, cultural nuances, and idioms of ${secondaryLang}. Use a stylistic hybrid approach (like 'Tanglish' for Tamil/English) where appropriate, ensuring the core content remains in ${primaryLang} while the tone and some expressions reflect ${secondaryLang}.`;
      }

      const history = activeChat.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...history,
            { role: 'user', parts: [{ text: `${optimizationInstruction} User prompt: ${userMsg}` }] }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

      setConversations(prev => prev.map(c => 
        c.id === activeId 
          ? { ...c, messages: [...updatedMessages, { role: 'ai', content: aiText }] } 
          : c
      ));
    } catch (err) {
      setConversations(prev => prev.map(c => 
        c.id === activeId 
          ? { ...c, messages: [...updatedMessages, { role: 'ai', content: `Error: ${err.message}` }] } 
          : c
      ));
    } finally {
      setIsTyping(false);
    }
  };


  const exportChat = () => {
    const content = activeChat.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinsword-chat-${activeId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const switchView = (view) => {
    setActiveView(view);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src={logo} alt="KinsWord Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
            <span>KINSWORD</span>
          </div>
          <div className="sidebar-header-actions">
            <button className="new-chat-btn" onClick={createNewChat} title="New Chat"><Plus size={20} /></button>
            <button className="new-chat-btn hamburger-close" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
        </div>

        <div className="sidebar-history-container">
          <div className="sidebar-section-title">Recent Chats</div>
          <div className="sidebar-history">
            {conversations.map(chat => (
              <div 
                key={chat.id} 
                className={`history-item-wrapper ${activeId === chat.id ? 'active' : ''}`}
                onClick={() => { setActiveId(chat.id); setActiveView('chat'); }}
              >
                <button className="history-item">
                  <ChatText size={18} />
                  <span>{chat.title}</span>
                </button>
                <button className="delete-chat-btn" onClick={(e) => deleteChat(e, chat.id)}>
                   <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          {user ? (
            <button className="user-profile" onClick={() => switchView('settings')}>
              <div className="user-avatar-placeholder" style={{ background: 'var(--primary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>
                {(user.name || user.username || 'G').substring(0, 1).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.email}</span>
              </div>
              <Gear size={20} />
            </button>
          ) : (
            <button className="btn-primary" style={{ margin: '1rem', width: 'calc(100% - 2rem)' }} onClick={loginWithBNX}>
              Login with BNX
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Mobile Top Bar */}
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(prev => !prev)}>
            {sidebarOpen ? <X size={22} /> : <List size={22} />}
          </button>
          <div className="logo">
            <img src={logo} alt="KinsWord Logo" width={20} height={20} style={{ objectFit: 'contain' }} />
            <span>KINSWORD</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Chat UI */}
        <div className={`view-container ${activeView !== 'chat' ? 'hidden' : ''}`}>
          <div className="top-nav">
            <div className="top-nav-left">
              {!sidebarOpen && (
                <button className="icon-btn desktop-sidebar-toggle" onClick={() => setSidebarOpen(true)} title="Open sidebar">
                  <List size={20} />
                </button>
              )}
            </div>
            <div className="nav-model-selector">
              <span>KINSWORD Multi-Model</span>
              <CaretDown size={16} />
            </div>
            <div className="top-nav-right">
              <div className="lang-selector-wrapper">
                <button className="icon-btn" onClick={() => setIsLangDialogOpen(!isLangDialogOpen)} title="Language Optimization">
                  <MagicWand size={20} />
                </button>
                {isLangDialogOpen && (
                  <div className="lang-dialog">
                    <div className="lang-dialog-header">
                      <h4>Language Optimization</h4>
                      <button className="dialog-close" onClick={() => setIsLangDialogOpen(false)}><X size={14} /></button>
                    </div>
                    <div className="lang-dialog-content">
                      <div className="lang-input-group">
                        <label>Main Language</label>
                        <select value={primaryLang} onChange={(e) => setPrimaryLang(e.target.value)}>
                          {['English', 'Hindi', 'Tamil', 'Bengali', 'Spanish', 'French', 'German', 'Japanese'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="lang-input-group">
                        <label>Secondary Language</label>
                        <select value={secondaryLang} onChange={(e) => setSecondaryLang(e.target.value)}>
                          {['None', 'English', 'Hindi', 'Tamil', 'Bengali', 'Spanish', 'French', 'German', 'Japanese'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="lang-dialog-footer">AI will blend these languages in its response.</p>
                  </div>
                )}
              </div>
              <button className="icon-btn" onClick={exportChat} title="Export Chat">
                <ArrowSquareOut size={20} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {inputMode === 'search' ? (
              <div className="search-engine-panel">
                 {!loadingStates[searchCategory] && !resultsCache[searchCategory] && !searchError && (
                  <div className="search-welcome">
                    <div className="search-welcome-icon">
                      <img src={logo} alt="KinsWord Logo" width={50} height={50} style={{ objectFit: 'contain' }} />
                    </div>
                    <h2>Search the Web</h2>
                    <p>Type a query below and hit Enter to search via the KINSWORD AI Search Engine.</p>
                  </div>
                )}

                 {loadingStates[searchCategory] && (
                  <div className="search-loading">
                    <SpinnerGap size={32} className="spin-icon" />
                    <p>Searching for <strong>"{lastQuery}"</strong>...</p>
                  </div>
                )}

                {searchError && (
                  <div className="search-error-box">
                    <Warning size={20} />
                    <p>{searchError}</p>
                  </div>
                )}

                {resultsCache[searchCategory] && !loadingStates[searchCategory] && (
                  <div className="search-results-container">
                    <p className="search-results-meta">
                      Showing {metaCache[searchCategory]?.total || resultsCache[searchCategory].length} {searchCategory} results for <strong>"{lastQuery}"</strong>
                    </p>
                    {searchCategory === 'images' ? (
                      <div className="image-search-gallery">
                        {resultsCache[searchCategory].map((img, i) => (
                          <div key={i} className="image-result-card">
                            <div className="image-wrapper">
                              <img src={img.local_url ? `http://localhost:8000${img.local_url}` : img.url} alt={img.alt} />
                              <div className="image-overlay">
                                <a href={img.page_url} target="_blank" rel="noreferrer" className="image-source-link">
                                  <img src={img.favicon || logo} alt="site" />
                                  <span>{img.page_title}</span>
                                </a>
                              </div>
                            </div>
                            <p className="image-alt-text">{img.alt || 'No description available'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      resultsCache[searchCategory].map((result, i) => (
                        <a key={i} className="search-result-card" href={result.url} target="_blank" rel="noopener noreferrer">
                          <div className="result-header">
                            <img src={result.favicon || logo} alt="favicon" className="result-favicon" />
                            <span className="result-domain">{result.domain}</span>
                          </div>
                          <h3 className="search-result-title">{result.title}</h3>
                          <p className="search-result-snippet">{result.snippet}</p>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {activeChat.messages.length === 0 && (
                  <div className="welcome-screen">
                    <div className="logo-large-wrap" style={{ background: 'transparent', boxShadow: 'none' }}>
                      <img src={logo} alt="KinsWord Logo" width={64} height={64} style={{ objectFit: 'contain' }} />
                    </div>
                    <h1>What can I help you build today?</h1>
                    <div className="suggestion-chips">
                      <button className="chip" onClick={() => setInputVal('Write a Python script')}>Write a script</button>
                      <button className="chip" onClick={() => setInputVal('Explain quantum computing')}>Explain concept</button>
                      <button className="chip" onClick={() => setInputVal('Draft an email')}>Draft email</button>
                    </div>
                  </div>
                )}

                {activeChat.messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
                    <div className="message-avatar" style={msg.role === 'user' ? { background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' } : {}}>
                      {msg.role === 'user' ? (
                        (user?.name || user?.username || 'G').substring(0, 1).toUpperCase()
                      ) : (
                        <img src={logo} alt="AI" width={20} height={20} style={{ objectFit: 'contain' }} />
                      )}
                    </div>
                    <div className="message-content">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="message ai-message">
                    <div className="message-avatar"><img src={logo} alt="AI" width={20} height={20} style={{ objectFit: 'contain' }} /></div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="chat-input-area">
            <div className="input-mode-switcher">
              <button className={`mode-tab ${inputMode === 'chat' ? 'active' : ''}`} onClick={() => setInputMode('chat')}>
                <img src={logo} alt="Chat" width={15} height={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                AI Chat
              </button>
              
              <div className={`search-mode-wrapper ${inputMode === 'search' ? 'active' : ''}`}>
                <button className={`mode-tab ${inputMode === 'search' ? 'active' : ''}`} onClick={() => { setInputMode('search'); setSearchCategory('all'); }}>
                  <MagnifyingGlass size={15} />
                  <span>Search</span>
                </button>
                <div className="search-dropdown">
                  <button className={`search-dropdown-item ${searchCategory === 'all' ? 'active' : ''}`} onClick={() => { setSearchCategory('all'); setInputMode('search'); if(inputVal.trim() && inputVal.trim() !== lastQuery) handleSearch(inputVal.trim()); }}>
                    <Globe size={16} /> All
                  </button>
                  <button className={`search-dropdown-item ${searchCategory === 'images' ? 'active' : ''}`} onClick={() => { setSearchCategory('images'); setInputMode('search'); if(inputVal.trim() && inputVal.trim() !== lastQuery) handleSearch(inputVal.trim()); }}>
                    <Image size={16} /> Images
                  </button>
                  <button className={`search-dropdown-item ${searchCategory === 'videos' ? 'active' : ''}`} onClick={() => { setSearchCategory('videos'); setInputMode('search'); if(inputVal.trim() && inputVal.trim() !== lastQuery) handleSearch(inputVal.trim()); }}>
                    <Video size={16} /> Videos
                  </button>
                  <button className={`search-dropdown-item ${searchCategory === 'business' ? 'active' : ''}`} onClick={() => { setSearchCategory('business'); setInputMode('search'); if(inputVal.trim() && inputVal.trim() !== lastQuery) handleSearch(inputVal.trim()); }}>
                    <Briefcase size={16} /> Business
                  </button>
                  <button className={`search-dropdown-item ${searchCategory === 'news' ? 'active' : ''}`} onClick={() => { setSearchCategory('news'); setInputMode('search'); if(inputVal.trim() && inputVal.trim() !== lastQuery) handleSearch(inputVal.trim()); }}>
                    <Newspaper size={16} /> News
                  </button>
                </div>
              </div>
            </div>

            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                placeholder={inputMode === 'search' ? 'Search the web...' : 'Message KINSWORD...'}
                rows="1"
                value={inputVal}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
              ></textarea>
              <button className={`icon-btn ${inputVal.trim() ? 'active-send' : ''}`} onClick={handleSend}>
                <PaperPlaneRight weight={inputVal.trim() ? 'fill' : 'regular'} size={20} />
              </button>
            </div>
            <p className="disclaimer">Powered by KINSWORD AI. Accuracy may vary.</p>
          </div>
        </div>

        {/* Settings View */}
        <div className={`view-container settings-container ${activeView !== 'settings' ? 'hidden' : ''}`}>
          <div className="settings-top-nav">
             <div className="settings-nav-label">Settings</div>
             <button className="icon-btn" onClick={() => switchView('chat')} title="Close Settings">
               <X size={20} />
             </button>
          </div>
          <div className="settings-layout">
            <div className="settings-sidebar">
              <h2 className="settings-title">User Settings</h2>
              <div className="settings-nav">
                {['account', 'preferences', 'keys', 'billing'].map(tab => (
                  <button 
                    key={tab} 
                    className={`settings-nav-item ${activeSettingsTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab(tab)}
                  >
                    {tab === 'account' && <UserCircle size={20} />}
                    {tab === 'preferences' && <SlidersHorizontal size={20} />}
                    {tab === 'keys' && <Key size={20} />}
                    {tab === 'billing' && <CreditCard size={20} />}
                    <span style={{ textTransform: 'capitalize' }}>{tab}</span>
                  </button>
                ))}
              </div>
              <div className="settings-sidebar-bottom">
                <button className="settings-nav-item text-danger" onClick={handleLogout}>
                  <SignOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="settings-content">
              {activeSettingsTab === 'account' && (
                <div className="settings-panel">
                  <div className="settings-header">
                    <h3>Account Profile</h3>
                    <p>Manage your public profile and personal details.</p>
                  </div>
                  <div className="settings-card">
                      <div className="profile-edit-section">
                        <div className="profile-avatar-large">
                          <div className="user-avatar-placeholder" style={{ background: 'var(--primary)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
                            {(user?.name || 'G').substring(0, 1).toUpperCase()}
                          </div>
                          <button className="btn-secondary-outline btn-sm">Change Avatar</button>
                        </div>
                        <div className="settings-form" key={user?.id}>
                          <div className="form-group"><label>Name</label><input type="text" className="settings-input" value={user?.name || ''} placeholder="Guest" readOnly /></div>
                          <div className="form-group"><label>BNX Mail Address</label><input type="email" className="settings-input" value={user?.email || ''} placeholder="N/A" readOnly /></div>
                          <div className="form-group"><label>Account Type</label><input type="text" className="settings-input" value={user?.accountType || 'PERSONAL'} readOnly /></div>
                          
                          <div className="form-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This account is managed via BNX Identity.</p>
                            <button className="btn-secondary-outline" onClick={() => window.open('https://www.b2auth.com', '_blank')}>Manage on BNX Dashboard</button>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'preferences' && (
                <div className="settings-panel">
                  <div className="settings-header">
                    <h3>App Preferences</h3>
                    <p>Customize your experience.</p>
                  </div>
                  <div className="settings-card">
                    <div className="preference-item">
                      <div className="toggle-info">
                        <h4>Dark Mode</h4>
                        <p>Switch between light and dark themes.</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    <div className="preference-divider"></div>
                    <div className="preference-item">
                      <div className="toggle-info">
                        <h4>Desktop Notifications</h4>
                        <p>Receive alerts for chat completions.</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'keys' && (
                <div className="settings-panel">
                  <div className="settings-header">
                    <h3>API Integrations</h3>
                    <p>Manage your external API keys.</p>
                  </div>
                   <div className="settings-card">
                    <div className="settings-form">
                      <div className="form-group">
                        <label>Google Gemini API Key</label>
                        <div className="input-with-action">
                          <input 
                            type="password" 
                            className="settings-input" 
                            value={geminiApiKey} 
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder="AIza..."
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Supabase URL</label>
                        <input type="text" className="settings-input" defaultValue="https://xyz.supabase.co" />
                      </div>
                      <div className="form-actions">
                        <button className="btn-primary" onClick={() => switchView('chat')}>Update & Save</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'billing' && (
                <div className="settings-panel">
                  <div className="settings-header">
                    <h3>Billing & Plan</h3>
                    <p>Manage your subscription.</p>
                  </div>
                  <div className="settings-card plan-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)', border: '1px solid var(--accent-light)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Pro Plan</h4>
                      <span className="badge-active">Active</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>$49<span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mo</span></div>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><img src={logo} width={16} height={16} alt="icon" /> Unlimited Standard Chats</li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Database size={16} /> Custom Integrations</li>
                    </ul>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn-primary" style={{ flex: 1 }}>Upgrade</button>
                      <button className="btn-secondary-outline" style={{ flex: 1 }}>Manage</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <button className="close-modal-btn" onClick={() => setShowLoginModal(false)}>
              <X size={20} />
            </button>
            <div className="login-modal-icon">
              <Warning size={32} weight="bold" />
            </div>
            <h2>Login Required</h2>
            <p>You've reached the free message limit. Please log in with your BNX account to continue chatting with KINSWORD AI.</p>
            <div className="login-modal-actions">
              <button className="login-modal-btn primary" onClick={() => { setShowLoginModal(false); loginWithBNX(); }}>
                <Key size={20} weight="fill" />
                Login with BNX
              </button>
              <button className="login-modal-btn secondary" onClick={() => setShowLoginModal(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

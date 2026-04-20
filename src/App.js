import React, { useState, useRef, useEffect } from 'react';
import './index.css';
import {
  Planet, Plus, ChatCircleDots,
  GitBranch, ChatText, Gear, CaretDown,
  Paperclip, PaperPlaneRight,
  Database,
  SpinnerGap,
  UserCircle, Key, CreditCard, SlidersHorizontal, SignOut,
  MagnifyingGlass, ArrowSquareOut, Warning,
  List, X
} from '@phosphor-icons/react';

function App() {
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'settings'
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');
  const [inputMode, setInputMode] = useState('chat'); // 'chat' | 'search'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  const textareaRef = useRef(null);
  const chatBottomRef = useRef(null);


  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);



  const handleInput = (e) => {
    setInputVal(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;

    if (inputMode === 'search') {
      handleSearch(inputVal.trim());
      return;
    }

    const userMsg = inputVal.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'This is a standard chat response from the AI.'
      }]);
    }, 1500);
  };

  const handleSearch = async (query) => {
    setLastQuery(query);
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);
    try {
      const res = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'An error occurred.');
      } else {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      setSearchError('Could not connect to the search server. Make sure it is running on port 8000.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };



  const switchView = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Planet weight="fill" size={24} />
            <span>KINSWORD</span>
          </div>
          <div className="sidebar-header-actions">
            <button className="new-chat-btn"><Plus size={20} /></button>
            <button className="new-chat-btn hamburger-close" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
        </div>


        <div className="sidebar-history-container">
          <div className="sidebar-section-title">Recent Chats</div>
          <div className="sidebar-history">
            <button className="history-item">
              <GitBranch size={18} />
              <span>Customer Support Bot Execution</span>
            </button>
            <button className="history-item">
              <ChatText size={18} />
              <span>How to center a div</span>
            </button>
            <button className="history-item">
              <GitBranch size={18} />
              <span>Daily Lead Generation</span>
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="user-profile" onClick={() => switchView('settings')}>
            <img src="https://i.pravatar.cc/100?img=33" alt="Admin" />
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <span className="user-role">Pro Plan</span>
            </div>
            <Gear size={20} />
          </button>
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
            <Planet weight="fill" size={20} />
            <span>Beta AI</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Abstracted chat overlay for both views */}
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
              <span>KINSWORD Multi-Modal</span>
              <CaretDown size={16} />
            </div>
            <div className="top-nav-right" />
          </div>

          <div className="chat-messages">
            {/* Search Engine Panel */}
            {inputMode === 'search' ? (
              <div className="search-engine-panel">
                {!searchLoading && !searchResults && !searchError && (
                  <div className="search-welcome">
                    <div className="search-welcome-icon">
                      <MagnifyingGlass weight="fill" size={32} />
                    </div>
                    <h2>Search the Web</h2>
                    <p>Type a query below and hit Enter to search via the KINSWORD AI Search Engine.</p>
                    <div className="suggestion-chips" style={{ marginTop: '1.5rem' }}>
                      <button className="chip" onClick={() => handleSearch('Wikipedia')}>Wikipedia</button>
                      <button className="chip" onClick={() => handleSearch('OpenAI')}>OpenAI</button>
                      <button className="chip" onClick={() => handleSearch('React.js')}>React.js</button>
                    </div>
                  </div>
                )}

                {searchLoading && (
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

                {searchResults && !searchLoading && (
                  <div className="search-results-container">
                    <p className="search-results-meta">
                      Showing results for <strong>"{lastQuery}"</strong>
                    </p>
                    {searchResults.length === 0 && (
                      <p className="search-no-results">No results found. Try a different query.</p>
                    )}
                    {searchResults.map((result, i) => (
                      <a
                        key={i}
                        className="search-result-card"
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="search-result-header">
                          <div className="search-result-favicon-wrap">
                            {result.favicon
                              ? <img src={result.favicon} alt="" className="search-result-favicon" onError={e => { e.target.style.display = 'none'; }} />
                              : <MagnifyingGlass size={14} />
                            }
                          </div>
                          <div className="search-result-meta">
                            <span className="search-result-domain">{new URL(result.url).hostname}</span>
                          </div>
                          <ArrowSquareOut size={16} className="search-result-link-icon" />
                        </div>
                        <h3 className="search-result-title">{result.title}</h3>
                        <p className="search-result-snippet">{result.snippet}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="welcome-screen">
                    <div className="logo-large-wrap">
                      <Planet weight="fill" size={32} />
                    </div>
                    <h1>What can I help you build today?</h1>
                    <div className="suggestion-chips">
                      <button className="chip" onClick={() => setInputVal('Write a Python script')}>Write a Python script</button>
                      <button className="chip" onClick={() => setInputVal('Explain quantum computing')}>Explain quantum computing</button>
                      <button className="chip" onClick={() => setInputVal('Draft an email')}>Draft an email</button>
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
                    <div className="message-avatar" style={msg.role === 'user' ? { backgroundImage: 'url("https://i.pravatar.cc/100?img=33")' } : {}}>
                      {msg.role === 'ai' && <Planet weight="fill" size={20} />}
                    </div>
                    <div className="message-content">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="message ai-message">
                    <div className="message-avatar"><Planet weight="fill" size={20} /></div>
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
            {/* Mode Switcher */}
            <div className="input-mode-switcher">
              <button
                className={`mode-tab ${inputMode === 'chat' ? 'active' : ''}`}
                onClick={() => setInputMode('chat')}
              >
                <Planet size={15} />
                AI Chat
              </button>
              <button
                className={`mode-tab ${inputMode === 'search' ? 'active' : ''}`}
                onClick={() => setInputMode('search')}
              >
                <MagnifyingGlass size={15} />
                Search Engine
              </button>
            </div>

            <div className="input-wrapper">
              {inputMode === 'chat' && <button className="icon-btn"><Paperclip size={20} /></button>}
              <textarea
                ref={textareaRef}
                placeholder={inputMode === 'search' ? 'Search the web...' : 'Message Beta AI...'}
                rows="1"
                value={inputVal}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
              ></textarea>
              <button className={`icon-btn ${inputVal.trim() ? 'active-send' : ''}`} onClick={handleSend}>
                {inputMode === 'search'
                  ? <MagnifyingGlass weight={inputVal.trim() ? 'fill' : 'regular'} size={20} />
                  : <PaperPlaneRight weight={inputVal.trim() ? 'fill' : 'regular'} size={20} />
                }
              </button>
            </div>
            <p className="disclaimer">
              {inputMode === 'search'
                ? 'Results are powered by the Beta AI Search Engine API.'
                : 'Beta AI can make mistakes. Consider verifying important information.'
              }
            </p>
          </div>
        </div>

        {/* Settings View */}
        <div className={`view-container settings-container ${activeView !== 'settings' ? 'hidden' : ''}`}>
          <div className="settings-layout">
            <div className="settings-sidebar">
              <h2 className="settings-title">User Settings</h2>
              <div className="settings-nav">
                <button
                  className={`settings-nav-item ${activeSettingsTab === 'account' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('account')}
                >
                  <UserCircle size={20} />
                  <span>Account</span>
                </button>
                <button
                  className={`settings-nav-item ${activeSettingsTab === 'preferences' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('preferences')}
                >
                  <SlidersHorizontal size={20} />
                  <span>Preferences</span>
                </button>
                <button
                  className={`settings-nav-item ${activeSettingsTab === 'keys' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('keys')}
                >
                  <Key size={20} />
                  <span>API Keys</span>
                </button>
                <button
                  className={`settings-nav-item ${activeSettingsTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('billing')}
                >
                  <CreditCard size={20} />
                  <span>Billing & Plan</span>
                </button>
              </div>

              <div className="settings-sidebar-bottom">
                <button className="settings-nav-item text-danger" onClick={() => setActiveView('chat')}>
                  <SignOut size={20} />
                  <span>Sign Out</span>
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
                        <img src="https://i.pravatar.cc/150?img=33" alt="Admin" />
                        <button className="btn-secondary btn-sm">Change Avatar</button>
                      </div>

                      <div className="settings-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>First Name</label>
                            <input type="text" className="settings-input" defaultValue="Admin" />
                          </div>
                          <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" className="settings-input" defaultValue="User" />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input type="email" className="settings-input" defaultValue="admin@beta-ai.com" />
                        </div>
                        <div className="form-group">
                          <label>Role</label>
                          <input type="text" className="settings-input" defaultValue="Super Administrator" disabled />
                        </div>
                        <div className="form-actions">
                          <button className="btn-primary">Save Changes</button>
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
                    <p>Customize your experience on the Beta AI platform.</p>
                  </div>

                  <div className="settings-card">
                    <div className="preference-item">
                      <div className="toggle-info">
                        <h4>Dark Mode</h4>
                        <p>Toggle between light and dark themes.</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
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

                    <div className="preference-divider"></div>

                    <div className="preference-item">
                      <div className="toggle-info">
                        <h4>Compact Mode</h4>
                        <p>Reduce padding and margins across the UI.</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" />
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
                        <label>OpenAI API Key</label>
                        <div className="input-with-action">
                          <input type="password" className="settings-input" defaultValue="sk-proj-xxxxxxxxxxxxxxxxxxxx" />
                          <button className="btn-secondary btn-sm">Reveal</button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Anthropic API Key</label>
                        <div className="input-with-action">
                          <input type="password" className="settings-input" defaultValue="sk-ant-xxxxxxxxxxxxxxxxxxxx" />
                          <button className="btn-secondary btn-sm">Reveal</button>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginTop: '2rem' }}>
                        <label>Supabase URL</label>
                        <input type="text" className="settings-input" defaultValue="https://xyz.supabase.co" />
                      </div>
                      <div className="form-group">
                        <label>Supabase Anon Key</label>
                        <input type="password" className="settings-input" defaultValue="eyJhbGciOiJIUzI1NiIsInR..." />
                      </div>
                      <div className="form-actions">
                        <button className="btn-primary">Update Keys</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsTab === 'billing' && (
                <div className="settings-panel">
                  <div className="settings-header">
                    <h3>Billing & Plan</h3>
                    <p>Manage your subscription and payment methods.</p>
                  </div>

                  <div className="settings-card plan-card">
                    <div className="plan-header">
                      <div className="plan-title">
                        <h4>Pro Plan</h4>
                        <span className="badge badge-active">Active</span>
                      </div>
                      <div className="plan-price">
                        <span className="currency">$</span><span className="amount">49</span><span className="period">/mo</span>
                      </div>
                    </div>
                    <div className="plan-details">
                      <ul>
                        <li><Planet size={16} color="var(--accent)" /> Unlimited Standard Chats</li>

                        <li><Database size={16} color="var(--accent)" /> Custom Supabase Integration</li>
                        <li><ChatCircleDots size={16} color="var(--accent)" /> Priority Support</li>
                      </ul>
                    </div>
                    <div className="plan-actions">
                      <button className="btn-secondary">Cancel Plan</button>
                      <button className="btn-primary">Upgrade to Enterprise</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;

import React, { useEffect, useState, useRef } from 'react';

export function HoloToast({ toast, onClose }) {
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast.visible) return null;

  return (
    <div className="toast-notification">
      <span>✓</span>
      <span>{toast.msg}</span>
    </div>
  );
}

export default HoloToast;

export function AiAssistantModal({ isOpen, onClose, lang = 'fr', triggerToast }) {
  const isFrench = lang === 'fr';
  const location = 'Yaoundé';

  // Processing state: 'IDLE' | 'THINKING' | 'SEARCHING' | 'STREAMING' | 'COMPLETED'
  const [procState, setProcState] = useState('IDLE');
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const chatBottomRef = useRef(null);

  const sampleServices = [
    {
      id: 1,
      title: isFrench ? 'Dépannage & Plomberie d’Urgence' : 'Emergency Plumbing & Leak Fix',
      artisan: 'Derreck Plomb',
      rating: '5.0',
      reviews: 24,
      city: 'Yaoundé (Bastos)',
      price: '15,000 FCFA',
      tags: ['Plomberie', 'Urgence', '24/7'],
      img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      title: isFrench ? 'Installation Solaire & Électricité Villa' : 'Villa Solar Installation & Electric',
      artisan: 'Emmanuel Ngu',
      rating: '4.9',
      reviews: 38,
      city: 'Yaoundé (Mvan)',
      price: '45,000 FCFA',
      tags: ['Électricité', 'Solaire', 'Certifié'],
      img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      title: isFrench ? 'Climatisation Froid & Chambres Froides' : 'Cold Room & AC Maintenance',
      artisan: 'Alain Foe',
      rating: '4.8',
      reviews: 19,
      city: 'Yaoundé (Omnisports)',
      price: '20,000 FCFA',
      tags: ['Climatisation', 'Frigo'],
      img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const promptSuggestions = isFrench
    ? [
        '🔧 J’ai besoin d’un plombier qualifié',
        '⚡ Je cherche un électricien à Bastos',
        '❄️ Dépannage climatisation en urgence',
        '🛡️ Comment fonctionne la garantie Escrow ?'
      ]
    : [
        '🔧 I need a qualified plumber',
        '⚡ Looking for an electrician in Bastos',
        '❄️ Emergency AC maintenance',
        '🛡️ How does Skillora Escrow protection work?'
      ];

  const handleResetChat = () => {
    setMessages([]);
    setProcState('IDLE');
    setStreamingText('');
    setInputVal('');
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText, procState]);

  const isServiceRequestIntent = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    
    // Pure greetings without specific service keywords should not trigger cards
    const pureGreetings = ['bonjour', 'bonsoir', 'salut', 'hello', 'hi', 'coucou', 'yo', 'ça va', 'ca va', 'merci', 'merci beaucoup', 'super', 'daccord', "d'accord", 'ok', 'bye', 'au revoir'];
    if (pureGreetings.includes(lower)) {
      return false;
    }

    const serviceKeywords = [
      'plomb', 'electr', 'électr', 'clim', 'menuis', 'maçon', 'macon', 'peint', 
      'solaire', 'fuite', 'panne', 'court-circuit', 'dépannage', 'depannage', 
      'réparation', 'reparation', 'installation', 'travaux', 'devis', 'artisan', 
      'technicien', 'professionnel', 'bâtiment', 'batiment', 'wc', 'toilette', 
      'serrur', 'carrel', 'renovation', 'rénovation', 'tuyau', 'eau', 'prise', 
      'tableau', 'interrupteur', 'armoire', 'compteur', 'frigo', 'chambre froide',
      'chercher', 'cherche', 'besoin', 'trouver', 'prix', 'tarif', 'combien'
    ];

    return serviceKeywords.some(keyword => lower.includes(keyword));
  };

  const runAiResponseFlow = async (userText) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isServiceIntent = isServiceRequestIntent(userText);
    
    // 1. Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: timeNow
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // Flow Step 1: Thinking State
    setProcState('THINKING');

    console.log("🚀 [Skillora AI] Initiating API request for prompt:", userText, "| Service Intent:", isServiceIntent);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const apiKey = import.meta.env.VITE_AI_API_KEY || "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";

    let aiGeneratedText = "";
    let isFromLiveApi = false;
    let apiSourceLabel = "";

    // Attempt 1: Call Backend API Endpoint /api/ai/chat
    try {
      setProcState('SEARCHING');
      console.log(`🌐 [Skillora AI] Sending POST request to backend endpoint: ${backendUrl}/api/ai/chat`);

      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          location: location,
          lang: lang,
          history: messages.slice(-4)
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ [Skillora AI] Backend API Response Received:", data);
        if (data.success && data.data && data.data.text) {
          aiGeneratedText = data.data.text;
          isFromLiveApi = true;
          apiSourceLabel = data.data.source === "openrouter_api" ? "OpenRouter API (Backend)" : "Backend API";
        }
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ [Skillora AI] Backend API returned HTTP ${response.status}:`, errorText);
      }
    } catch (backendErr) {
      console.error("❌ [Skillora AI Error] Failed to connect to Backend Server:", backendErr.message);
    }

    // Attempt 2: Direct OpenRouter API Call if Backend API didn't return text
    if (!aiGeneratedText) {
      try {
        console.log("🌐 [Skillora AI] Attempting Direct OpenRouter API Call with VITE_AI_API_KEY...");
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Skillora Assistant Platform",
          },
          body: JSON.stringify({
            model: "minimax/minimax-m3:free",
            messages: [
              {
                role: "system",
                content: `Tu es "Skillora Assistant", l'assistant officiel de la plateforme Skillora à Yaoundé.

RÔLE ET TON :
- Tu es accueillant, professionnel, clair et humain.
- Tu réponds de manière fluide et naturelle aux salutations (ex: "Bonjour", "Comment vas-tu ?").
- Tu structures tes réponses avec du Markdown (gras, listes à puces, emojis) pour que ce soit facile à lire.

RÈGLES DE RÉPONSE :
1. Si l'utilisateur pose une question sur Skillora, explique clairement les services (recherche d'artisans certifiés, avis clients, contact direct, garantie séquestre).
2. Si l'utilisateur cherche un service précis (ex: plombier, électricien), demande des précisions si nécessaire ou propose directement la catégorie adaptée.
3. Termine souvent par une question d'engagement courte (ex: "Quel service recherchez-vous aujourd'hui sur Skillora ?").`
              },
              ...messages.slice(-4).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
              })),
              { role: "user", content: userText }
            ],
            temperature: 0.6
          })
        });

        if (openRouterRes.ok) {
          const openData = await openRouterRes.json();
          console.log("✅ [Skillora AI] Direct OpenRouter API Response Received:", openData);
          if (openData.choices && openData.choices[0] && openData.choices[0].message) {
            aiGeneratedText = openData.choices[0].message.content;
            isFromLiveApi = true;
            apiSourceLabel = "OpenRouter Direct API";
          }
        } else {
          const errBody = await openRouterRes.text();
          console.error(`❌ [Skillora AI Error] OpenRouter API ${openRouterRes.status}:`, errBody);
        }
      } catch (directErr) {
        console.error("❌ [Skillora AI Exception] Direct API fetch failed:", directErr);
      }
    }

    // Fallback if APIs are unreachable
    if (!aiGeneratedText) {
      console.warn("⚠️ [Skillora AI Warning] Using fallback response mode due to network/API error.");
      const lowerText = userText.toLowerCase().trim();
      const isGreeting = ['bonjour', 'salut', 'hello', 'hi', 'coucou', 'bonsoir', 'ça va', 'ca va'].some(g => lowerText.includes(g));

      if (isGreeting) {
        aiGeneratedText = lang === 'fr'
          ? `Bonjour ! Bienvenue sur Skillora 👋 Comment puis-je vous aider aujourd'hui ?`
          : `Hello! Welcome to Skillora 👋 How can I help you today?`;
      } else {
        aiGeneratedText = lang === 'fr'
          ? `Pour votre besoin à **${location}**, voici les **artisans certifiés Skillora** disponibles immédiatement avec la garantie séquestre FCFA.`
          : `For your project in **${location}**, here are the closest **Skillora Certified Professionals** backed by FCFA Escrow Guarantee.`;
      }
      apiSourceLabel = "Mode Secours";
    }

    // Flow Step 3: Streaming State (Typewriter)
    setProcState('STREAMING');

    let currentIdx = 0;
    setStreamingText('');

    const interval = setInterval(() => {
      currentIdx += 4;
      if (currentIdx <= aiGeneratedText.length) {
        setStreamingText(aiGeneratedText.slice(0, currentIdx));
      } else {
        clearInterval(interval);
        setStreamingText('');
        // Flow Step 4: Completed State
        setProcState('COMPLETED');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: aiGeneratedText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cards: isServiceIntent ? sampleServices : null,
            apiLive: isFromLiveApi,
            sourceLabel: apiSourceLabel,
            recommendations: isServiceIntent
              ? (lang === 'fr'
                  ? ['Contacter via WhatsApp', 'Réserver avec Garantie Séquestre', 'Comparer les tarifs']
                  : ['Contact via WhatsApp', 'Book with Escrow Protection', 'Compare rates'])
              : (lang === 'fr'
                  ? ['🔧 J\'ai besoin d\'un plombier', '⚡ Je cherche un électricien', '❄️ Climatisation']
                  : ['🔧 I need a plumber', '⚡ Looking for an electrician', '❄️ AC Repair'])
          }
        ]);
        setTimeout(() => setProcState('IDLE'), 300);
      }
    }, 20);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || procState !== 'IDLE') return;
    runAiResponseFlow(inputVal.trim());
  };

  const handleSuggestionClick = (suggestion) => {
    if (procState !== 'IDLE') return;
    runAiResponseFlow(suggestion);
  };

  const copyAiText = (txt) => {
    navigator.clipboard.writeText(txt.replace(/\*\*/g, ''));
    if (triggerToast) {
      triggerToast(isFrench ? 'Réponse copiée dans le presse-papier !' : 'Response copied to clipboard!', '📋');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-backdrop" onClick={onClose}>
      <div className="ai-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Top App Bar */}
        <header className="ai-top-app-bar">
          <div className="ai-bar-left">
            <button className="ai-back-btn" onClick={onClose} title={isFrench ? 'Fermer' : 'Close'}>
              ←
            </button>
            <div className="ai-identity">
              <div className="ai-avatar-ring">
                <span className="ai-avatar-emoji">✨</span>
                <span className="ai-status-dot"></span>
              </div>
              <div className="ai-identity-texts">
                <div className="ai-title-row">
                  <span className="ai-assistant-name">Skillora Assistant</span>
                  <span className="ai-badge-chip">AI 2.0</span>
                </div>
                <span className="ai-location-subtext">📍 {location}</span>
              </div>
            </div>
          </div>

          <div className="ai-bar-right">
            <button
              className="ai-reset-chat-btn"
              onClick={handleResetChat}
              title={isFrench ? 'Nouvelle conversation' : 'New chat / Reset'}
            >
              +
            </button>
          </div>
        </header>

        {/* Chat Stream Body */}
        <div className="ai-chat-stream-body">
          {/* Empty State / Welcome View */}
          {messages.length === 0 && procState === 'IDLE' && (
            <div className="ai-empty-welcome-view">
              <div className="ai-welcome-avatar-large">
                <span>🤖</span>
              </div>
              <h2 className="ai-welcome-greeting">
                {isFrench ? 'Bonjour ! Je suis votre Assistant Skillora 👋' : "Hi! I'm your Skillora Assistant 👋"}
              </h2>
              <p className="ai-context-subtitle">
                🔍 {isFrench ? `Recherche active à [${location}]` : `Searching in [${location}]`}
              </p>

              {/* Prompt Suggestion Chips */}
              <div className="ai-prompt-chips-stack">
                <span className="chips-heading">
                  {isFrench ? 'Suggestions rapides :' : 'Quick Prompts:'}
                </span>
                {promptSuggestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="ai-prompt-chip-btn"
                    onClick={() => handleSuggestionClick(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History */}
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message-row ${msg.sender === 'user' ? 'user-align' : 'ai-align'}`}>
              {msg.sender === 'ai' && (
                <div className="ai-msg-avatar">
                  <span>✨</span>
                </div>
              )}

              <div className={`ai-msg-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                {msg.sender === 'user' ? (
                  <>
                    <p className="bubble-text">{msg.text}</p>
                    <span className="bubble-timestamp">{msg.time}</span>
                  </>
                ) : (
                  <>
                    <div
                      className="bubble-markdown"
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />

                    {/* Embedded Product / Service Cards Carousel */}
                    {msg.cards && msg.cards.length > 0 && (
                      <div className="ai-embedded-cards-carousel">
                        {msg.cards.map((card) => (
                          <div key={card.id} className="ai-service-preview-card">
                            <div className="preview-card-img-wrap">
                              <img src={card.img} alt={card.title} />
                              <span className="preview-rating-pill">★ {card.rating}</span>
                              <span className="preview-price-tag">{card.price}</span>
                            </div>
                            <div className="preview-card-content">
                              <div className="preview-tags-row">
                                {card.tags.map((t, i) => (
                                  <span key={i} className="preview-tag">{t}</span>
                                ))}
                              </div>
                              <h4 className="preview-service-title">{card.title}</h4>
                              <div className="preview-subinfo">
                                <span>🧑‍🔧 {card.artisan}</span>
                                <span>📍 {card.city}</span>
                              </div>
                              <button
                                className="preview-action-btn"
                                onClick={() => {
                                  const text = encodeURIComponent(`Bonjour ${card.artisan}, je vous contacte via Skillora Assistant pour "${card.title}".`);
                                  window.open(`https://wa.me/237699887766?text=${text}`, '_blank');
                                }}
                              >
                                💬 WhatsApp Pro →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons / copy below AI response */}
                    <div className="ai-response-meta-actions">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button className="btn-copy-ai" onClick={() => copyAiText(msg.text)}>
                          📄 {isFrench ? 'Copier' : 'Copy'}
                        </button>
                        {msg.sourceLabel && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: msg.apiLive ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 193, 7, 0.15)',
                            border: `1px solid ${msg.apiLive ? '#4CAF50' : '#ffc107'}`,
                            color: msg.apiLive ? '#4CAF50' : '#ffc107',
                            fontWeight: 700
                          }}>
                            {msg.apiLive ? '⚡ API IA CONNECTÉE' : 'ℹ️ MODE SECOURS'} ({msg.sourceLabel})
                          </span>
                        )}
                      </div>
                      {msg.recommendations && (
                        <div className="ai-followup-recommendations">
                          {msg.recommendations.map((rec, rIdx) => (
                            <span
                              key={rIdx}
                              className="followup-pill"
                              onClick={() => handleSuggestionClick(rec)}
                            >
                              💡 {rec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="bubble-timestamp ai-time">{msg.time}</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Dynamic Streaming / Typewriter State */}
          {procState === 'STREAMING' && (
            <div className="ai-message-row ai-align">
              <div className="ai-msg-avatar">
                <span>✨</span>
              </div>
              <div className="ai-msg-bubble bubble-ai">
                <div
                  className="bubble-markdown"
                  dangerouslySetInnerHTML={{
                    __html: streamingText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
                <span className="typewriter-cursor">|</span>
              </div>
            </div>
          )}

          {/* AI Processing Status Badges (Pill Badges) */}
          {procState === 'THINKING' && (
            <div className="ai-status-pill thinking">
              <span className="pulse-circle green"></span>
              <span>🟢 {isFrench ? 'Réflexion en cours...' : 'Thinking...'}</span>
            </div>
          )}

          {procState === 'SEARCHING' && (
            <div className="ai-status-pill searching">
              <span className="pulse-circle blue"></span>
              <span>🔍 {isFrench ? `Recherche des artisans à ${location}...` : `Searching in ${location}...`}</span>
            </div>
          )}

          {procState === 'STREAMING' && (
            <div className="ai-status-pill responding">
              <span className="pulse-circle green"></span>
              <span>🟢 {isFrench ? 'Réponse en cours...' : 'Responding...'}</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Bottom Input Bar */}
        <footer className="ai-bottom-input-bar">
          <form className="ai-input-form" onSubmit={handleSend}>
            <input
              type="text"
              className="ai-rounded-text-input"
              placeholder={isFrench ? `Posez une question sur les services à ${location}...` : `Ask about services in ${location}...`}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={procState !== 'IDLE'}
            />
            <button
              type="submit"
              className={`ai-send-btn ${inputVal.trim() && procState === 'IDLE' ? 'active-green' : 'inactive-grey'}`}
              disabled={!inputVal.trim() || procState !== 'IDLE'}
              title="Send"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

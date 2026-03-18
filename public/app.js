document.addEventListener('DOMContentLoaded', () => {
    // ── Service Worker Registration ────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW reg failed:', err));
    }

    // ── Basic Elements ─────────────────────────────────────────────────────────
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    const chatForm = document.getElementById('chat-form');
    const chatContainer = document.getElementById('chat-container');
    const messagesWrapper = document.getElementById('messages-wrapper');
    const welcomeScreen = document.getElementById('welcome-screen');
    const newChatBtn = document.getElementById('new-chat-btn');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const chatHistoryList = document.getElementById('chat-history-list');
    const clearChatsBtn = document.getElementById('clear-chats-btn');
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    const sidebarSearch = document.getElementById('sidebar-search');
    const micBtn = document.getElementById('mic-btn');
    const fileInput = document.getElementById('file-input');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const toast = document.getElementById('toast');
    const quickPromptsBar = document.getElementById('quick-prompts');

    // Settings Modal
    const settingsBtn = document.getElementById('role-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const systemPromptInput = document.getElementById('system-prompt-input');

    // Landing Page
    const landingPage = document.getElementById('landing-page');
    const landingLoginBtn = document.getElementById('landing-login-btn');
    const landingRegisterBtn = document.getElementById('landing-register-btn');
    const landingStartBtn = document.getElementById('landing-start-btn');
    const landingLearnBtn = document.getElementById('landing-learn-btn');

    // Profile Modal
    const profileModal = document.getElementById('profile-modal');
    const profileBtn = document.getElementById('profile-btn');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const profileSaveBtn = document.getElementById('profile-save-btn');
    const profileLogoutBtn = document.getElementById('profile-logout-btn');
    const profileName = document.getElementById('profile-name');
    const profileSurname = document.getElementById('profile-surname');
    const profilePhone = document.getElementById('profile-phone');
    const profileEmail = document.getElementById('profile-email');
    const profileSaveMsg = document.getElementById('profile-save-msg');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    const avatarColorPick = document.getElementById('avatar-color-pick');
    const avatarEmojiBtn = document.getElementById('avatar-emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const userAvatar = document.getElementById('user-avatar');
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayEmail = document.getElementById('user-display-email');
    const statChats = document.getElementById('stat-chats');
    const statMessages = document.getElementById('stat-messages');

    // Auth View
    const authView = document.getElementById('auth-view');
    const appContainer = document.getElementById('app-container');
    const loginBox = document.getElementById('login-box');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const showRegisterLink = document.getElementById('show-register-link');
    const registerBox = document.getElementById('register-box');
    const registerForm = document.getElementById('register-form');
    const registerName = document.getElementById('register-name');
    const registerSurname = document.getElementById('register-surname');
    const registerPhone = document.getElementById('register-phone');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerErrorMsg = document.getElementById('register-error-msg');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const showLoginLink = document.getElementById('show-login-link');

    // ── Auth State ─────────────────────────────────────────────────────────────
    let currentUser = null;
    let supabaseClient = null;
    let avatarContent = '?';
    let avatarColor = '#7c3aed';

    // ── Toast ──────────────────────────────────────────────────────────────────
    let toastTimeout;
    function showToast(msg, type = 'info') {
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast toast-${type} show`;
        toast.style.display = 'block';
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toast.style.display = 'none'; }, 400);
        }, 3500);
    }

    // ── Landing Page → Auth ────────────────────────────────────────────────────
    function showLandingToAuth(mode) {
        landingPage.style.display = 'none';
        authView.style.display = 'flex';
        if (mode === 'register') {
            loginBox.style.display = 'none';
            registerBox.style.display = 'block';
        } else {
            loginBox.style.display = 'block';
            registerBox.style.display = 'none';
        }
    }

    landingLoginBtn.addEventListener('click', () => showLandingToAuth('login'));
    landingRegisterBtn.addEventListener('click', () => showLandingToAuth('register'));
    landingStartBtn.addEventListener('click', () => showLandingToAuth('register'));
    landingLearnBtn.addEventListener('click', () => {
        document.querySelector('.landing-features').scrollIntoView({ behavior: 'smooth' });
    });

    // ── Supabase Init ──────────────────────────────────────────────────────────
    async function initSupabase() {
        try {
            const res = await fetch('/api/config');
            if (!res.ok) {
                showConfigError("Sunucu yapılandırması yüklenemedi.");
                return;
            }
            const config = await res.json();
            if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
                supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
                const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
                if (sessionError) console.error("Session error:", sessionError);
                if (session) {
                    handleLoginSuccess(session.user);
                } else {
                    landingPage.style.display = 'flex';
                    authView.style.display = 'none';
                    appContainer.style.display = 'none';
                }
            } else {
                showConfigError("Supabase bağlantı bilgileri eksik.");
                landingPage.style.display = 'flex';
            }
        } catch (e) {
            console.error("Failed to load config:", e);
            showConfigError("Bağlantı hatası: " + e.message);
            landingPage.style.display = 'flex';
        }
    }

    function showConfigError(msg) {
        if (loginErrorMsg) {
            loginErrorMsg.innerText = msg;
            loginErrorMsg.style.display = 'block';
            loginErrorMsg.style.background = 'rgba(239, 68, 68, 0.1)';
            loginErrorMsg.style.color = '#ef4444';
            loginErrorMsg.style.padding = '10px';
            loginErrorMsg.style.borderRadius = '8px';
            loginErrorMsg.style.marginTop = '10px';
        }
        if (registerErrorMsg) {
            registerErrorMsg.innerText = msg;
            registerErrorMsg.style.display = 'block';
        }
    }

    async function handleLoginSuccess(user) {
        currentUser = user;
        landingPage.style.display = 'none';
        authView.style.display = 'none';
        appContainer.style.display = 'flex';

        const savedAvatar = localStorage.getItem('fay_avatar_content');
        const savedColor = localStorage.getItem('fay_avatar_color');
        if (savedAvatar) avatarContent = savedAvatar;
        if (savedColor) avatarColor = savedColor;

        const meta = user.user_metadata || {};
        const name = meta.name || user.email.split('@')[0];
        const surname = meta.surname || '';
        const fullName = `${name} ${surname}`.trim();

        if (userDisplayName) userDisplayName.innerText = fullName;
        if (userDisplayEmail) userDisplayEmail.innerText = user.email;
        if (userAvatar) {
            userAvatar.innerText = avatarContent !== '?' ? avatarContent : name.charAt(0).toUpperCase();
            userAvatar.style.background = avatarColor;
        }

        await loadDBSessions();
    }

    initSupabase();

    // ── Auth Forms ─────────────────────────────────────────────────────────────
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.style.display = 'none';
        registerBox.style.display = 'block';
        loginErrorMsg.style.display = 'none';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerBox.style.display = 'none';
        loginBox.style.display = 'block';
        registerErrorMsg.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabaseClient) return;
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerText = 'Giriş Yapılıyor...';
        loginErrorMsg.style.display = 'none';
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            loginErrorMsg.innerText = error.message;
            loginErrorMsg.style.display = 'block';
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerText = 'Giriş Yap';
        } else {
            handleLoginSuccess(data.user);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!supabaseClient) return;
        registerSubmitBtn.disabled = true;
        registerSubmitBtn.innerText = 'Kayıt Olunuyor...';
        registerErrorMsg.style.display = 'none';
        const email = registerEmail.value.trim();
        const password = registerPassword.value;
        const name = registerName.value.trim();
        const surname = registerSurname.value.trim();
        const phone = registerPhone.value.trim();
        const { data, error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { name, surname, phone } }
        });
        if (error) {
            registerErrorMsg.innerText = error.message;
            registerErrorMsg.style.display = 'block';
            registerSubmitBtn.disabled = false;
            registerSubmitBtn.innerText = 'Kayıt Ol';
        } else {
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                registerErrorMsg.innerText = "Bu e-posta adresi zaten kullanımda.";
                registerErrorMsg.style.display = 'block';
                registerSubmitBtn.disabled = false;
                registerSubmitBtn.innerText = 'Kayıt Ol';
                return;
            }
            if (data.session) {
                handleLoginSuccess(data.user);
            } else {
                registerErrorMsg.style.color = "#10B981";
                registerErrorMsg.style.background = "rgba(16, 185, 129, 0.1)";
                registerErrorMsg.innerText = "Kayıt başarılı! Lütfen giriş yapın.";
                registerErrorMsg.style.display = 'block';
                setTimeout(() => {
                    registerBox.style.display = 'none';
                    loginBox.style.display = 'block';
                    loginEmail.value = email;
                    registerSubmitBtn.disabled = false;
                    registerSubmitBtn.innerText = 'Kayıt Ol';
                    registerErrorMsg.style.color = "#ef4444";
                    registerErrorMsg.style.background = "rgba(239, 68, 68, 0.1)";
                    registerErrorMsg.style.display = 'none';
                }, 2000);
            }
        }
    });

    // ── Profile Modal ──────────────────────────────────────────────────────────
    profileBtn.addEventListener('click', () => {
        if (!currentUser) return;
        const meta = currentUser.user_metadata || {};
        profileName.value = meta.name || '';
        profileSurname.value = meta.surname || '';
        profilePhone.value = meta.phone || meta.phone_number || '';
        profileEmail.value = currentUser.email || '';
        profileAvatarPreview.innerText = avatarContent !== '?' ? avatarContent : (meta.name || currentUser.email).charAt(0).toUpperCase();
        profileAvatarPreview.style.background = avatarColor;
        profileSaveMsg.style.display = 'none';
        emojiPicker.style.display = 'none';

        // Calculate usage stats
        const totalChats = sessions.filter(s => s.history.length > 0).length;
        const totalMessages = sessions.reduce((sum, s) => sum + s.history.length, 0);
        if (statChats) statChats.textContent = totalChats;
        if (statMessages) statMessages.textContent = totalMessages;

        profileModal.style.display = 'flex';
    });

    closeProfileBtn.addEventListener('click', () => { profileModal.style.display = 'none'; });
    profileModal.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.style.display = 'none'; });

    avatarColorPick.addEventListener('input', (e) => {
        avatarColor = e.target.value;
        profileAvatarPreview.style.background = avatarColor;
        if (userAvatar) userAvatar.style.background = avatarColor;
        localStorage.setItem('fay_avatar_color', avatarColor);
    });

    avatarEmojiBtn.addEventListener('click', () => {
        emojiPicker.style.display = emojiPicker.style.display === 'flex' ? 'none' : 'flex';
    });

    emojiPicker.querySelectorAll('span').forEach(span => {
        span.addEventListener('click', () => {
            avatarContent = span.innerText;
            profileAvatarPreview.innerText = avatarContent;
            if (userAvatar) userAvatar.innerText = avatarContent;
            localStorage.setItem('fay_avatar_content', avatarContent);
            emojiPicker.style.display = 'none';
        });
    });

    profileSaveBtn.addEventListener('click', async () => {
        if (!supabaseClient || !currentUser) return;
        profileSaveBtn.disabled = true;
        profileSaveBtn.innerText = 'Kaydediliyor...';
        const name = profileName.value.trim();
        const surname = profileSurname.value.trim();
        const phone = profilePhone.value.trim();
        const { error } = await supabaseClient.auth.updateUser({ data: { name, surname, phone } });
        if (error) {
            profileSaveMsg.className = 'auth-error';
            profileSaveMsg.innerText = error.message;
        } else {
            currentUser.user_metadata = { ...currentUser.user_metadata, name, surname, phone };
            const fullName = `${name} ${surname}`.trim();
            if (userDisplayName) userDisplayName.innerText = fullName;
            if (userAvatar && avatarContent === '?') userAvatar.innerText = name.charAt(0).toUpperCase();
            profileSaveMsg.className = 'success';
            profileSaveMsg.innerText = '✓ Profil başarıyla güncellendi!';
        }
        profileSaveMsg.style.display = 'block';
        profileSaveBtn.disabled = false;
        profileSaveBtn.innerText = 'Kaydet';
    });

    profileLogoutBtn.addEventListener('click', async () => {
        if (supabaseClient) await supabaseClient.auth.signOut();
        window.location.reload();
    });

    // ── State ──────────────────────────────────────────────────────────────────
    const SYSTEM_PROMPT_KEY = 'fay_ai_system_prompt';
    const PERSONA_KEY = 'fay_ai_persona';
    const DEFAULT_SYSTEM_PROMPT = 'Sen yardımsever, zeki ve nazik bir yapay zeka asistanısın.';
    let savedSystemPrompt = localStorage.getItem(SYSTEM_PROMPT_KEY) || DEFAULT_SYSTEM_PROMPT;
    let savedPersona = localStorage.getItem(PERSONA_KEY) || 'default';
    if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;
    document.documentElement.setAttribute('data-persona', savedPersona);

    const LANG_KEY = 'fay_ai_lang';
    let currentLang = localStorage.getItem(LANG_KEY) || 'TR';

    let sessions = [];
    let currentSessionId = null;
    let isWaitingForResponse = false;
    let currentAbortController = null;
    let pendingFileContext = null; // { name, content }

    // ── Supabase Sync ──────────────────────────────────────────────────────────
    async function loadDBSessions() {
        if (!currentUser || !supabaseClient) return;
        const { data, error } = await supabaseClient
            .from('sessions')
            .select(`id, title, messages(id, role, content, created_at)`)
            .order('created_at', { ascending: false });
        if (error) { console.error('Error loading sessions:', error); return; }

        sessions = data.map(dbSession => ({
            id: dbSession.id,
            title: dbSession.title,
            history: dbSession.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
            messagesHtml: ''
        }));

        sessions.forEach(s => {
            let html = '';
            s.history.forEach(msg => {
                const avatarText = msg.role === 'user' ? 'U' : 'FAY';
                let contentHtml = '';
                if (msg.role === 'assistant') {
                    contentHtml = marked.parse(msg.content);
                } else {
                    const escaped = msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
                    contentHtml = `<p>${escaped}</p>`;
                }
                html += `
                <div class="message ${msg.role === 'user' ? 'user-msg' : 'bot-msg'}">
                    <div class="message-avatar">${avatarText}</div>
                    <div class="message-content markdown-body">${contentHtml}</div>
                </div>`;
            });
            s.messagesHtml = html;
        });

        const startId = 'local-' + Date.now();
        sessions.unshift({ id: startId, title: 'New Conversation', history: [], messagesHtml: '' });
        currentSessionId = startId;
        switchSession(currentSessionId);
    }

    function getCurrentSession() {
        return sessions.find(s => s.id === currentSessionId);
    }

    function renderSidebar(filterText = '') {
        chatHistoryList.innerHTML = '';
        const lc = filterText.toLowerCase();
        const visible = sessions.filter(s =>
            (s.history.length > 0 || s.id === currentSessionId) &&
            (!lc || s.title.toLowerCase().includes(lc))
        );

        visible.forEach(session => {
            const item = document.createElement('div');
            item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'history-title';
            titleSpan.textContent = session.title;

            item.appendChild(titleSpan);

            if (session.history.length > 0) {
                // Export button
                const exportBtn = document.createElement('button');
                exportBtn.className = 'export-chat-btn';
                exportBtn.title = 'İndir';
                exportBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
                exportBtn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    exportSession(session);
                });

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-chat-btn';
                deleteBtn.title = 'Delete Chat';
                deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    deleteSession(session.id);
                });

                item.appendChild(exportBtn);
                item.appendChild(deleteBtn);
            }

            item.addEventListener('click', () => switchSession(session.id));
            chatHistoryList.appendChild(item);
        });
    }

    // ── Sidebar Search ─────────────────────────────────────────────────────────
    if (sidebarSearch) {
        sidebarSearch.addEventListener('input', () => renderSidebar(sidebarSearch.value));
    }

    // ── Chat Export ────────────────────────────────────────────────────────────
    function exportSession(session) {
        let content = `FAY AI — ${session.title}\n${'='.repeat(40)}\n\n`;
        session.history.forEach(msg => {
            const role = msg.role === 'user' ? 'Sen' : 'FAY AI';
            content += `${role}:\n${msg.content}\n\n${'─'.repeat(30)}\n\n`;
        });
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fay-ai-${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('💾 Sohbet indirildi!', 'success');
    }

    // ── AI Title Generation ────────────────────────────────────────────────────
    async function generateAITitle(firstMessage, sessionId) {
        try {
            const res = await fetch('/api/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: firstMessage })
            });
            if (!res.ok) return;
            const { title } = await res.json();
            if (!title) return;

            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                session.title = title;
                // Update in DB
                if (supabaseClient && typeof sessionId === 'string' && !sessionId.startsWith('local-')) {
                    supabaseClient.from('sessions').update({ title }).eq('id', sessionId).then(() => {});
                }
                renderSidebar(sidebarSearch ? sidebarSearch.value : '');
            }
        } catch (e) {
            console.warn('Title generation failed:', e);
        }
    }

    // ── Delete Session ─────────────────────────────────────────────────────────
    function deleteSession(id) {
        if (typeof id === 'string' && !id.startsWith('local-')) {
            supabaseClient.from('sessions').delete().eq('id', id).then(({ error }) => {
                if (error) console.error("Error deleting session:", error);
            });
        }
        sessions = sessions.filter(s => s.id !== id);
        if (id === currentSessionId) {
            if (sessions.length > 0) {
                switchSession(sessions[0].id);
            } else {
                const newId = 'local-' + Date.now();
                const t = I18N[currentLang];
                sessions = [{ id: newId, title: t.newConvTitle, history: [], messagesHtml: '' }];
                currentSessionId = newId;
                savedSystemPrompt = DEFAULT_SYSTEM_PROMPT;
                localStorage.setItem(SYSTEM_PROMPT_KEY, savedSystemPrompt);
                if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;
                messagesWrapper.innerHTML = '';
                welcomeScreen.style.display = 'flex';
                messageInput.value = '';
                messageInput.style.height = 'auto';
                sendBtn.setAttribute('disabled', 'true');
            }
        }
        renderSidebar(sidebarSearch ? sidebarSearch.value : '');
    }

    // ── Theme ──────────────────────────────────────────────────────────────────
    const THEME_KEY = 'fyz_ai_theme';
    let isDarkMode = localStorage.getItem(THEME_KEY) === 'dark';

    function applyTheme() {
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (moonIcon) moonIcon.style.display = 'none';
            if (sunIcon) sunIcon.style.display = 'block';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (moonIcon) moonIcon.style.display = 'block';
            if (sunIcon) sunIcon.style.display = 'none';
        }
    }
    applyTheme();

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
            applyTheme();
        });
    }

    // ── Persona & Settings Modal ───────────────────────────────────────────────
    const personaCards = document.querySelectorAll('.persona-card');
    let tempSelectedPersona = savedPersona;
    let tempSelectedPrompt = savedSystemPrompt;

    if (settingsBtn) settingsBtn.addEventListener('click', () => {
        tempSelectedPersona = savedPersona;
        tempSelectedPrompt = savedSystemPrompt;
        personaCards.forEach(card => {
            if (card.dataset.personaId === tempSelectedPersona) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        settingsModal.style.display = 'flex';
    });

    personaCards.forEach(card => {
        card.addEventListener('click', () => {
            personaCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            tempSelectedPersona = card.dataset.personaId;
            tempSelectedPrompt = card.dataset.prompt;
        });
    });

    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });
    
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
        savedPersona = tempSelectedPersona;
        savedSystemPrompt = tempSelectedPrompt;
        localStorage.setItem(PERSONA_KEY, savedPersona);
        localStorage.setItem(SYSTEM_PROMPT_KEY, savedSystemPrompt);
        document.documentElement.setAttribute('data-persona', savedPersona);
        settingsModal.style.display = 'none';
        
        // Tiny glitch/flash animation on applying Hacker mode
        if (savedPersona === 'hacker') {
            document.body.style.animation = 'none';
            setTimeout(() => document.body.style.animation = 'glitch 0.3s ease', 10);
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });

    // ── Switch Session ─────────────────────────────────────────────────────────
    function switchSession(id) {
        if (currentSessionId === id || isWaitingForResponse) return;
        const currentSession = getCurrentSession();
        if (currentSession) currentSession.messagesHtml = messagesWrapper.innerHTML;
        currentSessionId = id;
        const newSession = getCurrentSession();
        messagesWrapper.innerHTML = newSession.messagesHtml || '';
        welcomeScreen.style.display = newSession.history.length === 0 ? 'flex' : 'none';
        sessions = sessions.filter(s => s.history.length > 0 || s.id === currentSessionId);
        renderSidebar(sidebarSearch ? sidebarSearch.value : '');
        scrollToBottom();
        // Auto-close sidebar on mobile after selecting a chat
        if (isMobile()) closeSidebar();
    }

    // ── I18N ───────────────────────────────────────────────────────────────────
    const I18N = {
        'TR': {
            newConvTitle: "Yeni Sohbet",
            welcomeTitle: "Size nasıl yardımcı olabilirim?",
            clearChats: "Tüm Sohbetleri Sil",
            placeholder: "Fay AI'a Mesaj Gönder...",
            warning: "Fay AI hatalar yapabilir. Önemli bilgileri doğrulmayı unutmayın.",
            settings: "Ayarlar",
            saveChanges: "Kaydet",
            roleTitle: "Özel Talimat (Sistem Prompt)",
            roleSub: "Asistanın her sohbette nasıl davranması gerektiğini tanımlayın.",
            rolePlaceholder: "Örn: Sen uzman bir yazılım geliştiricisin.",
            roleBtnText: "Modlar",
            confirmDel: "Tüm sohbet geçmişini silmek istediğinize emin misiniz?",
        },
        'EN': {
            newConvTitle: "New Conversation",
            welcomeTitle: "How can I help you today?",
            clearChats: "Clear All Chats",
            placeholder: "Message Fay AI...",
            warning: "Fay AI can make mistakes. Consider verifying important information.",
            settings: "Settings",
            saveChanges: "Save Changes",
            roleTitle: "Custom Instructions (System Prompt)",
            roleSub: "Define how the assistant should behave throughout this conversation.",
            rolePlaceholder: "Ex: You are an expert software engineer.",
            roleBtnText: "Modes",
            confirmDel: "Are you sure you want to delete all chat history?",
        }
    };

    function applyLanguage() {
        const t = I18N[currentLang];
        if (langToggleBtn) langToggleBtn.innerText = currentLang;
        if (clearChatsBtn) clearChatsBtn.querySelector('span').innerText = t.clearChats;
        if (messageInput) messageInput.placeholder = t.placeholder;
        const footerText = document.querySelector('.footer-text');
        if (footerText) footerText.innerText = t.warning;
        const welcomeH2 = document.querySelector('#welcome-screen h2');
        if (welcomeH2) welcomeH2.innerText = t.welcomeTitle;
        const roleAssignBtn = document.querySelector('.role-assign-btn span');
        if (roleAssignBtn) roleAssignBtn.innerText = t.roleBtnText;
        sessions.forEach(s => {
            if (s.title === I18N['TR'].newConvTitle || s.title === I18N['EN'].newConvTitle) {
                s.title = t.newConvTitle;
            }
        });
        renderSidebar(sidebarSearch ? sidebarSearch.value : '');
    }

    applyLanguage();

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            currentLang = currentLang === 'TR' ? 'EN' : 'TR';
            localStorage.setItem(LANG_KEY, currentLang);
            applyLanguage();
        });
    }

    // ── Clear All Chats ────────────────────────────────────────────────────────
    if (clearChatsBtn) {
        clearChatsBtn.addEventListener('click', () => {
            if (isWaitingForResponse) return;
            const t = I18N[currentLang];
            if (confirm(t.confirmDel)) {
                if (supabaseClient && currentUser) {
                    supabaseClient.from('sessions').delete().eq('user_id', currentUser.id).then(({ error }) => {
                        if (error) console.error("Error clearing DB history:", error);
                    });
                }
                savedSystemPrompt = DEFAULT_SYSTEM_PROMPT;
                localStorage.setItem(SYSTEM_PROMPT_KEY, savedSystemPrompt);
                if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;
                sessions = [{ id: 'local-' + Date.now(), title: t.newConvTitle, history: [], messagesHtml: '' }];
                currentSessionId = sessions[0].id;
                messagesWrapper.innerHTML = '';
                welcomeScreen.style.display = 'flex';
                messageInput.value = '';
                messageInput.style.height = 'auto';
                sendBtn.setAttribute('disabled', 'true');
                renderSidebar();
            }
        });
    }

    // ── Stop Button ────────────────────────────────────────────────────────────
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (currentAbortController) currentAbortController.abort();
        });
    }

    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // ── Sidebar Toggle (mobile drawer + desktop collapse) ──────────────────────
    function isMobile() { return window.innerWidth <= 768; }

    function openSidebar() {
        sidebar.classList.add('open');
        sidebar.classList.remove('collapsed');
        if (sidebarOverlay) sidebarOverlay.classList.add('visible');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebar.classList.add('collapsed');
        if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
    }

    function toggleSidebar() {
        if (isMobile()) {
            if (sidebar.classList.contains('open')) closeSidebar();
            else openSidebar();
        } else {
            sidebar.classList.toggle('collapsed');
        }
    }

    sidebarToggleBtn.addEventListener('click', toggleSidebar);

    // Close sidebar when overlay is tapped on mobile
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // ── Sidebar Toggle ─────────────────────────────────────────────────────────

    // ── New Chat ───────────────────────────────────────────────────────────────
    newChatBtn.addEventListener('click', () => {
        if (isWaitingForResponse) return;
        const currentSession = getCurrentSession();
        if (currentSession && currentSession.history.length === 0) return;
        if (currentSession) currentSession.messagesHtml = messagesWrapper.innerHTML;
        const newId = 'local-' + Date.now();
        const t = I18N[currentLang];
        sessions.unshift({ id: newId, title: t.newConvTitle, history: [], messagesHtml: '' });
        currentSessionId = newId;
        messagesWrapper.innerHTML = '';
        welcomeScreen.style.display = 'flex';
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        welcomeScreen.style.animation = 'none';
        setTimeout(() => welcomeScreen.style.animation = 'fadeIn 0.5s ease', 10);
        savedSystemPrompt = DEFAULT_SYSTEM_PROMPT;
        localStorage.setItem(SYSTEM_PROMPT_KEY, savedSystemPrompt);
        if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;
        renderSidebar();
    });

    // ── Quick Prompts Bar ──────────────────────────────────────────────────────
    if (quickPromptsBar) {
        quickPromptsBar.querySelectorAll('.quick-prompt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                messageInput.value = prompt;
                messageInput.focus();
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
                sendBtn.removeAttribute('disabled');
            });
        });
    }

    // ── File Upload ────────────────────────────────────────────────────────────
    if (fileUploadBtn && fileInput) {
        fileUploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            if (file.size > 500 * 1024) {
                showToast('⚠️ Dosya çok büyük (max 500KB)', 'error');
                fileInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                pendingFileContext = { name: file.name, content: e.target.result };
                fileUploadBtn.classList.add('file-loaded');
                fileUploadBtn.title = `📄 ${file.name} yüklendi`;
                showToast(`📄 "${file.name}" yüklendi`, 'success');
            };
            reader.readAsText(file);
            fileInput.value = '';
        });
    }

    // ── Voice Input (Web Speech API) ───────────────────────────────────────────
    let recognition = null;
    let isRecording = false;

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR();
        recognition.lang = 'tr-TR';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            messageInput.value = transcript;
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
            if (transcript.trim()) sendBtn.removeAttribute('disabled');
        };

        recognition.onend = () => {
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.title = 'Sesli Giriş';
        };

        recognition.onerror = (event) => {
            isRecording = false;
            micBtn.classList.remove('recording');
            if (event.error !== 'aborted') showToast('🎤 Mikrofon hatası: ' + event.error, 'error');
        };

        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.lang = currentLang === 'TR' ? 'tr-TR' : 'en-US';
                recognition.start();
                isRecording = true;
                micBtn.classList.add('recording');
                micBtn.title = 'Dinliyor... (Tıklayın durdurmak için)';
            }
        });
    } else {
        if (micBtn) {
            micBtn.style.display = 'none';
        }
    }

    // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            newChatBtn.click();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            toggleSidebar();
        }
        if (e.key === 'Escape') {
            if (isWaitingForResponse && currentAbortController) currentAbortController.abort();
            if (settingsModal.style.display !== 'none') settingsModal.style.display = 'none';
            if (profileModal.style.display !== 'none') profileModal.style.display = 'none';
        }
    });

    // ── Marked renderer ────────────────────────────────────────────────────────
    const renderer = new marked.Renderer();
    renderer.code = function (code, language) {
        let text = typeof code === 'object' ? code.text : code;
        let lang = typeof code === 'object' ? code.lang : language;
        let highlighted;
        const validLanguage = lang && hljs.getLanguage(lang) ? lang : '';
        const displayLang = validLanguage || 'text';
        try {
            highlighted = validLanguage
                ? hljs.highlight(text, { language: validLanguage }).value
                : hljs.highlightAuto(text).value;
        } catch (err) {
            highlighted = escapeHtml(text);
        }
        return `<div class="code-block-wrapper">
            <div class="code-block-header">
                <span class="code-lang">${displayLang}</span>
                <button class="copy-code-btn" onclick="copyCode(this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Copy</span>
                </button>
            </div>
            <pre><code class="hljs ${validLanguage}">${highlighted}</code></pre>
        </div>`;
    };

    function escapeHtml(unsafe) {
        return (unsafe || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    marked.setOptions({ renderer, breaks: true });

    window.copyCode = function (button) {
        const codeElement = button.closest('.code-block-wrapper').querySelector('code');
        navigator.clipboard.writeText(codeElement.innerText).then(() => {
            const span = button.querySelector('span');
            const icon = button.querySelector('svg');
            const orig = span.innerText;
            const origIcon = icon.innerHTML;
            span.innerText = 'Copied!';
            icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
            button.classList.add('copied');
            setTimeout(() => { span.innerText = orig; icon.innerHTML = origIcon; button.classList.remove('copied'); }, 2000);
        }).catch(err => console.error('Failed to copy:', err));
    };

    // ── Auto-resize textarea ───────────────────────────────────────────────────
    messageInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 200 ? this.scrollHeight : 200) + 'px';
        if (this.value.trim().length > 0 && !isWaitingForResponse) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    messageInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim().length > 0 && !isWaitingForResponse) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // ── addMessageToUI with action buttons ─────────────────────────────────────
    function addMessageToUI(sender, text, msgId = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-msg`;
        if (msgId) msgDiv.id = msgId;

        const avatarText = sender === 'user' ? 'U' : 'FAY';
        let contentHtml = '';
        if (sender === 'bot') {
            contentHtml = marked.parse(text);
        } else {
            const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
            contentHtml = `<p>${escaped}</p>`;
        }

        const actionButtons = sender === 'bot'
            ? `<div class="msg-actions">
                <button class="msg-action-btn copy-msg-btn" title="Kopyala" onclick="copyMessage(this)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Kopyala
                </button>
                <button class="msg-action-btn regen-msg-btn" title="Yeniden Üret" onclick="regenMessage(this)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Yenile
                </button>
               </div>`
            : '';

        msgDiv.innerHTML = `
            <div class="message-avatar">${avatarText}</div>
            <div class="message-body">
                <div class="message-content markdown-body">${contentHtml}</div>
                ${actionButtons}
            </div>
        `;

        messagesWrapper.appendChild(msgDiv);
        scrollToBottom();
    }

    // ── Copy Message ───────────────────────────────────────────────────────────
    window.copyMessage = function (button) {
        const content = button.closest('.message-body').querySelector('.message-content');
        navigator.clipboard.writeText(content.innerText).then(() => {
            const orig = button.innerHTML;
            button.innerHTML = '✓ Kopyalandı';
            button.style.color = '#10b981';
            setTimeout(() => { button.innerHTML = orig; button.style.color = ''; }, 2000);
        });
    };

    // ── Regenerate Message ─────────────────────────────────────────────────────
    window.regenMessage = function (button) {
        if (isWaitingForResponse) return;
        const session = getCurrentSession();
        if (!session || session.history.length < 2) return;

        // Remove the last bot message from history
        const lastMsg = session.history[session.history.length - 1];
        if (lastMsg.role !== 'assistant') return;
        session.history.pop();

        // Remove the bot message from UI
        const allBotMsgs = messagesWrapper.querySelectorAll('.bot-msg');
        if (allBotMsgs.length > 0) allBotMsgs[allBotMsgs.length - 1].remove();

        session.messagesHtml = messagesWrapper.innerHTML;

        // Re-submit the last user message
        const lastUserMsg = session.history[session.history.length - 1];
        if (lastUserMsg && lastUserMsg.role === 'user') {
            streamBotResponse(session, lastUserMsg.content);
        }
    };

    // ── Typing Indicator ───────────────────────────────────────────────────────
    function addTypingIndicator(id) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot-msg';
        msgDiv.id = id;
        msgDiv.innerHTML = `
            <div class="message-avatar">FAY</div>
            <div class="message-body">
                <div class="message-content">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>`;
        messagesWrapper.appendChild(msgDiv);
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // ── Stream Bot Response ────────────────────────────────────────────────────
    async function streamBotResponse(session, userText) {
        isWaitingForResponse = true;
        messageInput.setAttribute('disabled', 'true');
        sendBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        currentAbortController = new AbortController();

        const typingId = 'typing-' + Date.now();
        addTypingIndicator(typingId);
        scrollToBottom();

        try {
            const MAX_HISTORY = 20;
            let recentHistory = session.history;
            if (session.history.length > MAX_HISTORY) {
                recentHistory = session.history.slice(session.history.length - MAX_HISTORY);
            }
            const cleanHistory = recentHistory.map(h => ({ role: h.role, content: h.content }));
            const fullMessages = savedSystemPrompt
                ? [{ role: 'system', content: savedSystemPrompt }, ...cleanHistory]
                : [...cleanHistory];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: fullMessages }),
                signal: currentAbortController.signal
            });

            removeElement(typingId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData.error || `Sunucu hatası: ${response.status}`;
                if (response.status === 429) showToast('⚠️ ' + errMsg, 'error');
                else showToast('❌ ' + errMsg, 'error');
                return;
            }

            const msgId = 'msg-' + Date.now();
            addMessageToUI('bot', '', msgId);
            const msgContentEl = document.querySelector(`#${msgId} .message-content`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let botReply = "";
            let buffer = "";
            let streamFinished = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') { streamFinished = true; continue; }
                        let dataObj;
                        try { dataObj = JSON.parse(dataStr); } catch (e) { continue; }
                        if (dataObj.choices?.[0]?.delta?.content) {
                            botReply += dataObj.choices[0].delta.content;
                            try { msgContentEl.innerHTML = marked.parse(botReply); } catch { msgContentEl.innerText = botReply; }
                            scrollToBottom();
                        }
                    }
                }
            }

            if (!streamFinished) {
                botReply += "\n\n*(⚠️ Bağlantı koptu)*";
                try { msgContentEl.innerHTML = marked.parse(botReply); } catch { msgContentEl.innerText = botReply; }
            }

            session.history.push({ role: 'assistant', content: botReply });
            session.messagesHtml = messagesWrapper.innerHTML;

            supabaseClient.from('messages').insert({
                session_id: session.id,
                role: 'assistant',
                content: botReply
            }).then(({ error }) => { if (error) console.error("Failed to save bot message:", error); });

        } catch (error) {
            removeElement(typingId);
            if (error.name !== 'AbortError') {
                console.error(error);
                showToast('❌ Bir hata oluştu.', 'error');
            }
        } finally {
            isWaitingForResponse = false;
            sendBtn.style.display = 'flex';
            stopBtn.style.display = 'none';
            messageInput.removeAttribute('disabled');
            messageInput.focus();
        }
    }

    // ── Form Submit ────────────────────────────────────────────────────────────
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let messageText = messageInput.value.trim();
        if (!messageText || isWaitingForResponse || !currentUser || !supabaseClient) return;

        // Inject file context if pending
        if (pendingFileContext) {
            messageText = `[Dosya: ${pendingFileContext.name}]\n\`\`\`\n${pendingFileContext.content}\n\`\`\`\n\n${messageText}`;
            pendingFileContext = null;
            if (fileUploadBtn) {
                fileUploadBtn.classList.remove('file-loaded');
                fileUploadBtn.title = 'Dosya Yükle (.txt .md .csv)';
            }
        }

        if (welcomeScreen.style.display !== 'none') welcomeScreen.style.display = 'none';

        addMessageToUI('user', messageInput.value.trim());

        let session = getCurrentSession();
        const isFirstMessage = session.history.length === 0;

        // Persist new session to DB
        if (typeof session.id === 'string' && session.id.startsWith('local-')) {
            const title = messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText;
            session.title = title;
            const { data, error } = await supabaseClient.from('sessions').insert({
                user_id: currentUser.id,
                title: title
            }).select('id').single();
            if (error) { console.error("Failed creating DB session:", error); return; }
            session.id = data.id;
            currentSessionId = data.id;
            renderSidebar(sidebarSearch ? sidebarSearch.value : '');
        }

        session.history.push({ role: 'user', content: messageText });

        supabaseClient.from('messages').insert({
            session_id: session.id,
            role: 'user',
            content: messageText
        }).then(({ error }) => { if (error) console.error("Failed to save user message:", error); });

        session.messagesHtml = messagesWrapper.innerHTML;

        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');

        // Generate AI title after first user message
        if (isFirstMessage) {
            const displayText = messageInput.value || messageText;
            generateAITitle(messageText, session.id);
        }

        await streamBotResponse(session, messageText);
    });
});

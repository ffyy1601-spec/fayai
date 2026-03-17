document.addEventListener('DOMContentLoaded', () => {
    // Basic elements
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    const chatForm = document.getElementById('chat-form');
    const chatContainer = document.getElementById('chat-container');
    const messagesWrapper = document.getElementById('messages-wrapper');
    const welcomeScreen = document.getElementById('welcome-screen');
    const newChatBtn = document.getElementById('new-chat-btn');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const chatHistoryList = document.querySelector('.chat-history');
    const clearChatsBtn = document.getElementById('clear-chats-btn');
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    
    // Settings Modal
    const settingsBtn = document.getElementById('role-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const systemPromptInput = document.getElementById('system-prompt-input');

    // Landing Page Elements
    const landingPage = document.getElementById('landing-page');
    const landingLoginBtn = document.getElementById('landing-login-btn');
    const landingRegisterBtn = document.getElementById('landing-register-btn');
    const landingStartBtn = document.getElementById('landing-start-btn');
    const landingLearnBtn = document.getElementById('landing-learn-btn');

    // Profile Modal Elements
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

    // Full Screen Auth View Elements
    const authView = document.getElementById('auth-view');
    const appContainer = document.getElementById('app-container');

    // Login Box
    const loginBox = document.getElementById('login-box');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const showRegisterLink = document.getElementById('show-register-link');

    // Register Box
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

    // Auth State
    let currentUser = null;
    let supabaseClient = null;
    let avatarContent = '?'; // can be a letter or emoji
    let avatarColor = '#7c3aed';

    // Landing Page → Show Login
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

    // Initialize Supabase from config endpoint
    async function initSupabase() {
        try {
            console.log("Fetching config...");
            const res = await fetch('/api/config');
            if (!res.ok) {
                console.error("Config fetch failed:", res.status, res.statusText);
                return;
            }
            const config = await res.json();
            console.log("Config loaded:", config.SUPABASE_URL ? "URL Present" : "URL Missing");
            
            if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
                supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
                
                // Check if user is already logged in
                const { data: { session } } = await supabaseClient.auth.getSession();
                console.log("Current session:", session ? session.user.email : "None");
                
                if (session) {
                    handleLoginSuccess(session.user);
                } else {
                    // Show Landing Page if not logged in
                    landingPage.style.display = 'flex';
                    authView.style.display = 'none';
                    appContainer.style.display = 'none';
                }
            } else {
                console.error("Supabase config missing");
                landingPage.style.display = 'flex';
            }
        } catch (e) {
            console.error("Failed to load config:", e);
            landingPage.style.display = 'flex';
        }
    }
    
    async function handleLoginSuccess(user) {
        currentUser = user;
        landingPage.style.display = 'none';
        authView.style.display = 'none';
        appContainer.style.display = 'flex';
        
        // Load saved avatar preferences
        const savedAvatar = localStorage.getItem('fay_avatar_content');
        const savedColor = localStorage.getItem('fay_avatar_color');
        if (savedAvatar) avatarContent = savedAvatar;
        if (savedColor) avatarColor = savedColor;

        // Update sidebar profile UI
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

    // Toggle Login/Register Views
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

    // Handle Login Submit
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

    // Handle Register Submit
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
            email,
            password,
            options: {
                data: {
                    name,
                    surname,
                    phone
                }
            }
        });

        if (error) {
            registerErrorMsg.innerText = error.message;
            registerErrorMsg.style.display = 'block';
            registerSubmitBtn.disabled = false;
            registerSubmitBtn.innerText = 'Kayıt Ol';
        } else {
            // Check if email confirmation is required based on your Supabase settings
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                 registerErrorMsg.innerText = "Bu e-posta adresi zaten kullanımda.";
                 registerErrorMsg.style.display = 'block';
                 registerSubmitBtn.disabled = false;
                 registerSubmitBtn.innerText = 'Kayıt Ol';
                 return;
            }
            // Fallback for auto-login after signup
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
                     // reset styles
                     registerErrorMsg.style.color = "#ef4444";
                     registerErrorMsg.style.background = "rgba(239, 68, 68, 0.1)";
                     registerErrorMsg.style.display = 'none';
                 }, 2000);
            }
        }
    });

    // Logging out (now handled by profile modal)
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
        profileModal.style.display = 'flex';
    });

    closeProfileBtn.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });

    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) profileModal.style.display = 'none';
    });

    // Avatar color picker
    avatarColorPick.addEventListener('input', (e) => {
        avatarColor = e.target.value;
        profileAvatarPreview.style.background = avatarColor;
        if (userAvatar) userAvatar.style.background = avatarColor;
        localStorage.setItem('fay_avatar_color', avatarColor);
    });

    // Emoji picker toggle
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

    // Profile Save
    profileSaveBtn.addEventListener('click', async () => {
        if (!supabaseClient || !currentUser) return;
        profileSaveBtn.disabled = true;
        profileSaveBtn.innerText = 'Kaydediliyor...';

        const name = profileName.value.trim();
        const surname = profileSurname.value.trim();
        const phone = profilePhone.value.trim();

        const { error } = await supabaseClient.auth.updateUser({
            data: { name, surname, phone }
        });

        if (error) {
            profileSaveMsg.className = 'auth-error';
            profileSaveMsg.innerText = error.message;
        } else {
            // Update local currentUser
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

    // Profile Logout
    profileLogoutBtn.addEventListener('click', async () => {
        if (supabaseClient) await supabaseClient.auth.signOut();
        window.location.reload();
    });

    // State
    const SYSTEM_PROMPT_KEY = 'fay_ai_system_prompt';
    const DEFAULT_SYSTEM_PROMPT = '';
    
    let savedSystemPrompt = localStorage.getItem(SYSTEM_PROMPT_KEY) || DEFAULT_SYSTEM_PROMPT;
    if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;

    const LANG_KEY = 'fay_ai_lang';
    let currentLang = localStorage.getItem(LANG_KEY) || 'TR';

    let sessions = [];
    let currentSessionId = null;
    let isWaitingForResponse = false;
    let currentAbortController = null;

    // Supabase Sync Functions
    async function loadDBSessions() {
        if (!currentUser || !supabaseClient) return;

        const { data, error } = await supabaseClient
            .from('sessions')
            .select(`
                id,
                title,
                messages (
                    id, role, content, created_at
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading sessions:', error);
            return;
        }

        sessions = data.map(dbSession => {
            return {
                id: dbSession.id, 
                title: dbSession.title,
                history: dbSession.messages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)),
                messagesHtml: '' // We will render on the fly or construct it
            };
        });
        
        // Build raw HTML cache for each loaded session based on history
        sessions.forEach(s => {
            let html = '';
            s.history.forEach(msg => {
               const avatarText = msg.role === 'user' ? 'U' : 'FAY';
               let contentHtml = '';
               if (msg.role === 'assistant') {
                   contentHtml = marked.parse(msg.content);
               } else {
                   const escapedText = msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\n/g, "<br>");
                   contentHtml = `<p>${escapedText}</p>`;
               }
               html += `
                <div class="message ${msg.role === 'user' ? 'user-msg' : 'bot-msg'}">
                    <div class="message-avatar">${avatarText}</div>
                    <div class="message-content markdown-body">${contentHtml}</div>
                </div>`;
            });
            s.messagesHtml = html;
        });

        // Always ensure there is one blank session at the top
        const startId = 'local-' + Date.now();
        sessions.unshift({ id: startId, title: 'New Conversation', history: [], messagesHtml: '' });
        currentSessionId = startId;
        
        switchSession(currentSessionId);
    }

    function getCurrentSession() {
        return sessions.find(s => s.id === currentSessionId);
    }

    function renderSidebar() {
        chatHistoryList.innerHTML = '';
        // Only show sessions that have history OR are the current active new session
        const visibleSessions = sessions.filter(s => s.history.length > 0 || s.id === currentSessionId);
        
        visibleSessions.forEach(session => {
            const item = document.createElement('div');
            item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
            
            // Text span
            const titleSpan = document.createElement('span');
            titleSpan.className = 'history-title';
            titleSpan.textContent = session.title;
            
            // Individual Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chat-btn';
            deleteBtn.title = 'Delete Chat';
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteSession(session.id);
            });

            item.appendChild(titleSpan);
            
            // Only show delete button on saved chats, not the active empty one
            if (session.history.length > 0) {
                item.appendChild(deleteBtn);
            }

            item.addEventListener('click', () => switchSession(session.id));
            chatHistoryList.appendChild(item);
        });
    }

    function deleteSession(id) {
        // If it's a real DB session, delete it from Supabase
        if (typeof id === 'string' && !id.startsWith('local-')) {
            supabaseClient.from('sessions').delete().eq('id', id).then(({error}) => {
                if(error) console.error("Error deleting session:", error);
            });
        }

        sessions = sessions.filter(s => s.id !== id);
        
        // If we deleted the currently active session
        if (id === currentSessionId) {
            if (sessions.length > 0) {
                switchSession(sessions[0].id);
            } else {
                // If no sessions left, create a new empty one
                const newId = 'local-' + Date.now();
                const t = I18N[currentLang];
                sessions = [{ id: newId, title: t ? t.newConvTitle : 'New Conversation', history: [], messagesHtml: '' }];
                currentSessionId = newId;
                
                // Force role reset
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
        
        renderSidebar();
    }

    // Dark Mode Theme Logic
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

    // Settings Modal Logic
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;
            settingsModal.style.display = 'flex';
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            savedSystemPrompt = systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT;
            localStorage.setItem(SYSTEM_PROMPT_KEY, savedSystemPrompt);
            settingsModal.style.display = 'none';
        });
    }

    // Close modal if clicked outside content
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    function switchSession(id) {
        if (currentSessionId === id || isWaitingForResponse) return;
        
        // Save current HTML
        const currentSession = getCurrentSession();
        if (currentSession) {
            currentSession.messagesHtml = messagesWrapper.innerHTML;
        }

        currentSessionId = id;
        const newSession = getCurrentSession();
        
        // Restore HTML
        messagesWrapper.innerHTML = newSession.messagesHtml || '';
        
        if (newSession.history.length === 0) {
            welcomeScreen.style.display = 'flex';
        } else {
            welcomeScreen.style.display = 'none';
        }
        
        // Clean up empty non-active local sessions when switching away from them
        sessions = sessions.filter(s => s.history.length > 0 || s.id === currentSessionId);
        
        renderSidebar();
        scrollToBottom();
    }

    // Initial render logic will wait until auth resolves.
    
    // Localization
    const I18N = {
        'TR': {
            newConvTitle: "Yeni Sohbet",
            welcomeTitle: "Size nasıl yardımcı olabilirim?",
            clearChats: "Tüm Sohbetleri Sil",
            placeholder: "FAY AI'a Mesaj Gönder...",
            warning: "FAY AI hatalar yapabilir. Önemli bilgileri doğrulmayı unutmayın.",
            settings: "Ayarlar",
            saveChanges: "Kaydet",
            roleTitle: "Rol Ata (Bot Karakteri)",
            roleSub: "Botun her mesajınızda nasıl davranması gerektiğini belirleyin.",
            rolePlaceholder: "Örn: Sen çok profesyonel bir yazılımcısın. Görevin...",
            roleBtnText: "Rol Ata",
            confirmDel: "Tüm sohbet geçmişini silmek istediğinize emin misiniz?",
        },
        'EN': {
            newConvTitle: "New Conversation",
            welcomeTitle: "How can I help you today?",
            clearChats: "Clear All Chats",
            placeholder: "Message FAY AI...",
            warning: "FAY AI can make mistakes. Consider verifying important information.",
            settings: "Settings",
            saveChanges: "Save Changes",
            roleTitle: "Assign Role (Bot Personality)",
            roleSub: "Define how the bot should respond to each of your messages.",
            rolePlaceholder: "Ex: You are a professional software engineer...",
            roleBtnText: "Assign Role",
            confirmDel: "Are you sure you want to delete all chat history?",
        }
    };

    function applyLanguage() {
        const t = I18N[currentLang];
        if (langToggleBtn) langToggleBtn.innerText = currentLang === 'TR' ? 'TR' : 'EN';
        if (clearChatsBtn) clearChatsBtn.querySelector('span').innerText = t.clearChats;
        if (messageInput) messageInput.placeholder = t.placeholder;
        
        const footerText = document.querySelector('.footer-text');
        if (footerText) footerText.innerText = t.warning;

        const welcomeH2 = document.querySelector('#welcome-screen h2');
        if (welcomeH2) welcomeH2.innerText = t.welcomeTitle;

        const roleAssignBtn = document.querySelector('.role-assign-btn span');
        if (roleAssignBtn) roleAssignBtn.innerText = t.roleBtnText;

        const modalTitle = document.querySelector('.modal-header h2');
        if (modalTitle) modalTitle.innerText = t.settings;

        const roleLabel = document.querySelector('label[for="system-prompt-input"]');
        if (roleLabel) roleLabel.innerText = t.roleTitle;

        const roleSub = document.querySelector('.help-text');
        if (roleSub) roleSub.innerText = t.roleSub;

        if (systemPromptInput) systemPromptInput.placeholder = t.rolePlaceholder;

        if (saveSettingsBtn) saveSettingsBtn.innerText = t.saveChanges;
        
        // Update un-modified new conversation titles in sidebar if they exactly match
        sessions.forEach(s => {
            if (s.title === I18N['TR'].newConvTitle || s.title === I18N['EN'].newConvTitle) {
                s.title = t.newConvTitle;
            }
        });
        renderSidebar();
    }

    applyLanguage();

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            currentLang = currentLang === 'TR' ? 'EN' : 'TR';
            localStorage.setItem(LANG_KEY, currentLang);
            applyLanguage();
        });
    }

    // Clear All Chats Button
    if (clearChatsBtn) {
        clearChatsBtn.addEventListener('click', () => {
            if (isWaitingForResponse) return;
            const t = I18N[currentLang];
            if (confirm(t.confirmDel)) {
                // Delete all DB sessions
                if (supabaseClient && currentUser) {
                     supabaseClient.from('sessions').delete().eq('user_id', currentUser.id).then(({error})=> {
                         if(error) console.error("Error clearing DB history:", error);
                     });
                }
                
                // Force role reset
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

    // Stop Button
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (currentAbortController) {
                currentAbortController.abort();
            }
        });
    }

    // Sidebar Toggle
    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Initialize Marked renderer for custom code blocks
    const renderer = new marked.Renderer();
    // In newer marked versions, code can be passed as an object parameter
    renderer.code = function(code, language) {
        let text = typeof code === 'object' ? code.text : code;
        let lang = typeof code === 'object' ? code.lang : language;
        
        let highlighted;
        const validLanguage = lang && hljs.getLanguage(lang) ? lang : '';
        const displayLang = validLanguage || 'text';
        
        try {
            if (validLanguage) {
                highlighted = hljs.highlight(text, { language: validLanguage }).value;
            } else {
                highlighted = hljs.highlightAuto(text).value;
            }
        } catch (err) {
            console.error('Highlight.js error:', err);
            highlighted = typeof code === 'object' ? code.text : escapeHtml(code); // Fallback
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

    marked.setOptions({
        renderer: renderer,
        breaks: true,
    });

    // Make copyCode function globally available
    window.copyCode = function(button) {
        const wrapper = button.closest('.code-block-wrapper');
        const codeElement = wrapper.querySelector('code');
        // Get the plain text representation
        const textToCopy = codeElement.innerText;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const span = button.querySelector('span');
            const icon = button.querySelector('svg');
            const originalText = span.innerText;
            const originalIcon = icon.innerHTML;
            
            span.innerText = 'Copied!';
            icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>'; // Checkmark
            button.classList.add('copied');
            
            setTimeout(() => {
                span.innerText = originalText;
                icon.innerHTML = originalIcon;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 200 ? this.scrollHeight : 200) + 'px';
        
        // Toggle send button state
        if (this.value.trim().length > 0 && !isWaitingForResponse) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // Enter to submit (Shift+Enter for newline)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim().length > 0 && !isWaitingForResponse) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });



    // New Chat button
    newChatBtn.addEventListener('click', () => {
        if (isWaitingForResponse) return;

        const currentSession = getCurrentSession();
        
        // Avoid creating multiple empty chats
        if (currentSession && currentSession.history.length === 0) return;

        if (currentSession) {
            currentSession.messagesHtml = messagesWrapper.innerHTML;
        }

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
        // Force role reset
        savedSystemPrompt = DEFAULT_SYSTEM_PROMPT;
        localStorage.setItem(SYSTEM_PROMPT_KEY, savedSystemPrompt);
        if (systemPromptInput) systemPromptInput.value = savedSystemPrompt;

        renderSidebar();
    });

    // Handle form submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const messageText = messageInput.value.trim();
        if (!messageText || isWaitingForResponse || !currentUser || !supabaseClient) return;

        // Hide welcome screen on first message
        if (welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
        }

        // Add user message to UI
        addMessageToUI('user', messageText);
        
        let session = getCurrentSession();
        
        // If this is a new local session, persist it to DB first
        if (typeof session.id === 'string' && session.id.startsWith('local-')) {
             const title = messageText.length > 25 ? messageText.substring(0, 25) + '...' : messageText;
             session.title = title;
             
             const { data, error } = await supabaseClient.from('sessions').insert({
                 user_id: currentUser.id,
                 title: title
             }).select('id').single();
             
             if(error) {
                 console.error("Failed creating DB session:", error);
                 return;
             }
             // Update local state with real DB id
             session.id = data.id;
             currentSessionId = data.id;
             renderSidebar();
        }

        // Update history
        session.history.push({ role: 'user', content: messageText });
        
        // Insert User message to DB
        supabaseClient.from('messages').insert({
            session_id: session.id,
            role: 'user',
            content: messageText
        }).then(({error})=> {
            if(error) console.error("Failed to save user message to DB:", error);
        });
        
        session.messagesHtml = messagesWrapper.innerHTML;

        // Reset input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');
        
        // Block new input while waiting
        isWaitingForResponse = true;
        messageInput.setAttribute('disabled', 'true');


        
        // Add bot typing indicator
        const typingId = 'typing-' + Date.now();
        addTypingIndicator(typingId);
        scrollToBottom();

        // UI for stopping
        sendBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        currentAbortController = new AbortController();

        try {
            // Context Window Management: Keep only the last N messages to avoid token limit
            const MAX_HISTORY = 20; 
            let recentHistory = session.history;
            if (session.history.length > MAX_HISTORY) {
                recentHistory = session.history.slice(session.history.length - MAX_HISTORY);
            }

            // Merge Role/System prompt inside the payload itself based on config
            const cleanHistory = recentHistory.map(h => ({ role: h.role, content: h.content }));
            
            // Append savedSystemPrompt to the last user message to make it go as a single message
            if (savedSystemPrompt && cleanHistory.length > 0) {
                const lastMsg = cleanHistory[cleanHistory.length - 1];
                if (lastMsg.role === 'user') {
                    // Prepend the given prompt text behind the scenes
                    lastMsg.content = `[GÖREV/ROL: ${savedSystemPrompt}]\n\nKullanıcı Mesajı:\n${lastMsg.content}`;
                }
            }

            // Only add default system message if the user didn't specify one or if it's the standard API req
            const fullMessages = [
                ...cleanHistory
            ];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: fullMessages }),
                signal: currentAbortController.signal
            });

            // Remove typing indicator
            removeElement(typingId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMsg = errorData.error || `Server error: ${response.status}`;
                return;
            }


            // Create a message placeholder with an ID
            const msgId = 'msg-' + Date.now();
            addMessageToUI('bot', '', msgId);
            const msgContentElement = document.querySelector(`#${msgId} .message-content`);

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
                buffer = lines.pop(); // Keep the last partial line in buffer
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') {
                            streamFinished = true;
                            continue;
                        }
                        let dataObj;
                        try {
                            dataObj = JSON.parse(dataStr);
                        } catch (e) {
                            continue; // Wait for the rest of the chunk
                        }

                        if (dataObj.choices && dataObj.choices[0].delta && dataObj.choices[0].delta.content) {
                            botReply += dataObj.choices[0].delta.content;
                            try {
                                msgContentElement.innerHTML = marked.parse(botReply);
                            } catch (markErr) {
                                console.error('Marked parse error:', markErr);
                                msgContentElement.innerText = botReply; // Fallback
                            }
                            scrollToBottom();
                        }
                    }
                }
            }
            
            // If stream dropped abruptly without [DONE]
            if (!streamFinished) {
                botReply += "\n\n*(⚠️ Bağlantı koptu, yanıt tamamlanmamış olabilir / Connection dropped)*";
                try {
                    msgContentElement.innerHTML = marked.parse(botReply);
                } catch (e) {
                    msgContentElement.innerText = botReply;
                }
                scrollToBottom();
            }

            // Finally update history
            session.history.push({ role: 'assistant', content: botReply });
            session.messagesHtml = messagesWrapper.innerHTML;
            
            // Insert Bot message to DB
            supabaseClient.from('messages').insert({
                session_id: session.id,
                role: 'assistant',
                content: botReply
            }).then(({error})=> {
                if(error) console.error("Failed to save bot message to DB:", error);
            });

        } catch (error) {
            removeElement(typingId);
            if (error.name === 'AbortError') {
                // Ignore abort errors or show a small message
                const session = getCurrentSession();
                const partialReply = document.querySelector(`#msg-${Date.now()} .message-content`)?.innerText || '';
                if (partialReply) {
                    session.history.push({ role: 'assistant', content: partialReply });
                    session.messagesHtml = messagesWrapper.innerHTML;
                    
                    supabaseClient.from('messages').insert({
                        session_id: session.id,
                        role: 'assistant',
                        content: partialReply
                    });
                }
            }
            console.error(error);
        } finally {
            isWaitingForResponse = false;
            sendBtn.style.display = 'flex';
            stopBtn.style.display = 'none';
            messageInput.removeAttribute('disabled');
            messageInput.focus();
        }
    });

    function addMessageToUI(sender, text, msgId = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-msg`;
        if (msgId) msgDiv.id = msgId;
        
        let avatarText = sender === 'user' ? 'U' : 'FAY';
        
        let contentHtml = '';
        if (sender === 'bot') {
            // Use marked to parse markdown for bot responses
            contentHtml = marked.parse(text);
        } else {
            // Simple escaping for user text
            const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
            contentHtml = `<p>${escapedText}</p>`;
        }

        msgDiv.innerHTML = `
            <div class="message-avatar">${avatarText}</div>
            <div class="message-content markdown-body">
                ${contentHtml}
            </div>
        `;

        messagesWrapper.appendChild(msgDiv);
        scrollToBottom();
    }

    function addTypingIndicator(id) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message bot-msg`;
        msgDiv.id = id;
        
        msgDiv.innerHTML = `
            <div class="message-avatar">FAY</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        messagesWrapper.appendChild(msgDiv);
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});

import { Injectable, effect, signal } from '@angular/core';

export type Lang = 'en' | 'ta' | 'de' | 'ja' | 'hi';

export interface LanguageOption {
  code: Lang;
  label: string; // English name
  native: string; // Endonym
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
];

const STORAGE_KEY = 'chat_lang';

type Dict = Record<string, string>;

/**
 * Lightweight runtime i18n. Unlike Angular's build-time @angular/localize, this
 * lets users switch languages instantly without a separate build per locale —
 * ideal for an in-app language picker. State is a signal, persisted to
 * localStorage, and consumed via the `t` pipe.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly lang = signal<Lang>(this.initial());

  constructor() {
    effect(() => {
      const lang = this.lang();
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  translate(key: string): string {
    const lang = this.lang();
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  private initial(): Lang {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      return stored;
    }
    const browser = navigator.language.slice(0, 2) as Lang;
    return LANGUAGES.some((l) => l.code === browser) ? browser : 'en';
  }
}

const en: Dict = {
  'app.name': 'Enterprise Chat',
  'nav.dashboard': 'Dashboard',
  'nav.chats': 'Chats',
  'nav.assistant': 'AI Assistant',
  'nav.settings': 'Settings',
  'status.connected': 'Connected',
  'status.offline': 'Offline',
  'action.logout': 'Logout',
  'theme.light': 'Light mode',
  'theme.dark': 'Dark mode',
  'lang.title': 'Language',

  'auth.welcomeBack': 'Welcome back',
  'auth.signInToContinue': 'Sign in to continue',
  'auth.emailOrUsername': 'Email or username',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.noAccount': 'No account?',
  'auth.createOne': 'Create one',
  'auth.createAccount': 'Create your account',
  'auth.signUp': 'Create account',
  'auth.fullName': 'Full name',
  'auth.username': 'Username',
  'auth.email': 'Email',
  'auth.alreadyRegistered': 'Already registered?',

  'dash.hello': 'Hello',
  'dash.subtitle': "Here's what's happening across your workspace today.",
  'dash.newChat': 'New chat',
  'dash.conversations': 'Conversations',
  'dash.onlineNow': 'Online now',
  'dash.groups': 'Groups',
  'dash.assistantReady': 'Assistant ready',
  'dash.recentChats': 'Recent chats',
  'dash.viewAll': 'View all',
  'dash.noConversations': 'No conversations yet. Start one from the Chats tab.',
  'dash.group': 'Group',
  'dash.directMessage': 'Direct message',

  'chat.messages': 'Messages',
  'chat.findPeople': 'Find people',
  'chat.searchUsername': 'Search username',
  'chat.noChats': 'No chats yet — search for someone above.',
  'chat.groupChat': 'Group chat',
  'chat.aiAssistant': 'AI assistant',
  'chat.typing': 'typing…',
  'chat.alwaysAvailable': 'AI assistant · always available',
  'chat.online': 'Online',
  'chat.offline': 'Offline',
  'chat.typeMessage': 'Type a message…',
  'chat.yourConversations': 'Your conversations',
  'chat.emptyHint':
    'Select a chat on the left, or search for someone — including the AI assistant — to start talking.',
  'chat.edited': 'edited',

  'settings.appearance': 'Appearance',
  'settings.darkMode': 'Dark mode',
  'settings.profile': 'Profile',
  'settings.bio': 'Bio',
  'settings.saveProfile': 'Save profile',
  'settings.saved': 'Saved',
  'settings.changePassword': 'Change password',
  'settings.currentPassword': 'Current password',
  'settings.newPassword': 'New password',
  'settings.updatePassword': 'Update password',
  'settings.language': 'Language',
  'settings.languageDesc': 'Choose your preferred language',

  'ai.summarize': 'Summarize',
  'ai.summary': 'AI summary',
  'ai.smartReplies': 'Smart replies',
  'ai.thinking': 'Thinking…',
  'ai.suggest': 'Suggest replies',
};

const ta: Dict = {
  'app.name': 'Enterprise Chat',
  'nav.dashboard': 'டாஷ்போர்டு',
  'nav.chats': 'அரட்டைகள்',
  'nav.assistant': 'AI உதவியாளர்',
  'nav.settings': 'அமைப்புகள்',
  'status.connected': 'இணைக்கப்பட்டது',
  'status.offline': 'ஆஃப்லைன்',
  'action.logout': 'வெளியேறு',
  'theme.light': 'ஒளி பயன்முறை',
  'theme.dark': 'இருண்ட பயன்முறை',
  'lang.title': 'மொழி',

  'auth.welcomeBack': 'மீண்டும் வரவேற்கிறோம்',
  'auth.signInToContinue': 'தொடர உள்நுழையவும்',
  'auth.emailOrUsername': 'மின்னஞ்சல் அல்லது பயனர்பெயர்',
  'auth.password': 'கடவுச்சொல்',
  'auth.signIn': 'உள்நுழை',
  'auth.noAccount': 'கணக்கு இல்லையா?',
  'auth.createOne': 'ஒன்றை உருவாக்கு',
  'auth.createAccount': 'உங்கள் கணக்கை உருவாக்கவும்',
  'auth.signUp': 'கணக்கை உருவாக்கு',
  'auth.fullName': 'முழுப் பெயர்',
  'auth.username': 'பயனர்பெயர்',
  'auth.email': 'மின்னஞ்சல்',
  'auth.alreadyRegistered': 'ஏற்கனவே பதிவு செய்துள்ளீர்களா?',

  'dash.hello': 'வணக்கம்',
  'dash.subtitle': 'உங்கள் பணியிடத்தில் இன்று நடப்பவை இங்கே.',
  'dash.newChat': 'புதிய அரட்டை',
  'dash.conversations': 'உரையாடல்கள்',
  'dash.onlineNow': 'இப்போது ஆன்லைனில்',
  'dash.groups': 'குழுக்கள்',
  'dash.assistantReady': 'உதவியாளர் தயார்',
  'dash.recentChats': 'சமீபத்திய அரட்டைகள்',
  'dash.viewAll': 'அனைத்தையும் காண்க',
  'dash.noConversations': 'இன்னும் உரையாடல்கள் இல்லை. அரட்டைகள் தாவலில் தொடங்கவும்.',
  'dash.group': 'குழு',
  'dash.directMessage': 'நேரடி செய்தி',

  'chat.messages': 'செய்திகள்',
  'chat.findPeople': 'நபர்களைத் தேடு',
  'chat.searchUsername': 'பயனர்பெயரைத் தேடு',
  'chat.noChats': 'இன்னும் அரட்டைகள் இல்லை — மேலே யாரையாவது தேடுங்கள்.',
  'chat.groupChat': 'குழு அரட்டை',
  'chat.aiAssistant': 'AI உதவியாளர்',
  'chat.typing': 'தட்டச்சு செய்கிறார்…',
  'chat.alwaysAvailable': 'AI உதவியாளர் · எப்போதும் கிடைக்கும்',
  'chat.online': 'ஆன்லைனில்',
  'chat.offline': 'ஆஃப்லைன்',
  'chat.typeMessage': 'ஒரு செய்தியைத் தட்டச்சு செய்யவும்…',
  'chat.yourConversations': 'உங்கள் உரையாடல்கள்',
  'chat.emptyHint':
    'இடதுபுறம் ஒரு அரட்டையைத் தேர்ந்தெடுக்கவும், அல்லது AI உதவியாளர் உட்பட யாரையாவது தேடி பேசத் தொடங்குங்கள்.',
  'chat.edited': 'திருத்தப்பட்டது',

  'settings.appearance': 'தோற்றம்',
  'settings.darkMode': 'இருண்ட பயன்முறை',
  'settings.profile': 'சுயவிவரம்',
  'settings.bio': 'சுயவிவரக் குறிப்பு',
  'settings.saveProfile': 'சுயவிவரத்தைச் சேமி',
  'settings.saved': 'சேமிக்கப்பட்டது',
  'settings.changePassword': 'கடவுச்சொல்லை மாற்று',
  'settings.currentPassword': 'தற்போதைய கடவுச்சொல்',
  'settings.newPassword': 'புதிய கடவுச்சொல்',
  'settings.updatePassword': 'கடவுச்சொல்லைப் புதுப்பி',
  'settings.language': 'மொழி',
  'settings.languageDesc': 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',

  'ai.summarize': 'சுருக்கம்',
  'ai.summary': 'AI சுருக்கம்',
  'ai.smartReplies': 'சார்புப் பதில்கள்',
  'ai.thinking': 'சிந்திக்கிறது…',
  'ai.suggest': 'பதில்கள் பரிந்துரை',
};

const de: Dict = {
  'app.name': 'Enterprise Chat',
  'nav.dashboard': 'Übersicht',
  'nav.chats': 'Chats',
  'nav.assistant': 'KI-Assistent',
  'nav.settings': 'Einstellungen',
  'status.connected': 'Verbunden',
  'status.offline': 'Offline',
  'action.logout': 'Abmelden',
  'theme.light': 'Heller Modus',
  'theme.dark': 'Dunkler Modus',
  'lang.title': 'Sprache',

  'auth.welcomeBack': 'Willkommen zurück',
  'auth.signInToContinue': 'Zum Fortfahren anmelden',
  'auth.emailOrUsername': 'E-Mail oder Benutzername',
  'auth.password': 'Passwort',
  'auth.signIn': 'Anmelden',
  'auth.noAccount': 'Kein Konto?',
  'auth.createOne': 'Erstellen',
  'auth.createAccount': 'Konto erstellen',
  'auth.signUp': 'Konto erstellen',
  'auth.fullName': 'Vollständiger Name',
  'auth.username': 'Benutzername',
  'auth.email': 'E-Mail',
  'auth.alreadyRegistered': 'Bereits registriert?',

  'dash.hello': 'Hallo',
  'dash.subtitle': 'Das passiert heute in Ihrem Arbeitsbereich.',
  'dash.newChat': 'Neuer Chat',
  'dash.conversations': 'Unterhaltungen',
  'dash.onlineNow': 'Jetzt online',
  'dash.groups': 'Gruppen',
  'dash.assistantReady': 'Assistent bereit',
  'dash.recentChats': 'Letzte Chats',
  'dash.viewAll': 'Alle anzeigen',
  'dash.noConversations': 'Noch keine Unterhaltungen. Starten Sie eine über den Chats-Tab.',
  'dash.group': 'Gruppe',
  'dash.directMessage': 'Direktnachricht',

  'chat.messages': 'Nachrichten',
  'chat.findPeople': 'Personen finden',
  'chat.searchUsername': 'Benutzername suchen',
  'chat.noChats': 'Noch keine Chats – suchen Sie oben nach jemandem.',
  'chat.groupChat': 'Gruppenchat',
  'chat.aiAssistant': 'KI-Assistent',
  'chat.typing': 'schreibt …',
  'chat.alwaysAvailable': 'KI-Assistent · immer verfügbar',
  'chat.online': 'Online',
  'chat.offline': 'Offline',
  'chat.typeMessage': 'Nachricht eingeben …',
  'chat.yourConversations': 'Ihre Unterhaltungen',
  'chat.emptyHint':
    'Wählen Sie links einen Chat oder suchen Sie jemanden – auch den KI-Assistenten – um zu starten.',
  'chat.edited': 'bearbeitet',

  'settings.appearance': 'Darstellung',
  'settings.darkMode': 'Dunkler Modus',
  'settings.profile': 'Profil',
  'settings.bio': 'Bio',
  'settings.saveProfile': 'Profil speichern',
  'settings.saved': 'Gespeichert',
  'settings.changePassword': 'Passwort ändern',
  'settings.currentPassword': 'Aktuelles Passwort',
  'settings.newPassword': 'Neues Passwort',
  'settings.updatePassword': 'Passwort aktualisieren',
  'settings.language': 'Sprache',
  'settings.languageDesc': 'Wählen Sie Ihre bevorzugte Sprache',

  'ai.summarize': 'Zusammenfassen',
  'ai.summary': 'KI-Zusammenfassung',
  'ai.smartReplies': 'Schnellantworten',
  'ai.thinking': 'Denkt nach …',
  'ai.suggest': 'Antworten vorschlagen',
};

const ja: Dict = {
  'app.name': 'Enterprise Chat',
  'nav.dashboard': 'ダッシュボード',
  'nav.chats': 'チャット',
  'nav.assistant': 'AIアシスタント',
  'nav.settings': '設定',
  'status.connected': '接続済み',
  'status.offline': 'オフライン',
  'action.logout': 'ログアウト',
  'theme.light': 'ライトモード',
  'theme.dark': 'ダークモード',
  'lang.title': '言語',

  'auth.welcomeBack': 'おかえりなさい',
  'auth.signInToContinue': '続行するにはサインイン',
  'auth.emailOrUsername': 'メールまたはユーザー名',
  'auth.password': 'パスワード',
  'auth.signIn': 'サインイン',
  'auth.noAccount': 'アカウントがありませんか？',
  'auth.createOne': '作成する',
  'auth.createAccount': 'アカウントを作成',
  'auth.signUp': 'アカウント作成',
  'auth.fullName': 'フルネーム',
  'auth.username': 'ユーザー名',
  'auth.email': 'メール',
  'auth.alreadyRegistered': 'すでに登録済みですか？',

  'dash.hello': 'こんにちは',
  'dash.subtitle': '今日のワークスペースの状況です。',
  'dash.newChat': '新しいチャット',
  'dash.conversations': '会話',
  'dash.onlineNow': '現在オンライン',
  'dash.groups': 'グループ',
  'dash.assistantReady': 'アシスタント準備完了',
  'dash.recentChats': '最近のチャット',
  'dash.viewAll': 'すべて表示',
  'dash.noConversations': 'まだ会話がありません。チャットタブから始めましょう。',
  'dash.group': 'グループ',
  'dash.directMessage': 'ダイレクトメッセージ',

  'chat.messages': 'メッセージ',
  'chat.findPeople': '人を探す',
  'chat.searchUsername': 'ユーザー名を検索',
  'chat.noChats': 'まだチャットがありません — 上で誰かを検索してください。',
  'chat.groupChat': 'グループチャット',
  'chat.aiAssistant': 'AIアシスタント',
  'chat.typing': '入力中…',
  'chat.alwaysAvailable': 'AIアシスタント・常に利用可能',
  'chat.online': 'オンライン',
  'chat.offline': 'オフライン',
  'chat.typeMessage': 'メッセージを入力…',
  'chat.yourConversations': 'あなたの会話',
  'chat.emptyHint':
    '左でチャットを選択するか、AIアシスタントを含む誰かを検索して会話を始めましょう。',
  'chat.edited': '編集済み',

  'settings.appearance': '外観',
  'settings.darkMode': 'ダークモード',
  'settings.profile': 'プロフィール',
  'settings.bio': '自己紹介',
  'settings.saveProfile': 'プロフィールを保存',
  'settings.saved': '保存しました',
  'settings.changePassword': 'パスワードを変更',
  'settings.currentPassword': '現在のパスワード',
  'settings.newPassword': '新しいパスワード',
  'settings.updatePassword': 'パスワードを更新',
  'settings.language': '言語',
  'settings.languageDesc': '希望の言語を選択',

  'ai.summarize': '要約',
  'ai.summary': 'AI要約',
  'ai.smartReplies': 'スマート返信',
  'ai.thinking': '考えています…',
  'ai.suggest': '返信を提案',
};

const hi: Dict = {
  'app.name': 'Enterprise Chat',
  'nav.dashboard': 'डैशबोर्ड',
  'nav.chats': 'चैट',
  'nav.assistant': 'AI सहायक',
  'nav.settings': 'सेटिंग्स',
  'status.connected': 'कनेक्टेड',
  'status.offline': 'ऑफ़लाइन',
  'action.logout': 'लॉग आउट',
  'theme.light': 'लाइट मोड',
  'theme.dark': 'डार्क मोड',
  'lang.title': 'भाषा',

  'auth.welcomeBack': 'वापसी पर स्वागत है',
  'auth.signInToContinue': 'जारी रखने के लिए साइन इन करें',
  'auth.emailOrUsername': 'ईमेल या उपयोगकर्ता नाम',
  'auth.password': 'पासवर्ड',
  'auth.signIn': 'साइन इन',
  'auth.noAccount': 'खाता नहीं है?',
  'auth.createOne': 'बनाएं',
  'auth.createAccount': 'अपना खाता बनाएं',
  'auth.signUp': 'खाता बनाएं',
  'auth.fullName': 'पूरा नाम',
  'auth.username': 'उपयोगकर्ता नाम',
  'auth.email': 'ईमेल',
  'auth.alreadyRegistered': 'पहले से पंजीकृत?',

  'dash.hello': 'नमस्ते',
  'dash.subtitle': 'आज आपके कार्यक्षेत्र में क्या हो रहा है।',
  'dash.newChat': 'नई चैट',
  'dash.conversations': 'बातचीत',
  'dash.onlineNow': 'अभी ऑनलाइन',
  'dash.groups': 'समूह',
  'dash.assistantReady': 'सहायक तैयार',
  'dash.recentChats': 'हाल की चैट',
  'dash.viewAll': 'सभी देखें',
  'dash.noConversations': 'अभी तक कोई बातचीत नहीं। चैट टैब से शुरू करें।',
  'dash.group': 'समूह',
  'dash.directMessage': 'सीधा संदेश',

  'chat.messages': 'संदेश',
  'chat.findPeople': 'लोगों को खोजें',
  'chat.searchUsername': 'उपयोगकर्ता नाम खोजें',
  'chat.noChats': 'अभी तक कोई चैट नहीं — ऊपर किसी को खोजें।',
  'chat.groupChat': 'समूह चैट',
  'chat.aiAssistant': 'AI सहायक',
  'chat.typing': 'टाइप कर रहा है…',
  'chat.alwaysAvailable': 'AI सहायक · हमेशा उपलब्ध',
  'chat.online': 'ऑनलाइन',
  'chat.offline': 'ऑफ़लाइन',
  'chat.typeMessage': 'संदेश लिखें…',
  'chat.yourConversations': 'आपकी बातचीत',
  'chat.emptyHint':
    'बाईं ओर चैट चुनें, या बातचीत शुरू करने के लिए किसी को खोजें — AI सहायक सहित।',
  'chat.edited': 'संपादित',

  'settings.appearance': 'दिखावट',
  'settings.darkMode': 'डार्क मोड',
  'settings.profile': 'प्रोफ़ाइल',
  'settings.bio': 'बायो',
  'settings.saveProfile': 'प्रोफ़ाइल सहेजें',
  'settings.saved': 'सहेजा गया',
  'settings.changePassword': 'पासवर्ड बदलें',
  'settings.currentPassword': 'वर्तमान पासवर्ड',
  'settings.newPassword': 'नया पासवर्ड',
  'settings.updatePassword': 'पासवर्ड अपडेट करें',
  'settings.language': 'भाषा',
  'settings.languageDesc': 'अपनी पसंदीदा भाषा चुनें',

  'ai.summarize': 'सारांश',
  'ai.summary': 'AI सारांश',
  'ai.smartReplies': 'स्मार्ट उत्तर',
  'ai.thinking': 'सोच रहा है…',
  'ai.suggest': 'उत्तर सुझाएं',
};

const TRANSLATIONS: Record<Lang, Dict> = { en, ta, de, ja, hi };

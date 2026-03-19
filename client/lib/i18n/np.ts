export const np = {
  nav: {
    home: "होम",
    collection: "कलेक्सन",
    about: "बारेमा",
    contact: "सम्पर्क",

    // extra nav keys (from first block)
    admin: "एडमिन",
    search: "खोज",
    notifications: "सूचना",
    profile: "प्रोफाइल",
    signup: "साइनअप",
    wishlist: "विशलिस्ट",
    openMenu: "मेनु खोल्नुहोस्",

    // dropdown/profile menu
    orderTracking: "अर्डर ट्र्याकिङ",
    orderHistory: "अर्डर इतिहास",
    address: "ठेगाना",
    liveChat: "लाइभ च्याट",
    myTickets: "मेरो सपोर्ट टिकटहरू",
    raiseTicket: "सपोर्ट टिकट बनाउनुहोस्",
    language: "भाषा",
    deleteAccount: "खाता हटाउनुहोस्",
    logout: "लगआउट",
  },

  profile: {
    loading: "प्रोफाइल लोड हुँदैछ…",
    back: "पछाडि",
    title: "मेरो प्रोफाइल",
    personalInfo: "व्यक्तिगत जानकारी",
    name: "नाम",
    email: "इमेल",
    fitPreferences: "फिट प्राथमिकता",
    height: "उचाइ (फुट)",
    weight: "तौल (केजी)",
    sizeRec: "साइज सिफारिस",
    menSize: "पुरुष साइज",
    womenSize: "महिला साइज",
    save: "सेभ गर्नुहोस्",
    saving: "सेभ हुँदैछ...",
    logout: "लगआउट",
    loggingOut: "लगआउट हुँदैछ...",

    ticketsTitle: "मेरो सपोर्ट टिकटहरू",
    ticketsDesc: "एडमिन रिप्लाइ र च्याट हेर्नुहोस्",
    raiseTitle: "टिकट बनाउनुहोस्",
    raiseDesc: "नयाँ समस्या पठाउनुहोस्",

    dangerZone: "खतरा क्षेत्र",
    dangerDesc:
      "खाता हटाएपछि तपाईंको प्रोफाइल पहुँच हट्छ। यो फर्काउन सकिँदैन।",

    deleteBtn: "खाता हटाउनुहोस्",
    deleteModalTitle: "खाता हटाउने?",
    deleteModalHint:
      'यसले तपाईंको खाता स्थायी रूपमा निष्क्रिय बनाउँछ। पुष्टि गर्न "DELETE" टाइप गर्नुहोस्।',

    close: "बन्द",
    cancel: "रद्द",
    confirmDelete: "हटाउने पुष्टि",
    typeDelete: '"DELETE" टाइप गर्नुहोस्',
    mustTypeDelete: '"DELETE" टाइप गरेर पुष्टि गर्नुहोस्।',

    updatedOk: "प्रोफाइल सफलतापूर्वक अपडेट भयो!",
    updateFail: "अपडेट असफल भयो",
    tryAgain: "केही समस्या भयो। फेरि प्रयास गर्नुहोस्।",
    deletedOk: "तपाईंको खाता हटाइएको छ।",
    deleteFail: "खाता हटाउन असफल भयो",
  },
} as const;
import { AppLanguage, PurposeId, SectionId } from '../types/documents';

export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];

interface UiDictionary {
  nav: Record<SectionId, string>;
  mastheadCta: string;
  hero: {
    datelineA: string;
    datelineB: string;
    datelineC: string;
    headlineBefore: string;
    headlineRed: string;
    headlineAfter: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    noticeTitle: string;
    noticeBadge: string;
    noticeBody: string;
  };
  problem: {
    kicker: string;
    headingBefore: string;
    headingRed: string;
    headingAfter: string;
    intro: string;
  };
  howItWorks: {
    kicker: string;
    headingBefore: string;
    headingRed: string;
    headingAfter: string;
    privacyTitle: string;
    privacyBody: string;
  };
  workspace: {
    kicker: string;
    headingBefore: string;
    headingRed: string;
    disclaimer: string;
    purposeLabel: string;
    purposeHint: string;
    sampleLabel: string;
    sampleHint: string;
    clearFields: string;
    confirmFieldCheck: string;
    confirmedLabel: string;
    addDocBtn: string;
    compareBtn: string;
  };
  report: {
    kicker: string;
    headingBefore: string;
    headingRed: string;
    headingAfter: string;
    slipTitle: string;
    recommendedFirst: string;
    fieldBreakdown: string;
    editDocs: string;
    printReport: string;
  };
  soFar: {
    kicker: string;
    checksRun: string;
    mismatchesFound: string;
    publicCode: string;
  };
  footer: {
    note: string;
    scriptNote: string;
  };
  purposes: Record<PurposeId, { title: string; shortHint: string }>;
}

export const UI_COPY: Record<AppLanguage, UiDictionary> = {
  en: {
    nav: {
      hero: 'Overview',
      problem: 'Why It Matters',
      'how-it-works': 'How It Works',
      workspace: 'Documents',
      report: 'Report',
    },
    mastheadCta: 'Check Documents',
    hero: {
      datelineA: 'Citizen Document Helper',
      datelineB: 'Aadhaar, PAN, Marksheet & Passbook',
      datelineC: '2–6 Document Check',
      headlineBefore: 'Spot document ',
      headlineRed: 'mismatches',
      headlineAfter: ' before a counter clerk does.',
      subtitle:
        'In India, a single citizen’s name, date of birth, or parent’s name is often printed differently across Aadhaar, PAN, Class 10 marksheets, passports, bank passbooks, and portal screenshots. Namma Check compares 2–6 records side by side and highlights what to review first.',
      primaryCta: 'Check my documents',
      secondaryCta: 'View sample report',
      noticeTitle: 'Scope & Privacy Notice',
      noticeBadge: 'Photo never leaves your device',
      noticeBody:
        'This does not verify your identity, does not contact any government system, and is not legal advice. Photos are read on-device; long numbers (such as Aadhaar numbers) are removed before confirmed text is processed on AWS in Sydney, Australia without storage.',
    },
    problem: {
      kicker: '01. What it costs',
      headingBefore: 'You find out when it is ',
      headingRed: 'too late',
      headingAfter: '.',
      intro:
        'Small mismatches across Aadhaar, PAN, passbooks, and marksheets often stay unnoticed until a live verification stalls or gets rejected.',
    },
    howItWorks: {
      kicker: '02. How the check works',
      headingBefore: 'Three calm steps from ',
      headingRed: 'loose paperwork',
      headingAfter: ' to a clear fix plan.',
      privacyTitle: 'The privacy promise',
      privacyBody:
        'Your photo never leaves your phone. Only the text read from it, and the details you type or confirm, are sent. They are processed on AWS in Sydney, Australia, and not stored. Long numbers such as your Aadhaar number are removed before anything is sent.',
    },
    workspace: {
      kicker: '03. Try it',
      headingBefore: 'What are you applying for & review ',
      headingRed: 'document records',
      disclaimer:
        'This does not verify your identity, does not contact any government system and is not legal advice.',
      purposeLabel: '1. What are you applying for?',
      purposeHint: 'Tailors comparison & fix order',
      sampleLabel: 'Or try a sample set',
      sampleHint: 'Fictional people. These are pre-filled examples marked SAMPLE; nothing is sent for reading.',
      clearFields: 'Clear fields',
      confirmFieldCheck: 'Confirm fields before comparing',
      confirmedLabel: 'Confirmed',
      addDocBtn: 'Add another document',
      compareBtn: 'Check my documents',
    },
    report: {
      kicker: '04. Your consistency report',
      headingBefore: 'Fix plan & ',
      headingRed: 'priority review',
      headingAfter: ' order.',
      slipTitle: 'Namma Check · Personal Advisory Slip',
      recommendedFirst: 'Recommended First Review',
      fieldBreakdown: 'Field-by-Field Breakdown',
      editDocs: 'Edit documents',
      printReport: 'Download report (PDF)',
    },
    soFar: {
      kicker: '05 // So far',
      checksRun: 'checks run',
      mismatchesFound: 'found a mismatch',
      publicCode: 'Read the code. It is all public.',
    },
    footer: {
      note: 'Browser-side OCR & zero-storage text comparison · Not affiliated with government agencies',
      scriptNote: 'Script versions are transliterations pending native-speaker review.',
    },
    purposes: {
      general: {
        title: 'General check',
        shortHint: 'Compare any 2–6 of your documents.',
      },
      pan_aadhaar: {
        title: 'PAN–Aadhaar linking',
        shortHint: 'Check the fields that must match to link PAN and Aadhaar.',
      },
      epf_claim: {
        title: 'PF (EPF) claim',
        shortHint: 'Check the fields that often cause EPF claim rejections.',
      },
    },
  },
  hi: {
    nav: {
      hero: 'परिचय',
      problem: 'यह क्यों ज़रूरी है',
      'how-it-works': 'यह कैसे काम करता है',
      workspace: 'दस्तावेज़',
      report: 'रिपोर्ट',
    },
    mastheadCta: 'दस्तावेज़ जाँचें',
    hero: {
      datelineA: 'नागरिक दस्तावेज़ सहायक',
      datelineB: 'आधार, पैन, मार्कशीट और पासबुक',
      datelineC: '2–6 दस्तावेज़ जाँच',
      headlineBefore: 'काउंटर क्लर्क से पहले अपने दस्तावेज़ों की ',
      headlineRed: 'असमानताएँ',
      headlineAfter: ' पकड़ें।',
      subtitle:
        'भारत में एक ही व्यक्ति का नाम, जन्मतिथि या माता-पिता का नाम आधार, पैन, दसवीं की मार्कशीट, पासपोर्ट, बैंक पासबुक और पोर्टल स्क्रीनशॉट पर अलग-अलग छपा हो सकता है। नम्मा चेक 2–6 दस्तावेज़ों की तुलना करके बताता है कि पहले क्या सुधारना है।',
      primaryCta: 'मेरे दस्तावेज़ जाँचें',
      secondaryCta: 'नमूना रिपोर्ट देखें',
      noticeTitle: 'दायरा और गोपनीयता सूचना',
      noticeBadge: 'फ़ोटो आपके फ़ोन से बाहर नहीं जाती',
      noticeBody:
        'यह आपकी पहचान सत्यापित नहीं करता, किसी सरकारी सिस्टम से नहीं जुड़ता और कानूनी सलाह नहीं है। फ़ोटो आपके डिवाइस पर पढ़ी जाती है; आधार जैसी लंबी संख्याएँ हटाकर केवल पुष्ट किया गया टेक्स्ट सिडनी (AWS) में बिना सहेजे प्रोसेस होता है।',
    },
    problem: {
      kicker: '01. इसका नुकसान',
      headingBefore: 'जब पता चलता है तब तक ',
      headingRed: 'देर हो चुकी',
      headingAfter: ' होती है।',
      intro:
        'आधार, पैन, पासबुक और मार्कशीट में छोटे अंतर तब तक नज़रअंदाज़ रहते हैं जब तक कोई आवेदन या दावा अटक न जाए।',
    },
    howItWorks: {
      kicker: '02. जाँच कैसे काम करती है',
      headingBefore: 'बिखरे कागज़ों से स्पष्ट सुधार योजना तक ',
      headingRed: 'तीन आसान चरण',
      headingAfter: '।',
      privacyTitle: 'गोपनीयता का वादा',
      privacyBody:
        'आपकी फ़ोटो कभी आपके फ़ोन से बाहर नहीं जाती। केवल उससे पढ़ा गया टेक्स्ट और आपके द्वारा टाइप या पुष्ट विवरण ही भेजे जाते हैं। इन्हें सिडनी, ऑस्ट्रेलिया में AWS पर प्रोसेस किया जाता है और सहेजा नहीं जाता। आधार नंबर जैसी लंबी संख्याएँ भेजने से पहले हटा दी जाती हैं।',
    },
    workspace: {
      kicker: '03. आज़माएँ',
      headingBefore: 'आप किस लिए आवेदन कर रहे हैं और ',
      headingRed: 'दस्तावेज़ रिकॉर्ड',
      disclaimer:
        'यह आपकी पहचान सत्यापित नहीं करता, किसी सरकारी सिस्टम से संपर्क नहीं करता और कानूनी सलाह नहीं है।',
      purposeLabel: '1. आप किसके लिए आवेदन कर रहे हैं?',
      purposeHint: 'लक्ष्य के अनुसार जाँच नियम',
      sampleLabel: 'या कोई नमूना सेट आज़माएँ',
      sampleHint: 'काल्पनिक उदाहरण (SAMPLE के रूप में चिह्नित); पढ़ने के लिए कुछ भी बाहर नहीं भेजा जाता।',
      clearFields: 'फ़ील्ड साफ़ करें',
      confirmFieldCheck: 'तुलना से पहले सभी फ़ील्ड पुष्ट करें',
      confirmedLabel: 'पुष्ट',
      addDocBtn: 'एक और दस्तावेज़ जोड़ें',
      compareBtn: 'मेरे दस्तावेज़ जाँचें',
    },
    report: {
      kicker: '04. आपकी मिलान रिपोर्ट',
      headingBefore: 'सुधार योजना और ',
      headingRed: 'प्राथमिक जाँच',
      headingAfter: ' क्रम।',
      slipTitle: 'नम्मा चेक · व्यक्तिगत सलाह पर्ची',
      recommendedFirst: 'सबसे पहले जाँचें',
      fieldBreakdown: 'फ़ील्ड-वार तुलना',
      editDocs: 'दस्तावेज़ संपादित करें',
      printReport: 'प्रिंट / सहेजें',
    },
    soFar: {
      kicker: '05 // अब तक',
      checksRun: 'जाँच पूरी हुईं',
      mismatchesFound: 'में अंतर मिला',
      publicCode: 'कोड पढ़ें। सब कुछ सार्वजनिक है।',
    },
    footer: {
      note: 'डिवाइस पर OCR और बिना स्टोरेज टेक्स्ट तुलना · किसी सरकारी संस्था से संबद्ध नहीं',
      scriptNote: 'लिपि रूपांतरण मूल भाषियों की समीक्षा के अधीन हैं।',
    },
    purposes: {
      general: {
        title: 'सामान्य जाँच',
        shortHint: 'अपने किसी भी 2–6 दस्तावेज़ों की तुलना करें।',
      },
      pan_aadhaar: {
        title: 'पैन–आधार लिंकिंग',
        shortHint: 'पैन और आधार लिंक करने के लिए आवश्यक फ़ील्ड जाँचें।',
      },
      epf_claim: {
        title: 'PF (EPF) दावा',
        shortHint: 'EPF दावे अस्वीकार होने वाले मुख्य फ़ील्ड जाँचें।',
      },
    },
  },
  mr: {
    nav: {
      hero: 'माहिती',
      problem: 'का महत्त्वाचे आहे',
      'how-it-works': 'कसे कार्य करते',
      workspace: 'कागदपत्रे',
      report: 'अहवाल',
    },
    mastheadCta: 'कागदपत्रे तपासा',
    hero: {
      datelineA: 'नागरिक कागदपत्र सहाय्यक',
      datelineB: 'आधार, पॅन, गुणपत्रक आणि पासबुक',
      datelineC: '2–6 कागदपत्रांची तपासणी',
      headlineBefore: 'काउंटर लिपिकाआधीच कागदपत्रांतील ',
      headlineRed: 'विसंगती',
      headlineAfter: ' शोधा.',
      subtitle:
        'भारतात एकाच नागरिकाचे नाव, जन्मतारीख किंवा पालकांचे नाव आधार, पॅन, दहावीचे गुणपत्रक, पासपोर्ट, बँक पासबुक आणि पोर्टल स्क्रीनशॉटवर वेगवेगळे असू शकते. नम्मा चेक 2–6 नोंदींची तुलना करून आधी काय तपासावे हे दाखवते.',
      primaryCta: 'माझी कागदपत्रे तपासा',
      secondaryCta: 'नमुना अहवाल पहा',
      noticeTitle: 'मर्यादा व गोपनीयता सूचना',
      noticeBadge: 'फोटो फोनबाहेर जात नाही',
      noticeBody:
        'हे तुमची ओळख पडताळत नाही, कोणत्याही सरकारी प्रणालीशी संपर्क साधत नाही आणि कायदेशीर सल्ला नाही. फोटो तुमच्या डिव्हाइसवर वाचला जातो; आधार क्रमांकासारखे मोठे आकडे काढून फक्त पुष्ट केलेला मजकूर सिडनी (AWS) येथे साठवणुकीशिवाय तपासला जातो.',
    },
    problem: {
      kicker: '01. याची किंमत',
      headingBefore: 'उशीर झाल्यावरच चूक ',
      headingRed: 'लक्षात येते',
      headingAfter: '.',
      intro:
        'आधार, पॅन, पासबुक आणि गुणपत्रकातील लहान फरक थेट अर्ज किंवा दावा नाकारला जाईपर्यंत लक्षात येत नाहीत.',
    },
    howItWorks: {
      kicker: '02. तपासणी कशी चालते',
      headingBefore: 'विखुरलेल्या कागदपत्रांपासून स्पष्ट ',
      headingRed: 'सुधारणा आराखड्याकडे',
      headingAfter: ' तीन पावले.',
      privacyTitle: 'गोपनीयतेचे वचन',
      privacyBody:
        'तुमचा फोटो कधीही तुमच्या फोनबाहेर जात नाही. फक्त त्यातून वाचलेला मजकूर आणि तुम्ही टाइप किंवा पुष्ट केलेला तपशील पाठवला जातो. तो सिडनी, ऑस्ट्रेलिया येथील AWS वर प्रक्रिया केला जातो आणि साठवला जात नाही. आधार क्रमांकासारखे मोठे अंक आधीच काढले जातात.',
    },
    workspace: {
      kicker: '03. वापरून पहा',
      headingBefore: 'तुम्ही कशासाठी अर्ज करत आहात व ',
      headingRed: 'कागदपत्र नोंदी',
      disclaimer:
        'हे तुमची ओळख पडताळत नाही, कोणत्याही सरकारी यंत्रणेशी संपर्क साधत नाही आणि कायदेशीर सल्ला नाही.',
      purposeLabel: '1. तुम्ही कशासाठी अर्ज करत आहात?',
      purposeHint: 'उद्देशानुसार तपासणी प्राधान्य',
      sampleLabel: 'किंवा नमुना संच वापरा',
      sampleHint: 'काल्पनिक उदाहरणे (SAMPLE चिन्हांकित); वाचण्यासाठी काहीही बाहेर पाठवले जात नाही.',
      clearFields: 'रिकामे करा',
      confirmFieldCheck: 'तुलनेपूर्वी सर्व तपशील तपासा व पुष्ट करा',
      confirmedLabel: 'पुष्ट',
      addDocBtn: 'आणखी कागदपत्र जोडा',
      compareBtn: 'माझी कागदपत्रे तपासा',
    },
    report: {
      kicker: '04. सुसंगती अहवाल',
      headingBefore: 'सुधारणा आराखडा व ',
      headingRed: 'प्राधान्य तपासणी',
      headingAfter: ' क्रम.',
      slipTitle: 'नम्मा चेक · वैयक्तिक सल्ला चिठ्ठी',
      recommendedFirst: 'प्रथम तपासण्याची शिफारस',
      fieldBreakdown: 'रकाना-निहाय तुलना',
      editDocs: 'कागदपत्रे बदला',
      printReport: 'प्रिंट / जतन करा',
    },
    soFar: {
      kicker: '05 // आतापर्यंत',
      checksRun: 'तपासण्या पूर्ण',
      mismatchesFound: 'मध्ये विसंगती आढळली',
      publicCode: 'कोड पहा. सर्व काही खुले आहे.',
    },
    footer: {
      note: 'डिव्हाइसवरील OCR व साठवणुकीशिवाय मजकूर तुलना · कोणत्याही सरकारी संस्थेशी संलग्न नाही',
      scriptNote: 'लिपी रूपांतरे मूळ भाषिकांच्या पुनरावलोकनाधीन आहेत.',
    },
    purposes: {
      general: {
        title: 'सामान्य तपासणी',
        shortHint: 'तुमच्या कोणत्याही 2–6 कागदपत्रांची तुलना करा.',
      },
      pan_aadhaar: {
        title: 'पॅन–आधार जोडणी',
        shortHint: 'पॅन आणि आधार जोडण्यासाठी जुळणे आवश्यक असलेले रकाने तपासा.',
      },
      epf_claim: {
        title: 'PF (EPF) दावा',
        shortHint: 'EPF दावा नाकारण्यास कारणीभूत ठरणारे रकाने तपासा.',
      },
    },
  },
};

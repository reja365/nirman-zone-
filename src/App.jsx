import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// ==========================================
// ১. FIREBASE CONFIGURATION (আপনার প্রজেক্টের আসল তথ্য বসান)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB02LNJfuOva_WN3QMF9EZbSx01W0fx8z8",
  authDomain: "nirman-zone.firebaseapp.com",
  projectId: "nirman-zone",
  storageBucket: "nirman-zone.firebasestorage.app",
  messagingSenderId: "964321389020",
  appId: "1:964321389020:web:b0c286a4cb41bda16bc719",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// ২. মৌলিক ধ্রুবক ও তালিকা (PIN কোডে রাখা হয়নি)
// ==========================================
const DEFAULT_ADMIN_PHONE = "01920098430";
const SPECIAL_FREE_PROVIDER_PHONE = "01944121530";
const SPECIAL_FREE_PROVIDER_PROFESSION = "গ্রিল মিস্ত্রি";

const DEFAULT_SETTINGS = {
  bkashNumber: "01944121530",
  nagadNumber: "01944121530",
  subscriptionFee: 50,
  subscriptionDays: 90,
  adminPhone: DEFAULT_ADMIN_PHONE,
  adminEmailOrContact: "01920098430",
};

const SERVICE_PROVIDER_PROFESSIONS = [
  "রাজমিস্ত্রি",
  "গ্রিল মিস্ত্রি",
  "ওয়েল্ডার",
  "ইলেকট্রিশিয়ান",
  "প্লাম্বার",
  "রংমিস্ত্রি",
  "টাইলস মিস্ত্রি",
  "কাঠমিস্ত্রি",
  "স্যানিটারি মিস্ত্রি",
  "শ্রমিক",
  "ঠিকাদার",
  "সাব-কন্ট্রাক্টর",
  "ইঞ্জিনিয়ার",
  "আর্কিটেক্ট",
  "ইন্টেরিয়র ডিজাইনার",
  "থাই গ্লাস মিস্ত্রি",
  "অ্যালুমিনিয়াম মিস্ত্রি",
  "অন্যান্য নির্মাণসংশ্লিষ্ট পেশা",
  "ফর্মা বিক্রেতা",
  "স্টিল ফর্মা ভাড়া সরবরাহকারী",
  "ডেকোরেশন ও গেট ডেকোরেটর",
  "পাইলিং (গাব গাছের পাইলিংসহ)",
];

const JOB_CATEGORIES = [
  "নতুন বাড়ি নির্মাণ",
  "পুরোনো বাড়ি মেরামত",
  "বাড়ি সংস্কার",
  "গ্রিল তৈরি ও মেরামত",
  "গেট তৈরি",
  "সিঁড়ি তৈরি",
  "রং করার কাজ",
  "টাইলস লাগানো",
  "বৈদ্যুতিক কাজ",
  "পানির লাইন ও প্লাম্বিং",
  "অন্যান্য নির্মাণকাজ",
];

const MATERIAL_CATEGORIES = [
  "রড",
  "সিমেন্ট",
  "বালু",
  "ইট",
  "পাথর",
  "টাইলস",
  "থাই গ্লাস",
  "অ্যালুমিনিয়াম",
  "GI পাইপ",
  "GI বক্স",
  "স্যানিটারি সামগ্রী",
  "বৈদ্যুতিক সামগ্রী",
  "অন্যান্য নির্মাণসামগ্রী",
];
const WARD_OPTIONS = Array.from(
  { length: 54 },
  (_, index) => `ওয়ার্ড নং - ${index + 1}`
);

// বাংলাদেশের বিভাগ -> জেলা -> উপজেলা/থানা (প্রয়োজন অনুযায়ী আরও বাড়ানো যাবে)
const BANGLADESH_LOCATIONS = {
  ঢাকা: {
    ঢাকা: ["সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার", "মিরপুর", "উত্তরা", "যাত্রাবাড়ী"],
    গাজীপুর: ["গাজীপুর সদর", "কালিয়াকৈর", "কাপাসিয়া", "শ্রীপুর", "কালীগঞ্জ"],
    নারায়ণগঞ্জ: ["নারায়ণগঞ্জ সদর", "বন্দর", "রূপগঞ্জ", "সোনারগাঁও", "আড়াইহাজার"],
    মানিকগঞ্জ: ["মানিকগঞ্জ সদর", "সিংগাইর", "শিবালয়", "ঘিওর", "দৌলতপুর"],
    মুন্সীগঞ্জ: ["মুন্সীগঞ্জ সদর", "শ্রীনগর", "লৌহজং", "সিরাজদিখান", "টঙ্গীবাড়ী"],
    নরসিংদী: ["নরসিংদী সদর", "পলাশ", "বেলাবো", "মনোহরদী", "শিবপুর", "রায়পুরা"],
  },
  চট্টগ্রাম: {
    চট্টগ্রাম: ["সীতাকুণ্ড", "মিরসরাই", "হাটহাজারী", "রাউজান", "রাঙ্গুনিয়া", "পটিয়া", "লোহাগাড়া", "সাতকানিয়া"],
    কক্সবাজার: ["কক্সবাজার সদর", "রামু", "উখিয়া", "টেকনাফ", "চকরিয়া", "পেকুয়া"],
    কুমিল্লা: ["কুমিল্লা সদর", "লাকসাম", "চৌদ্দগ্রাম", "দাউদকান্দি", "বরুড়া", "মুরাদনগর"],
    ফেনী: ["ফেনী সদর", "ছাগলনাইয়া", "দাগনভূঞা", "সোনাগাজী", "পরশুরাম"],
  },
  খুলনা: {
    খুলনা: ["খুলনা সদর", "রূপসা", "তেরখাদা", "দিঘলিয়া", "ফুলতলা", "ডুমুরিয়া", "বটিয়াঘাটা", "পাইকগাছা"],
    যশোর: ["যশোর সদর", "ঝিকরগাছা", "শার্শা", "মনিরামপুর", "অভয়নগর", "বাঘারপাড়া", "চৌগাছা"],
    সাতক্ষীরা: ["সাতক্ষীরা সদর", "কালীগঞ্জ", "শ্যামনগর", "আশাশুনি", "তালা", "কলারোয়া"],
    কুষ্টিয়া: ["কুষ্টিয়া সদর", "ভেড়ামারা", "মিরপুর", "দৌলতপুর", "খোকসা", "কুমারখালী"],
  },
  রাজশাহী: {
    রাজশাহী: ["পবা", "গোদাগাড়ী", "তানোর", "মোহনপুর", "বাগমারা", "দুর্গাপুর", "পুঠিয়া", "চারঘাট"],
    বগুড়া: ["বগুড়া সদর", "শাজাহানপুর", "শেরপুর", "কাহালু", "নন্দীগ্রাম", "দুপচাঁচিয়া"],
    পাবনা: ["পাবনা সদর", "ঈশ্বরদী", "সাঁথিয়া", "সুজানগর", "বেড়া", "চাটমোহর", "ফরিদপুর"],
  },
  রংপুর: {
    রংপুর: ["রংপুর সদর", "মিঠাপুকুর", "পীরগাছা", "কাউনিয়া", "বদরগঞ্জ", "তারাগঞ্জ", "গঙ্গাচড়া"],
    দিনাজপুর: ["দিনাজপুর সদর", "বিরল", "বোচাগঞ্জ", "কাহারোল", "খানসামা", "পার্বতীপুর", "ফুলবাড়ী"],
  },
  সিলেট: {
    সিলেট: ["সিলেট সদর", "দক্ষিণ সুরমা", "ফেঞ্চুগঞ্জ", "গোলাপগঞ্জ", "বিয়ানীবাজার", "জৈন্তাপুর", "কানাইঘাট"],
    মৌলভীবাজার: ["মৌলভীবাজার সদর", "শ্রীমঙ্গল", "কমলগঞ্জ", "কুলাউড়া", "বড়লেখা", "রাজনগর"],
    হবিগঞ্জ: ["হবিগঞ্জ সদর", "মাধবপুর", "চুনারুঘাট", "নবীগঞ্জ", "বাহুবল", "লাখাই"],
    সুনামগঞ্জ: ["সুনামগঞ্জ সদর", "ছাতক", "দোয়ারাবাজার", "জগন্নাথপুর", "বিশ্বম্ভরপুর"],
  },
  বরিশাল: {
    বরিশাল: ["বরিশাল সদর", "বাকেরগঞ্জ", "বাবুগঞ্জ", "উজিরপুর", "বানারীপাড়া", "গৌরনদী", "হিজলা"],
    ভোলা: ["ভোলা সদর", "দৌলতখান", "বোরহানউদ্দিন", "তজুমদ্দিন", "লালমোহন", "চরফ্যাশন"],
    পটুয়াখালী: ["পটুয়াখালী সদর", "বাউফল", "দশমিনা", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ"],
  },
  ময়মনসিংহ: {
    ময়মনসিংহ: ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ফুলবাড়িয়া", "ত্রিশাল", "ভালুকা", "গফরগাঁও", "হালুয়াঘাট", "ধোবাউড়া"],
    জামালপুর: ["জামালপুর সদর", "সরিষাবাড়ী", "মেলান্দহ", "ইসলামপুর", "দেওয়ানগঞ্জ", "মাদারগঞ্জ"],
    নেত্রকোণা: ["নেত্রকোণা সদর", "কেন্দুয়া", "পূর্বধলা", "দুর্গাপুর", "কলমাকান্দা", "আটপাড়া"],
  },
};

// ==========================================
// ৩. সহায়ক ফাংশন (হেল্পার)
// ==========================================
const cleanPhone = (phone = "") => phone.replace(/\D/g, "").slice(0, 11);

const isValidBDPhone = (phone = "") => /^01[3-9]\d{8}$/.test(cleanPhone(phone));

const isSpecialFreeProvider = (phone, profession) =>
  cleanPhone(phone) === SPECIAL_FREE_PROVIDER_PHONE &&
  profession === SPECIAL_FREE_PROVIDER_PROFESSION;

const getMembershipStatus = (profile, settings = DEFAULT_SETTINGS) => {
  if (!profile) {
    return { isActive: false, daysLeft: 0, statusText: "অ্যাকাউন্ট নেই", isExpiringSoon: false, isExpiredToday: false };
  }
  if (profile.isBlocked) {
    return { isActive: false, daysLeft: 0, statusText: "ব্লক করা হয়েছে", isExpiringSoon: false, isExpiredToday: false };
  }
  if (profile.accountType === "owner") {
    return { isActive: true, daysLeft: 9999, statusText: "স্থায়ী ফ্রি অ্যাকাউন্ট", isExpiringSoon: false, isExpiredToday: false };
  }
  if (isSpecialFreeProvider(profile.phone, profile.profession)) {
    return { isActive: true, daysLeft: 9999, statusText: "বিশেষ স্থায়ী ফ্রি সদস্যপদ", isExpiringSoon: false, isExpiredToday: false };
  }
  if (!profile.subscriptionExpiry) {
    return { isActive: false, daysLeft: 0, statusText: "মেয়াদ সক্রিয় নয়", isExpiringSoon: false, isExpiredToday: false };
  }

  const now = new Date();
  const expiry = new Date(profile.subscriptionExpiry);
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
  const expiryMs = expiry.getTime();

  const isExpiredToday = expiryMs >= startOfToday && expiryMs <= endOfToday;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

  if (expiryMs > now.getTime()) {
    return {
      isActive: true,
      daysLeft,
      statusText: `সক্রিয় (বাকি ${daysLeft} দিন)`,
      isExpiringSoon,
      isExpiredToday,
    };
  }

  return {
    isActive: false,
    daysLeft: 0,
    statusText: "মেয়াদ শেষ হয়েছে",
    isExpiringSoon: false,
    isExpiredToday,
  };
};

// নিরাপদভাবে ছোট ছবি (DataURL) কম্প্রেস করার হেল্পার (Storage/ব্লব ছাড়াও ফোনে সহজে কাজ করে)
const readFileAsDataUrl = (file, maxWidth = 800) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (!file.type.startsWith("image/")) {
      return reject(new Error("শুধুমাত্র ছবি ফাইল নির্বাচন করুন।"));
    }
    if (file.size > 4 * 1024 * 1024) {
      return reject(new Error("ছবির সাইজ ৪ MB-এর কম হতে হবে।"));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const writeAuditLog = async (actorPhone, action, details = "") => {
  try {
    const logRef = doc(collection(db, "nirmanzone_audit_logs"));
    await setDoc(logRef, {
      actorPhone: cleanPhone(actorPhone) || "system",
      action,
      details,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Audit log error:", err.message);
  }
};

// ==========================================
// ৪. মূল অ্যাপ্লিকেশন
// ==========================================
export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [shops, setShops] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [currentUserPhone, setCurrentUserPhone] = useState(() => {
    try {
      return cleanPhone(localStorage.getItem("nirmanzone_active_phone") || "");
    } catch {
      return "";
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // home | jobs | providers | shops | profile | admin
  const [toast, setToast] = useState(null);

  // রেজিস্ট্রেশন / লগইন ফর্ম স্টেট
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [loginPhone, setLoginPhone] = useState("");
  const [regAccountType, setRegAccountType] = useState("owner"); // owner | provider
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regProfession, setRegProfession] = useState(SERVICE_PROVIDER_PROFESSIONS[0]);
  const [regExperience, setRegExperience] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regDivision, setRegDivision] = useState("");
  const [regDistrict, setRegDistrict] = useState("");
  const [regUpazila, setRegUpazila] = useState("");
  const [regAreaType, setRegAreaType] = useState("গ্রাম/ইউনিয়ন"); // গ্রাম/ইউনিয়ন | শহর/ওয়ার্ড
  const [regUnionOrWard, setRegUnionOrWard] = useState("");
  const [regVillageOrMoholla, setRegVillageOrMoholla] = useState("");
  const [regProfilePhoto, setRegProfilePhoto] = useState("");
  const [regSamplePhoto, setRegSamplePhoto] = useState("");
  const [regShopName, setRegShopName] = useState("");
  const [regShopCategories, setRegShopCategories] = useState([]);
  const [regShopDesc, setRegShopDesc] = useState("");
  const [regShopPhoto, setRegShopPhoto] = useState("");
  const [regShopPriceHint, setRegShopPriceHint] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // কাজের বিজ্ঞাপন পোস্ট মডাল স্টেট
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState(JOB_CATEGORIES[0]);
  const [jobProfessionNeeded, setJobProfessionNeeded] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobDivision, setJobDivision] = useState("");
  const [jobDistrict, setJobDistrict] = useState("");
  const [jobUpazila, setJobUpazila] = useState("");
  const [jobAreaDetail, setJobAreaDetail] = useState("");
  const [jobBudget, setJobBudget] = useState("");
  const [jobStartDate, setJobStartDate] = useState("");
  const [jobContactPhone, setJobContactPhone] = useState("");
  const [jobPhoto, setJobPhoto] = useState("");
  const [postingJob, setPostingJob] = useState(false);

  // সার্চ ও ফিল্টার স্টেট
  const [searchProf, setSearchProf] = useState("");
  const [searchDiv, setSearchDiv] = useState("");
  const [searchDist, setSearchDist] = useState("");
  const [searchUpazila, setSearchUpazila] = useState("");
  const [searchUnionOrWard, setSearchUnionOrWard] = useState("");
  const [searchArea, setSearchArea] = useState("");
  const [shopFilterCat, setShopFilterCat] = useState("");
  const [shopFilterDistrict, setShopFilterDistrict] = useState("");

  // পেমেন্ট জমা মডাল স্টেট
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payMethod, setPayMethod] = useState("bkash"); // bkash | nagad
  const [trxIdInput, setTrxIdInput] = useState("");
  const [senderPhoneInput, setSenderPhoneInput] = useState("");
  const [payScreenshot, setPayScreenshot] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // রিপোর্ট মডাল স্টেট
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // অ্যাডমিন লগইন স্টেট (PIN কোডে হার্ডকোড করা হয়নি)
  const [adminPhoneInput, setAdminPhoneInput] = useState(DEFAULT_ADMIN_PHONE);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminOtpInput, setAdminOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [failedAdminAttempts, setFailedAdminAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [adminSubTab, setAdminSubTab] = useState("overview");

  // অ্যাডমিন সেটিংস স্টেট
  const [editSettings, setEditSettings] = useState(DEFAULT_SETTINGS);

  const showToast = (text, type = "info") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4200);
  };

  // Firebase Anonymous Auth সংযোগ
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        setAuthLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Auth error:", err);
          setAuthLoading(false);
        }
      }
    });
    return () => unsub();
  }, []);

  // Firestore রিয়েল-টাইম লিসেনারসমূহ
  useEffect(() => {
    if (!authUser) return;

    const unsubUsers = onSnapshot(collection(db, "nirmanzone_users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubJobs = onSnapshot(collection(db, "nirmanzone_jobs"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setJobs(list);
    });

    const unsubShops = onSnapshot(collection(db, "nirmanzone_shops"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setShops(list);
    });

    const unsubPayments = onSnapshot(collection(db, "nirmanzone_payments"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setPayments(list);
    });

    const unsubReports = onSnapshot(collection(db, "nirmanzone_reports"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setReports(list);
    });

    const unsubLogs = onSnapshot(collection(db, "nirmanzone_audit_logs"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setAuditLogs(list.slice(0, 60));
    });

    const unsubSettings = onSnapshot(doc(db, "nirmanzone_settings", "main"), (docSnap) => {
      if (docSnap.exists()) {
        const merged = { ...DEFAULT_SETTINGS, ...docSnap.data() };
        setSettings(merged);
        setEditSettings(merged);
      }
    });

    return () => {
      unsubUsers();
      unsubJobs();
      unsubShops();
      unsubPayments();
      unsubReports();
      unsubLogs();
      unsubSettings();
    };
  }, [authUser]);

  const currentUser = useMemo(
    () => users.find((u) => cleanPhone(u.phone) === cleanPhone(currentUserPhone)) || null,
    [users, currentUserPhone]
  );

  const membership = useMemo(
    () => getMembershipStatus(currentUser, settings),
    [currentUser, settings]
  );

  useEffect(() => {
    if (currentUser?.phone && !jobContactPhone) {
      setJobContactPhone(currentUser.phone);
    }
  }, [currentUser, jobContactPhone]);

  // ==========================================
  // ৫. লগইন, রেজিস্ট্রেশন ও প্রোফাইল আপডেট
  // ==========================================
  const handleLoginByPhone = async (e) => {
    e.preventDefault();
    const cleaned = cleanPhone(loginPhone);
    if (!isValidBDPhone(cleaned)) {
      return showToast("সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।", "error");
    }

    const found = users.find((u) => cleanPhone(u.phone) === cleaned);
    if (!found) {
      return showToast("এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে রেজিস্ট্রেশন করুন।", "error");
    }
    if (found.isBlocked) {
      return showToast("এই অ্যাকাউন্টটি সাময়িকভাবে ব্লক করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।", "error");
    }

    setCurrentUserPhone(cleaned);
    localStorage.setItem("nirmanzone_active_phone", cleaned);
    await writeAuditLog(cleaned, "USER_LOGIN", `${found.fullName} (${found.accountType}) লগইন করেছেন`);
    showToast(`স্বাগতম, ${found.fullName}!`, "success");
    setActiveTab("home");
  };

  const toggleShopCategory = (cat) => {
    setRegShopCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleaned = cleanPhone(regPhone);
    if (!regName.trim()) return showToast("আপনার নাম লিখুন।", "error");
    if (!isValidBDPhone(cleaned)) return showToast("সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।", "error");
    if (!regDivision || !regDistrict || !regUpazila) {
      return showToast("বিভাগ, জেলা এবং উপজেলা/থানা নির্বাচন করুন।", "error");
    }

    const exists = users.some((u) => cleanPhone(u.phone) === cleaned);
    if (exists) {
      return showToast("এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা আছে।", "error");
    }

    setSubmittingAuth(true);
    try {
      const isSpecialFree =
        regAccountType === "provider" &&
        isSpecialFreeProvider(cleaned, regProfession);

      const initialExpiry =
        regAccountType === "owner" || isSpecialFree
          ? new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString()
          : "";

      const userDoc = {
        phone: cleaned,
        fullName: regName.trim(),
        accountType: regAccountType, // 'owner' | 'provider'
        profession: regAccountType === "provider" ? regProfession : "",
        experience: regAccountType === "provider" ? regExperience.trim() : "",
        bio: regAccountType === "provider" ? regBio.trim() : "",
        lookingForWork: regAccountType === "provider" ? true : false,
        division: regDivision,
        district: regDistrict,
        upazila: regUpazila,
        areaType: regAreaType,
        unionOrWard: regUnionOrWard.trim(),
        villageOrMoholla: regVillageOrMoholla.trim(),
        profilePhoto: regProfilePhoto || "",
        samplePhoto: regSamplePhoto || "",
        isApproved: regAccountType === "owner" || isSpecialFree ? true : false,
        isPermanentFree: regAccountType === "owner" || isSpecialFree,
        isBlocked: false,
        subscriptionExpiry: initialExpiry,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "nirmanzone_users", cleaned), userDoc);

      // নির্মাণসামগ্রীর দোকান যুক্ত হলে আলাদা কালেকশনে সংরক্ষণ
      if (regAccountType === "provider" && regShopName.trim()) {
        const shopRef = doc(collection(db, "nirmanzone_shops"));
        await setDoc(shopRef, {
          ownerPhone: cleaned,
          ownerName: regName.trim(),
          shopName: regShopName.trim(),
          categories: regShopCategories.length > 0 ? regShopCategories : ["অন্যান্য নির্মাণসামগ্রী"],
          description: regShopDesc.trim(),
          priceHint: regShopPriceHint.trim(),
          photo: regShopPhoto || "",
          division: regDivision,
          district: regDistrict,
          upazila: regUpazila,
          areaType: regAreaType,
          unionOrWard: regUnionOrWard.trim(),
          villageOrMoholla: regVillageOrMoholla.trim(),
          createdAt: new Date().toISOString(),
        });
      }

      await writeAuditLog(
        cleaned,
        "USER_REGISTER",
        `নতুন ${regAccountType === "owner" ? "মালিক/মহাজন" : "সার্ভিস প্রোভাইডার"} অ্যাকাউন্ট: ${regName.trim()}`
      );

      setCurrentUserPhone(cleaned);
      localStorage.setItem("nirmanzone_active_phone", cleaned);

      if (regAccountType === "owner" || isSpecialFree) {
        showToast(
          isSpecialFree
            ? "আপনার বিশেষ স্থায়ী ফ্রি গ্রিল মিস্ত্রি অ্যাকাউন্ট সক্রিয় হয়েছে!"
            : "আপনার ফ্রি মালিক/মহাজন অ্যাকাউন্ট তৈরি হয়েছে!",
          "success"
        );
      } else {
        showToast(
          `রেজিস্ট্রেশন সম্পন্ন! ৫০ টাকা / ৯০ দিনের সদস্যপদ চালুর জন্য পেমেন্ট ও TrxID জমা দিন।`,
          "info"
        );
        setShowPaymentModal(true);
      }

      setActiveTab("home");
    } catch (err) {
      showToast(`রেজিস্ট্রেশন ব্যর্থ: ${err.message}`, "error");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    setCurrentUserPhone("");
    setIsAdminAuthenticated(false);
    localStorage.removeItem("nirmanzone_active_phone");
    setActiveTab("home");
    showToast("আপনি লগআউট করেছেন।", "info");
  };

  const handleToggleLookingForWork = async () => {
    if (!currentUser || currentUser.accountType !== "provider") return;
    try {
      const nextVal = !currentUser.lookingForWork;
      await updateDoc(doc(db, "nirmanzone_users", currentUser.phone), {
        lookingForWork: nextVal,
      });
      showToast(
        nextVal ? "'আমি কাজ খুঁজছি' ON করা হয়েছে।" : "'আমি কাজ খুঁজছি' OFF করা হয়েছে।",
        "success"
      );
    } catch (err) {
      showToast(`আপডেট ব্যর্থ: ${err.message}`, "error");
    }
  };

  // ==========================================
  // ৬. কাজের বিজ্ঞাপন (পোস্ট ও সম্পন্ন/বন্ধ)
  // ==========================================
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      return showToast("কাজের বিজ্ঞাপন দিতে আগে লগইন বা রেজিস্ট্রেশন করুন।", "error");
    }
    if (currentUser.isBlocked) {
      return showToast("আপনার অ্যাকাউন্ট ব্লক করা আছে।", "error");
    }
    if (!jobTitle.trim() || !jobDesc.trim() || !jobDivision || !jobDistrict || !jobUpazila) {
      return showToast("শিরোনাম, বিবরণ এবং ঠিকানা (বিভাগ, জেলা, উপজেলা) পূরণ করুন।", "error");
    }
    const contact = cleanPhone(jobContactPhone || currentUser.phone);
    if (!isValidBDPhone(contact)) {
      return showToast("সঠিক যোগাযোগের মোবাইল নম্বর দিন।", "error");
    }

    setPostingJob(true);
    try {
      const jobRef = doc(collection(db, "nirmanzone_jobs"));
      await setDoc(jobRef, {
        title: jobTitle.trim(),
        category: jobCategory,
        professionNeeded: jobProfessionNeeded,
        description: jobDesc.trim(),
        division: jobDivision,
        district: jobDistrict,
        upazila: jobUpazila,
        areaDetail: jobAreaDetail.trim(),
        budget: jobBudget.trim(),
        startDate: jobStartDate || "",
        contactPhone: contact,
        ownerPhone: currentUser.phone,
        ownerName: currentUser.fullName,
        photo: jobPhoto || "",
        status: "open", // 'open' | 'closed'
        createdAt: new Date().toISOString(),
      });

      await writeAuditLog(currentUser.phone, "JOB_POSTED", `কাজের বিজ্ঞাপন: ${jobTitle.trim()}`);
      setJobTitle("");
      setJobDesc("");
      setJobAreaDetail("");
      setJobBudget("");
      setJobStartDate("");
      setJobPhoto("");
      setShowJobModal(false);
      showToast("কাজের বিজ্ঞাপন সফলভাবে প্রকাশ করা হয়েছে!", "success");
    } catch (err) {
      showToast(`বিজ্ঞাপন প্রকাশে সমস্যা: ${err.message}`, "error");
    } finally {
      setPostingJob(false);
    }
  };

  const handleCloseJob = async (jobId) => {
    try {
      await updateDoc(doc(db, "nirmanzone_jobs", jobId), {
        status: "closed",
        closedAt: new Date().toISOString(),
      });
      showToast("কাজ সম্পন্ন হিসেবে বিজ্ঞাপনটি বন্ধ করা হয়েছে।", "success");
    } catch (err) {
      showToast(`বন্ধ করতে সমস্যা: ${err.message}`, "error");
    }
  };

  // ==========================================
  // ৭. পেমেন্ট জমা ও অ্যাডমিন অনুমোদন
  // ==========================================
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      return showToast("আগে আপনার সার্ভিস প্রোভাইডার অ্যাকাউন্টে লগইন করুন।", "error");
    }
    const cleanTrx = trxIdInput.trim().toUpperCase();
    if (cleanTrx.length < 6) {
      return showToast("সঠিক Transaction ID (TrxID) লিখুন।", "error");
    }
const cleanSenderPhone = senderPhoneInput.trim();
if (cleanSenderPhone.length < 10) {
  return showToast("যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি লিখুন", "error");
         }

    setSubmittingPayment(true);
    try {
      // একই TrxID দিয়ে একাধিক অ্যাকাউন্টে সদস্যপদ চালু প্রতিরোধ
      const dupQuery = query(
        collection(db, "nirmanzone_payments"),
        where("trxId", "==", cleanTrx)
      );
      const dupSnap = await getDocs(dupQuery);
      const alreadyUsedByOther = dupSnap.docs.some(
        (d) => cleanPhone(d.data().userPhone) !== cleanPhone(currentUser.phone)
      );
      if (alreadyUsedByOther) {
        setSubmittingPayment(false);
        return showToast(
          "এই Transaction ID ইতিমধ্যে অন্য অ্যাকাউন্টে ব্যবহৃত হয়েছে! ভুয়া বা ডুপ্লিকেট TrxID গ্রহণযোগ্য নয়।",
          "error"
        );
      }

      const targetWallet =
        payMethod === "nagad" ? settings.nagadNumber : settings.bkashNumber;

      const payRef = doc(collection(db, "nirmanzone_payments"));
      await setDoc(payRef, {
        userPhone: currentUser.phone,
        userName: currentUser.fullName,
        profession: currentUser.profession || "",
        method: payMethod,
        targetWallet,
        amount: Number(settings.subscriptionFee) || 50,
        days: Number(settings.subscriptionDays) || 90,
        trxId: cleanTrx,
        senderPhone: cleanSenderPhone,
        screenshot: payScreenshot || "",
        status: "pending", // 'pending' | 'approved' | 'rejected'
        createdAt: new Date().toISOString(),
      });

      await writeAuditLog(
        currentUser.phone,
        "PAYMENT_SUBMITTED",
        `TrxID: ${cleanTrx} (${payMethod.toUpperCase()}, ${settings.subscriptionFee} টাকা)`
      );

      setTrxIdInput("");
      setPayScreenshot("");
      setShowPaymentModal(false);
      showToast("পেমেন্ট তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করে অনুমোদন দিলে সদস্যপদ চালু হবে।", "success");
    } catch (err) {
      showToast(`পেমেন্ট জমা দিতে সমস্যা: ${err.message}`, "error");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleApprovePayment = async (paymentItem) => {
    if (!isAdminAuthenticated) return showToast("শুধুমাত্র অনুমোদিত অ্যাডমিন অনুমোদন করতে পারেন।", "error");
    try {
      const daysToAdd = Number(paymentItem.days || settings.subscriptionDays || 90);
      const userDoc = users.find((u) => cleanPhone(u.phone) === cleanPhone(paymentItem.userPhone));
      const baseDate =
        userDoc?.subscriptionExpiry && new Date(userDoc.subscriptionExpiry) > new Date()
          ? new Date(userDoc.subscriptionExpiry)
          : new Date();
      const nextExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

      await updateDoc(doc(db, "nirmanzone_payments", paymentItem.id), {
        status: "approved",
        approvedAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, "nirmanzone_users", cleanPhone(paymentItem.userPhone)), {
        isApproved: true,
        subscriptionExpiry: nextExpiry,
      });

      await writeAuditLog(
        settings.adminPhone,
        "PAYMENT_APPROVED",
        `${paymentItem.userPhone} (TrxID: ${paymentItem.trxId}) — ${daysToAdd} দিনের সদস্যপদ চালু`
      );
      showToast(`${paymentItem.userName}-এর সদস্যপদ ${daysToAdd} দিনের জন্য অনুমোদিত হয়েছে!`, "success");
    } catch (err) {
      showToast(`অনুমোদন ব্যর্থ: ${err.message}`, "error");
    }
  };

  const handleRejectPayment = async (paymentItem) => {
    if (!isAdminAuthenticated) return;
    try {
      await updateDoc(doc(db, "nirmanzone_payments", paymentItem.id), {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      });
      await writeAuditLog(
        settings.adminPhone,
        "PAYMENT_REJECTED",
        `${paymentItem.userPhone} (TrxID: ${paymentItem.trxId}) বাতিল করা হয়েছে`
      );
      showToast("পেমেন্ট অনুরোধ বাতিল করা হয়েছে।", "info");
    } catch (err) {
      showToast(`বাতিল করতে সমস্যা: ${err.message}`, "error");
    }
  };

  // ==========================================
  // ৮. রিপোর্ট ও অ্যাডমিন নিয়ন্ত্রণ
  // ==========================================
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportTarget || !reportReason.trim()) {
      return showToast("রিপোর্টের কারণ লিখুন।", "error");
    }
    setSubmittingReport(true);
    try {
      const repRef = doc(collection(db, "nirmanzone_reports"));
      await setDoc(repRef, {
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        targetName: reportTarget.name,
        targetPhone: reportTarget.phone || "",
        reporterPhone: currentUserPhone || "guest",
        reason: reportReason.trim(),
        status: "open",
        createdAt: new Date().toISOString(),
      });
      await writeAuditLog(
        currentUserPhone || "guest",
        "REPORT_SUBMITTED",
        `${reportTarget.name} (${reportTarget.type}): ${reportReason.trim()}`
      );
      setReportReason("");
      setReportTarget(null);
      showToast("আপনার অভিযোগ/রিপোর্ট অ্যাডমিনের কাছে পাঠানো হয়েছে।", "success");
    } catch (err) {
      showToast(`রিপোর্ট পাঠাতে সমস্যা: ${err.message}`, "error");
    } finally {
      setSubmittingReport(false);
    }
  };

  // অ্যাডমিন লগইন (PIN কোডে হার্ডকোড করা নেই — Firestore admin_config থেকে যাচাই হয়)
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (lockoutUntil > now) {
      const secLeft = Math.ceil((lockoutUntil - now) / 1000);
      return showToast(`বারবার ভুল চেষ্টার কারণে লগইন সাময়িক বন্ধ। ${secLeft} সেকেন্ড পর চেষ্টা করুন।`, "error");
    }

    const phone = cleanPhone(adminPhoneInput);
    const activeAdminPhone = cleanPhone(settings.adminPhone || DEFAULT_ADMIN_PHONE);

    if (phone !== activeAdminPhone) {
      const nextFail = failedAdminAttempts + 1;
      setFailedAdminAttempts(nextFail);
      if (nextFail >= 4) setLockoutUntil(Date.now() + 60 * 1000);
      return showToast("অননুমোদিত অ্যাডমিন নম্বর।", "error");
    }

    if (!adminPinInput.trim()) {
      return showToast("গোপন PIN লিখুন।", "error");
    }

    if (generatedOtp && adminOtpInput.trim() !== generatedOtp) {
      return showToast("যাচাই কোড (OTP) সঠিক নয়।", "error");
    }

    try {
      // Firestore-এ সংরক্ষিত admin_config/security ডকুমেন্টে pinHash অথবা pin যাচাই
      const secSnap = await getDoc(doc(db, "nirmanzone_admin_config", "security"));
      let validPin = false;

      if (secSnap.exists()) {
        const data = secSnap.data();
        const encoder = new TextEncoder();
        const hashBuf = await crypto.subtle.digest(
          "SHA-256",
          encoder.encode(adminPinInput.trim())
        );
        const computedHash = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (data.pinSha256 && data.pinSha256 === computedHash) {
          validPin = true;
        } else if (data.pin && data.pin === adminPinInput.trim()) {
          validPin = true;
        }
      } else {
        // প্রথমবার সেটআপের ক্ষেত্রে: Firestore-এ admin_config/security তৈরি করে PIN সেট করার নির্দেশনা
        return showToast(
          "Firestore-এ nirmanzone_admin_config/security ডকুমেন্টে pinSha256 সেট করুন (কোডে PIN রাখা হয়নি)।",
          "error"
        );
      }

      if (!validPin) {
        const nextFail = failedAdminAttempts + 1;
        setFailedAdminAttempts(nextFail);
        await writeAuditLog(phone, "ADMIN_LOGIN_FAILED", `ভুল PIN চেষ্টা (#${nextFail})`);
        if (nextFail >= 4) {
          setLockoutUntil(Date.now() + 60 * 1000);
          return showToast("৪ বার ভুল PIN দেওয়ায় ১ মিনিটের জন্য অ্যাডমিন লগইন বন্ধ রাখা হয়েছে।", "error");
        }
        return showToast("ভুল অ্যাডমিন PIN!", "error");
      }

      setIsAdminAuthenticated(true);
      setFailedAdminAttempts(0);
      setAdminPinInput("");
      setAdminOtpInput("");
      setGeneratedOtp("");
      await writeAuditLog(phone, "ADMIN_LOGIN_SUCCESS", "অ্যাডমিন প্যানেলে প্রবেশ করেছেন");
      showToast("নিরাপদ অ্যাডমিন প্যানেলে স্বাগতম!", "success");
    } catch (err) {
      showToast(`অ্যাডমিন যাচাই ব্যর্থ: ${err.message}`, "error");
    }
  };

  const handleSendAdminOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    showToast(`নিরাপদ যাচাই কোড (OTP): ${code}`, "info");
  };

  const handleAdminToggleBlock = async (userItem) => {
    if (!isAdminAuthenticated) return;
    try {
      const nextBlock = !userItem.isBlocked;
      await updateDoc(doc(db, "nirmanzone_users", cleanPhone(userItem.phone)), {
        isBlocked: nextBlock,
      });
      await writeAuditLog(
        settings.adminPhone,
        nextBlock ? "USER_BLOCKED" : "USER_UNBLOCKED",
        `${userItem.fullName} (${userItem.phone})`
      );
      showToast(nextBlock ? "ব্যবহারকারী ব্লক করা হয়েছে।" : "ব্যবহারকারী আনব্লক করা হয়েছে।", "success");
    } catch (err) {
      showToast(`ব্যর্থ: ${err.message}`, "error");
    }
  };

  const handleAdminToggleMembership = async (userItem, activateDays = 90) => {
    if (!isAdminAuthenticated) return;
    try {
      const st = getMembershipStatus(userItem, settings);
      if (st.isActive && !userItem.isPermanentFree) {
        // সদস্যপদ বন্ধ করা (তথ্য না মুছে মেয়াদ অতীতে সেট করা)
        await updateDoc(doc(db, "nirmanzone_users", cleanPhone(userItem.phone)), {
          subscriptionExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        });
        await writeAuditLog(settings.adminPhone, "MEMBERSHIP_DEACTIVATED", `${userItem.phone}`);
        showToast("সদস্যপদ সাময়িক বন্ধ করা হয়েছে (প্রোফাইল তথ্য অক্ষত আছে)।", "info");
      } else {
        const nextExp = new Date(
          Date.now() + Number(activateDays || 90) * 24 * 60 * 60 * 1000
        ).toISOString();
        await updateDoc(doc(db, "nirmanzone_users", cleanPhone(userItem.phone)), {
          isApproved: true,
          subscriptionExpiry: nextExp,
        });
        await writeAuditLog(
          settings.adminPhone,
          "MEMBERSHIP_ACTIVATED",
          `${userItem.phone} (${activateDays} দিন)`
        );
        showToast(`${activateDays} দিনের জন্য সদস্যপদ চালু করা হয়েছে।`, "success");
      }
    } catch (err) {
      showToast(`ব্যর্থ: ${err.message}`, "error");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    try {
      const payload = {
        bkashNumber: cleanPhone(editSettings.bkashNumber) || DEFAULT_SETTINGS.bkashNumber,
        nagadNumber: cleanPhone(editSettings.nagadNumber) || DEFAULT_SETTINGS.nagadNumber,
        subscriptionFee: Number(editSettings.subscriptionFee) || 50,
        subscriptionDays: Number(editSettings.subscriptionDays) || 90,
        adminPhone: cleanPhone(editSettings.adminPhone) || DEFAULT_ADMIN_PHONE,
        adminEmailOrContact: editSettings.adminEmailOrContact.trim() || DEFAULT_ADMIN_PHONE,
      };
      await setDoc(doc(db, "nirmanzone_settings", "main"), payload, { merge: true });
      await writeAuditLog(payload.adminPhone, "SETTINGS_UPDATED", "পেমেন্ট/ফি/অ্যাডমিন তথ্য আপডেট");
      showToast("অ্যাডমিন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!", "success");
    } catch (err) {
      showToast(`সেটিংস সংরক্ষণ ব্যর্থ: ${err.message}`, "error");
    }
  };

  // ==========================================
  // ৯. ফিল্টার করা তালিকা
  // ==========================================
  const filteredProviders = useMemo(() => {
    return users.filter((u) => {
      if (u.accountType !== "provider" || u.isBlocked) return false;
      const st = getMembershipStatus(u, settings);
      if (!st.isActive) return false; // মেয়াদ শেষ হলে পেইড সুবিধা/তালিকায় সক্রিয় দেখাবে না

      if (searchProf && u.profession !== searchProf) return false;
      if (searchDiv && u.division !== searchDiv) return false;
      if (searchDist && u.district !== searchDist) return false;
      if (searchUpazila && u.upazila !== searchUpazila) return false;
      if (
        searchUnionOrWard.trim() &&
        !(u.unionOrWard || "").toLowerCase().includes(searchUnionOrWard.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        searchArea.trim() &&
        !(u.villageOrMoholla || "").toLowerCase().includes(searchArea.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [users, settings, searchProf, searchDiv, searchDist, searchUpazila, searchUnionOrWard, searchArea]);

  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      if (shopFilterCat && !(s.categories || []).includes(shopFilterCat)) return false;
      if (
        shopFilterDistrict.trim() &&
        !(s.district || "").toLowerCase().includes(shopFilterDistrict.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [shops, shopFilterCat, shopFilterDistrict]);

  const ownersList = useMemo(() => users.filter((u) => u.accountType === "owner"), [users]);
  const providersList = useMemo(() => users.filter((u) => u.accountType === "provider"), [users]);
  const expiredProvidersList = useMemo(
    () =>
      providersList.filter(
        (u) => !u.isPermanentFree && !getMembershipStatus(u, settings).isActive
      ),
    [providersList, settings]
  );

  const totalApprovedIncome = useMemo(
    () =>
      payments
        .filter((p) => p.status === "approved")
        .reduce((sum, p) => sum + Number(p.amount || settings.subscriptionFee || 50), 0),
    [payments, settings.subscriptionFee]
  );

  const searchDistricts = searchDiv ? Object.keys(BANGLADESH_LOCATIONS[searchDiv] || {}) : [];
  const searchUpazilas =
    searchDiv && searchDist ? BANGLADESH_LOCATIONS[searchDiv]?.[searchDist] || [] : [];

  const regDistricts = regDivision ? Object.keys(BANGLADESH_LOCATIONS[regDivision] || {}) : [];
  const regUpazilas =
    regDivision && regDistrict ? BANGLADESH_LOCATIONS[regDivision]?.[regDistrict] || [] : [];

  const jobDistricts = jobDivision ? Object.keys(BANGLADESH_LOCATIONS[jobDivision] || {}) : [];
  const jobUpazilas =
    jobDivision && jobDistrict ? BANGLADESH_LOCATIONS[jobDivision]?.[jobDistrict] || [] : [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-6 text-center max-w-sm w-full">
          <p className="text-lg font-bold text-emerald-700">নির্মাণ জোন (NIRMAN ZONE)</p>
          <p className="text-sm text-slate-600 mt-2">অ্যাপ লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24">
      {/* টোস্ট নোটিফিকেশন */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold max-w-md w-[92%] text-center ${
            toast.type === "error"
              ? "bg-rose-600"
              : toast.type === "success"
              ? "bg-emerald-600"
              : "bg-slate-800"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* শীর্ষ হেডার */}
      <header className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white sticky top-0 z-30 shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="text-left focus:outline-none"
          >
            <h1 className="text-xl font-extrabold tracking-tight">নির্মাণ জোন</h1>
            <p className="text-[11px] text-emerald-100">NIRMAN ZONE • নির্মাণসেবা মার্কেটপ্লেস</p>
          </button>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl text-xs font-bold"
              >
                {currentUser.fullName.split(" ")[0]}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-3.5 py-2 rounded-xl text-xs font-extrabold"
              >
                লগইন / অ্যাকাউন্ট
              </button>
            )}
          </div>
        </div>
      </header>

      {/* মেয়াদ শেষ হওয়ার ৭ দিন আগে ও মেয়াদ শেষ হওয়ার দিনের নোটিফিকেশন ব্যানার */}
      {currentUser && currentUser.accountType === "provider" && !currentUser.isPermanentFree && (
        <div className="max-w-5xl mx-auto px-4 mt-3">
          {membership.isExpiredToday && (
            <div className="bg-rose-100 border-2 border-rose-500 text-rose-900 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-sm">
                  আজ আপনার সদস্যপদের মেয়াদ শেষ হয়েছে!
                </p>
                <p className="text-xs mt-1">
                  আপনার প্রোফাইল তথ্য মুছে যাবে না, তবে পেইড সদস্যপদ সুবিধা পুনরায় চালু করতে ৫০ টাকা পেমেন্ট করে TrxID জমা দিন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shrink-0"
              >
                এখনই পেমেন্ট করুন
              </button>
            </div>
          )}

          {!membership.isExpiredToday && membership.isExpiringSoon && (
            <div className="bg-amber-100 border-2 border-amber-500 text-amber-950 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-sm">
                  সতর্কবার্তা: আপনার সদস্যপদের মেয়াদ আর মাত্র {membership.daysLeft} দিন বাকি!
                </p>
                <p className="text-xs mt-1">
                  মেয়াদ শেষ হলে অ্যাকাউন্টের তথ্য থাকবে, কিন্তু পেইড সুবিধা বন্ধ হয়ে যাবে। সময়মতো রিনিউ করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shrink-0"
              >
                সদস্যপদ রিনিউ করুন
              </button>
            </div>
          )}

          {!membership.isActive && !membership.isExpiredToday && (
            <div className="bg-slate-200 border border-slate-400 text-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-sm">আপনার পেইড সদস্যপদ বর্তমানে সক্রিয় নয়।</p>
               <p className="text-xs font-bold text-rose-700 mt-0.5">
  স্ট্যাটাস: ডিসকানেক্ট
</p>
<p className="text-xs mt-1">
                  আপনার প্রোফাইল সংরক্ষিত আছে। {settings.subscriptionFee} টাকা / {settings.subscriptionDays} দিনের সদস্যপদ চালু করতে TrxID জমা দিন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shrink-0"
              >
                পেমেন্ট জমা দিন
              </button>
            </div>
          )}
        </div>
      )}

      {/* মূল কনটেন্ট এরিয়া */}
      <main className="max-w-5xl mx-auto px-4 pt-4">
        {/* ==================== হোম ট্যাব ==================== */}
        {activeTab === "home" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h2 className="text-xl font-extrabold text-slate-900">
                বাড়ির মালিক, মিস্ত্রি, ঠিকাদার ও নির্মাণসামগ্রীর বিশ্বস্ত ঠিকানা
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                মালিক ও মহাজনের জন্য সম্পূর্ণ ফ্রি। সার্ভিস প্রোভাইডারের সদস্যপদ মাত্র {settings.subscriptionFee} টাকা ({settings.subscriptionDays} দিন)।
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("providers")}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-3.5 rounded-2xl text-left transition"
                >
                  <p className="font-extrabold text-emerald-900 text-sm">মিস্ত্রি খুঁজুন</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{filteredProviders.length} জন সক্রিয়</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("jobs")}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 p-3.5 rounded-2xl text-left transition"
                >
                  <p className="font-extrabold text-blue-900 text-sm">কাজের বিজ্ঞাপন</p>
                  <p className="text-xs text-blue-700 mt-0.5">{jobs.filter((j) => j.status === "open").length} টি খোলা কাজ</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("shops")}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-3.5 rounded-2xl text-left transition"
                >
                  <p className="font-extrabold text-amber-900 text-sm">নির্মাণসামগ্রীর দোকান</p>
                  <p className="text-xs text-amber-700 mt-0.5">{shops.length} টি দোকান</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      setActiveTab("profile");
                      showToast("কাজের বিজ্ঞাপন দিতে আগে অ্যাকাউন্ট খুলুন বা লগইন করুন।", "info");
                    } else {
                      setShowJobModal(true);
                    }
                  }}
                  className="bg-teal-700 hover:bg-teal-800 text-white p-3.5 rounded-2xl text-left transition shadow-sm"
                >
                  <p className="font-extrabold text-sm">+ কাজের বিজ্ঞাপন দিন</p>
                  <p className="text-xs text-teal-100 mt-0.5">মালিক/মহাজন ফ্রি</p>
                </button>
              </div>
            </div>

            {/* সাম্প্রতিক কাজের বিজ্ঞাপন */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-slate-900">সাম্প্রতিক কাজের বিজ্ঞাপন</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("jobs")}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  সব দেখুন →
                </button>
              </div>
              {jobs.filter((j) => j.status === "open").slice(0, 3).length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">এই মুহূর্তে কোনো নতুন কাজের বিজ্ঞাপন নেই।</p>
              ) : (
                <div className="space-y-3">
                  {jobs
                    .filter((j) => j.status === "open")
                    .slice(0, 3)
                    .map((job) => (
                      <div
                        key={job.id}
                        className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            {job.category}
                          </span>
                          <h4 className="font-bold text-slate-900 mt-1">{job.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {job.areaDetail ? `${job.areaDetail}, ` : ""}
                            {job.upazila}, {job.district}, {job.division}
                          </p>
                        </div>
                        <a
                          href={`tel:${cleanPhone(job.contactPhone)}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-sm text-center shrink-0"
                        >
                          ফোন করুন
                        </a>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== কাজের বিজ্ঞাপন ট্যাব ==================== */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">কাজের বিজ্ঞাপনসমূহ</h2>
                <p className="text-xs text-slate-600">বাড়ির মালিক ও মহাজনের দেওয়া কাজ দেখুন এবং সরাসরি কথা বলুন</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    setActiveTab("profile");
                    showToast("বিজ্ঞাপন দিতে আগে লগইন বা রেজিস্ট্রেশন করুন।", "info");
                  } else {
                    setShowJobModal(true);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-sm"
              >
                + নতুন কাজের বিজ্ঞাপন
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm border border-slate-200">
                এখনো কোনো কাজের বিজ্ঞাপন দেওয়া হয়নি।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => {
                  const isOwnerOfPost =
                    currentUser && cleanPhone(job.ownerPhone) === cleanPhone(currentUser.phone);
                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            {job.category}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              job.status === "open"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {job.status === "open" ? "কাজ চলছে / খোলা" : "কাজ সম্পন্ন"}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 mt-2">{job.title}</h3>
                        {job.professionNeeded && (
                          <p className="text-xs font-semibold text-teal-800 mt-0.5">
                            প্রয়োজনীয় পেশা: {job.professionNeeded}
                          </p>
                        )}
                        <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{job.description}</p>

                        {job.photo && (
                          <img
                            src={job.photo}
                            alt={job.title}
                            className="mt-3 w-full h-44 object-cover rounded-xl border border-slate-200"
                          />
                        )}

                        <div className="mt-3 text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
                          <p>
                            <strong>ঠিকানা:</strong> {job.areaDetail ? `${job.areaDetail}, ` : ""}
                            {job.upazila}, {job.district}, {job.division}
                          </p>
                          {job.budget && (
                            <p>
                              <strong>সম্ভাব্য বাজেট:</strong> {job.budget}
                            </p>
                          )}
                          {job.startDate && (
                            <p>
                              <strong>কাজ শুরুর তারিখ:</strong> {job.startDate}
                            </p>
                          )}
                          <p>
                            <strong>বিজ্ঞাপনদাতা:</strong> {job.ownerName} ({job.contactPhone})
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        {job.status === "open" && (
                          <a
                            href={`tel:${cleanPhone(job.contactPhone)}`}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-sm text-center"
                          >
                            ফোন করুন ({job.contactPhone})
                          </a>
                        )}

                        {isOwnerOfPost && job.status === "open" && (
                          <button
                            type="button"
                            onClick={() => handleCloseJob(job.id)}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3.5 rounded-xl text-xs"
                          >
                            কাজ সম্পন্ন / বন্ধ করুন
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setReportTarget({
                              type: "job",
                              id: job.id,
                              name: job.title,
                              phone: job.contactPhone,
                            })
                          }
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-3 rounded-xl text-xs"
                        >
                          রিপোর্ট
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== মিস্ত্রি ও সার্ভিস প্রোভাইডার খোঁজা ==================== */}
        {activeTab === "providers" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                মিস্ত্রি ও সার্ভিস প্রোভাইডার খুঁজুন
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  value={searchProf}
                  onChange={(e) => setSearchProf(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="">সকল পেশা</option>
                  {SERVICE_PROVIDER_PROFESSIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <select
                  value={searchDiv}
                  onChange={(e) => {
                    setSearchDiv(e.target.value);
                    setSearchDist("");
                    setSearchUpazila("");
                  }}
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="">সকল বিভাগ</option>
                  {Object.keys(BANGLADESH_LOCATIONS).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={searchDist}
                  onChange={(e) => {
                    setSearchDist(e.target.value);
                    setSearchUpazila("");
                  }}
                  disabled={!searchDiv}
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white disabled:bg-slate-100"
                >
                  <option value="">সকল জেলা</option>
                  {searchDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>

                <select
                  value={searchUpazila}
                  onChange={(e) => setSearchUpazila(e.target.value)}
                  disabled={!searchDist}
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white disabled:bg-slate-100"
                >
                  <option value="">সকল উপজেলা/থানা</option>
                  {searchUpazilas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={searchUnionOrWard}
                  onChange={(e) => setSearchUnionOrWard(e.target.value)}
                  placeholder="ইউনিয়ন বা ওয়ার্ড লিখুন"
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />

                <input
                  type="text"
                  value={searchArea}
                  onChange={(e) => setSearchArea(e.target.value)}
                  placeholder="গ্রাম বা মহল্লার নাম লিখুন"
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {filteredProviders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm border border-slate-200">
                এই অনুযায়ী সক্রিয় কোনো সার্ভিস প্রোভাইডার পাওয়া যায়নি।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProviders.map((prov) => (
                  <div
                    key={prov.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {prov.profilePhoto ? (
                            <img
                              src={prov.profilePhoto}
                              alt={prov.fullName}
                              className="w-12 h-12 rounded-full object-cover border border-emerald-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-lg">
                              {prov.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-base">{prov.fullName}</h3>
                            <p className="text-xs font-bold text-emerald-700">{prov.profession}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            prov.lookingForWork
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          কাজ খুঁজছি: {prov.lookingForWork ? "ON" : "OFF"}
                        </span>
                      </div>

                      {prov.experience && (
                        <p className="text-xs text-slate-700 mt-2.5">
                          <strong>অভিজ্ঞতা:</strong> {prov.experience}
                        </p>
                      )}
                      {prov.bio && (
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{prov.bio}</p>
                      )}

                      <p className="text-xs text-slate-600 mt-2">
                        <strong>ঠিকানা:</strong>{" "}
                        {[
                          prov.villageOrMoholla,
                          prov.unionOrWard,
                          prov.upazila,
                          prov.district,
                          prov.division,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>

                      {prov.samplePhoto && (
                        <img
                          src={prov.samplePhoto}
                          alt="কাজের নমুনা"
                          className="mt-3 w-full h-36 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`tel:${cleanPhone(prov.phone)}`}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm text-center"
                      >
                        ফোন করুন ({prov.phone})
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            type: "provider",
                            id: prov.id,
                            name: prov.fullName,
                            phone: prov.phone,
                          })
                        }
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 px-3 rounded-xl text-xs"
                      >
                        রিপোর্ট
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== নির্মাণসামগ্রীর দোকান ট্যাব ==================== */}
        {activeTab === "shops" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">নির্মাণসামগ্রীর দোকানসমূহ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={shopFilterCat}
                  onChange={(e) => setShopFilterCat(e.target.value)}
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="">সকল নির্মাণসামগ্রী</option>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={shopFilterDistrict}
                  onChange={(e) => setShopFilterDistrict(e.target.value)}
                  placeholder="জেলার নাম দিয়ে খুঁজুন"
                  className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {filteredShops.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm border border-slate-200">
                কোনো নির্মাণসামগ্রীর দোকান পাওয়া যায়নি।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{shop.shopName}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        <strong>মালিক:</strong> {shop.ownerName} • <strong>মোবাইল:</strong>{" "}
                        {shop.ownerPhone}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(shop.categories || []).map((cat) => (
                          <span
                            key={cat}
                            className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      {shop.description && (
                        <p className="text-xs text-slate-700 mt-2">{shop.description}</p>
                      )}
                      {shop.priceHint && (
                        <p className="text-xs font-semibold text-emerald-800 mt-1">
                          দামের তথ্য: {shop.priceHint}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 mt-2">
                        <strong>ঠিকানা:</strong>{" "}
                        {[
                          shop.villageOrMoholla,
                          shop.unionOrWard,
                          shop.upazila,
                          shop.district,
                          shop.division,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>

                      {shop.photo && (
                        <img
                          src={shop.photo}
                          alt={shop.shopName}
                          className="mt-3 w-full h-36 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>

                    <a
                      href={`tel:${cleanPhone(shop.ownerPhone)}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-sm text-center"
                    >
                      দোকানে ফোন করুন ({shop.ownerPhone})
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== প্রোফাইল ও অ্যাকাউন্ট ট্যাব ==================== */}
        {activeTab === "profile" && (
          <div className="space-y-5">
            {currentUser ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">{currentUser.fullName}</h2>
                    <p className="text-xs text-slate-600">
                      {currentUser.accountType === "owner"
                        ? "মালিক / মহাজন (স্থায়ী ফ্রি অ্যাকাউন্ট)"
                        : `সার্ভিস প্রোভাইডার • ${currentUser.profession}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs"
                  >
                    লগআউট
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-xs text-slate-500 block">মোবাইল নম্বর</span>
                    <span className="font-bold">{currentUser.phone}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-xs text-slate-500 block">সদস্যপদ অবস্থা</span>
                    <span className="font-bold text-emerald-700">{membership.statusText}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl sm:col-span-2">
                    <span className="text-xs text-slate-500 block">ঠিকানা ({currentUser.areaType})</span>
                    <span className="font-semibold">
                      {[
                        currentUser.villageOrMoholla,
                        currentUser.unionOrWard,
                        currentUser.upazila,
                        currentUser.district,
                        currentUser.division,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>

                {currentUser.accountType === "provider" && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleToggleLookingForWork}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold ${
                        currentUser.lookingForWork
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-300 text-slate-800"
                      }`}
                    >
                      আমি কাজ খুঁজছি: {currentUser.lookingForWork ? "ON (চালু)" : "OFF (বন্ধ)"}
                    </button>

                    {!currentUser.isPermanentFree && (
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-extrabold"
                      >
                        পেমেন্ট / সদস্যপদ রিনিউ ({settings.subscriptionFee} টাকা / {settings.subscriptionDays} দিন)
                      </button>
                    )}
                  </div>
                )}

                {/* ব্যবহারকারীর নিজের পেমেন্ট হিস্টোরি */}
                {currentUser.accountType === "provider" && !currentUser.isPermanentFree && (
                  <div className="pt-3 border-t">
                    <h3 className="text-sm font-extrabold text-slate-800 mb-2">আমার পেমেন্টসমূহ</h3>
                    {payments.filter((p) => cleanPhone(p.userPhone) === cleanPhone(currentUser.phone)).length ===
                    0 ? (
                      <p className="text-xs text-slate-500">এখনো কোনো পেমেন্ট জমা দেওয়া হয়নি।</p>
                    ) : (
                      <div className="space-y-2">
                        {payments
                          .filter((p) => cleanPhone(p.userPhone) === cleanPhone(currentUser.phone))
                          .map((pay) => (
                            <div
                              key={pay.id}
                              className="border rounded-xl p-3 text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold">
                                  TrxID: {pay.trxId} • {pay.method.toUpperCase()} • {pay.amount} টাকা
                                </p>
                                <p className="text-slate-500">{new Date(pay.createdAt).toLocaleString("bn-BD")}</p>
                              </div>
                              <span
                                className={`font-bold px-2.5 py-1 rounded-full ${
                                  pay.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : pay.status === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {pay.status === "approved"
                                  ? "অনুমোদিত"
                                  : pay.status === "rejected"
                                  ? "বাতিল"
                                  : "যাচাইাধীন"}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold ${
                      authMode === "login"
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    লগইন করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold ${
                      authMode === "register"
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    নতুন অ্যাকাউন্ট খুলুন
                  </button>
                </div>

                {authMode === "login" ? (
                  <form onSubmit={handleLoginByPhone} className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">
                      আপনার মোবাইল নম্বর (১১ ডিজিট)
                    </label>
                    <input
                      type="tel"
                      maxLength={11}
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base"
                    />
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-sm"
                    >
                      লগইন করুন
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        অ্যাকাউন্টের ধরন নির্বাচন করুন
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRegAccountType("owner")}
                          className={`p-3 rounded-xl border text-left ${
                            regAccountType === "owner"
                              ? "border-emerald-600 bg-emerald-50 font-extrabold text-emerald-900"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <p className="text-sm">মালিক / মহাজন</p>
                          <p className="text-[11px] font-normal">স্থায়ী সম্পূর্ণ ফ্রি</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegAccountType("provider")}
                          className={`p-3 rounded-xl border text-left ${
                            regAccountType === "provider"
                              ? "border-emerald-600 bg-emerald-50 font-extrabold text-emerald-900"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <p className="text-sm">সার্ভিস প্রোভাইডার</p>
                          <p className="text-[11px] font-normal">
                            {settings.subscriptionFee} টাকা / {settings.subscriptionDays} দিন
                          </p>
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="আপনার পূর্ণ নাম *"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                    />

                    <input
                      type="tel"
                      maxLength={11}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="মোবাইল নম্বর (01XXXXXXXXX) *"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                    />

                    {regAccountType === "provider" && (
                      <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <select
                          value={regProfession}
                          onChange={(e) => setRegProfession(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                        >
                          {SERVICE_PROVIDER_PROFESSIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>

                        {isSpecialFreeProvider(regPhone, regProfession) && (
                          <div className="bg-emerald-100 text-emerald-900 text-xs font-bold p-2.5 rounded-xl">
                            যাচাইকৃত বিশেষ অ্যাকাউন্ট (01944121530 - গ্রিল মিস্ত্রি): স্থায়ী ফ্রি সদস্যপদ প্রযোজ্য।
                          </div>
                        )}

                        <input
                          type="text"
                          value={regExperience}
                          onChange={(e) => setRegExperience(e.target.value)}
                          placeholder="অভিজ্ঞতা (যেমন: ৮ বছরের কাজ)"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                        />

                        <textarea
                          rows={2}
                          value={regBio}
                          onChange={(e) => setRegBio(e.target.value)}
                          placeholder="আপনার কাজের বিবরণ..."
                          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              প্রোফাইল ছবি (ঐচ্ছিক)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                try {
                                  const url = await readFileAsDataUrl(e.target.files?.[0]);
                                  setRegProfilePhoto(url);
                                } catch (err) {
                                  showToast(err.message, "error");
                                }
                              }}
                              className="text-xs w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              কাজের নমুনা ছবি (ঐচ্ছিক)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                try {
                                  const url = await readFileAsDataUrl(e.target.files?.[0]);
                                  setRegSamplePhoto(url);
                                } catch (err) {
                                  showToast(err.message, "error");
                                }
                              }}
                              className="text-xs w-full"
                            />
                          </div>
                        </div>

                        {/* নির্মাণসামগ্রীর দোকান যুক্ত করার অপশন */}
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <p className="text-xs font-extrabold text-slate-800">
                            নির্মাণসামগ্রীর দোকান থাকলে তথ্য দিন (ঐচ্ছিক)
                          </p>
                          <input
                            type="text"
                            value={regShopName}
                            onChange={(e) => setRegShopName(e.target.value)}
                            placeholder="দোকানের নাম"
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {MATERIAL_CATEGORIES.map((cat) => (
                              <button
                                type="button"
                                key={cat}
                                onClick={() => toggleShopCategory(cat)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                                  regShopCategories.includes(cat)
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-white text-slate-700 border-slate-300"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={regShopPriceHint}
                            onChange={(e) => setRegShopPriceHint(e.target.value)}
                            placeholder="দামের তথ্য (ঐচ্ছিক)"
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                          />
                          <textarea
                            rows={2}
                            value={regShopDesc}
                            onChange={(e) => setRegShopDesc(e.target.value)}
                            placeholder="পণ্যের বিবরণ (ঐচ্ছিক)"
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                          />
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              পণ্যের ছবি (ঐচ্ছিক)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                try {
                                  const url = await readFileAsDataUrl(e.target.files?.[0]);
                                  setRegShopPhoto(url);
                                } catch (err) {
                                  showToast(err.message, "error");
                                }
                              }}
                              className="text-xs w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ঠিকানা ব্যবস্থা: বিভাগ -> জেলা -> উপজেলা -> ইউনিয়ন/ওয়ার্ড -> গ্রাম/মহল্লা */}
                    <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <p className="text-xs font-extrabold text-slate-800">ঠিকানা নির্বাচন করুন *</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={regDivision}
                          onChange={(e) => {
                            setRegDivision(e.target.value);
                            setRegDistrict("");
                            setRegUpazila("");
                          }}
                          className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                        >
                          <option value="">বিভাগ *</option>
                          {Object.keys(BANGLADESH_LOCATIONS).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>

                        <select
                          value={regDistrict}
                          onChange={(e) => {
                            setRegDistrict(e.target.value);
                            setRegUpazila("");
                          }}
                          disabled={!regDivision}
                          className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white disabled:bg-slate-100"
                        >
                          <option value="">জেলা *</option>
                          {regDistricts.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>

                        <select
                          value={regUpazila}
                          onChange={(e) => setRegUpazila(e.target.value)}
                          disabled={!regDistrict}
                          className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white disabled:bg-slate-100"
                        >
                          <option value="">উপজেলা/থানা *</option>
                          {regUpazilas.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={regAreaType}
                          onChange={(e) => setRegAreaType(e.target.value)}
                          className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                        >
                          <option value="গ্রাম/ইউনিয়ন">গ্রাম / ইউনিয়ন</option>
                          <option value="শহর/ওয়ার্ড">শহর / ওয়ার্ড</option>
                        </select>

                        <input
                          type="text"
                          value={regUnionOrWard}
                          onChange={(e) => setRegUnionOrWard(e.target.value)}
                          placeholder={
                            regAreaType === "শহর/ওয়ার্ড"
                              ? "ওয়ার্ড নম্বর/নাম (যেমন: ওয়ার্ড ৫)"
                              : "ইউনিয়নের নাম (যেমন: শিমুলিয়া)"
                          }
                          className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                        />
                      </div>

                      <input
                        type="text"
                        value={regVillageOrMoholla}
                        onChange={(e) => setRegVillageOrMoholla(e.target.value)}
                        placeholder="গ্রাম বা মহল্লার নাম"
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAuth}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-extrabold py-3 rounded-xl text-sm"
                    >
                      {submittingAuth ? "তৈরি হচ্ছে..." : "রেজিস্ট্রেশন সম্পন্ন করুন"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== নিরাপদ অ্যাডমিন প্যানেল ==================== */}
        {activeTab === "admin" && (
          <div className="space-y-4">
            {!isAdminAuthenticated ? (
              <form
                onSubmit={handleAdminLogin}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 max-w-md mx-auto space-y-3"
              >
                <h2 className="text-lg font-extrabold text-slate-900">নিরাপদ অ্যাডমিন লগইন</h2>
                <p className="text-xs text-slate-600">
                  প্রাথমিক অ্যাডমিন নম্বর: {DEFAULT_ADMIN_PHONE} • গোপন PIN কোডে রাখা হয়নি।
                </p>

                <input
                  type="tel"
                  maxLength={11}
                  value={adminPhoneInput}
                  onChange={(e) => setAdminPhoneInput(e.target.value)}
                  placeholder="অ্যাডমিন মোবাইল নম্বর"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                />

                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="গোপন PIN লিখুন"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminOtpInput}
                    onChange={(e) => setAdminOtpInput(e.target.value)}
                    placeholder="যাচাই কোড (OTP)"
                    className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSendAdminOtp}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 rounded-xl text-xs"
                  >
                    OTP নিন
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-sm"
                >
                  অ্যাডমিন প্যানেলে প্রবেশ করুন
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    অ্যাডমিন কন্ট্রোল প্যানেল ({settings.adminPhone})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsAdminAuthenticated(false)}
                    className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
                  >
                    অ্যাডমিন লগআউট
                  </button>
                </div>

                {/* অ্যাডমিন সাব-ট্যাব */}
                <div className="flex flex-wrap gap-2">
                  {[
                    ["overview", "হিসাব ও তালিকা"],
                    ["payments", `পেমেন্ট (${payments.filter((p) => p.status === "pending").length})`],
                    ["content", "বিজ্ঞাপন, দোকান ও রিপোর্ট"],
                    ["settings", "নম্বর, ফি ও মেয়াদ সেটিংস"],
                    ["logs", "অডিট লগ"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAdminSubTab(key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold ${
                        adminSubTab === key
                          ? "bg-emerald-700 text-white"
                          : "bg-white text-slate-700 border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {adminSubTab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-4 rounded-2xl border">
                        <p className="text-xs text-slate-500">মোট ব্যবহারকারী</p>
                        <p className="text-xl font-extrabold">{users.length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border">
                        <p className="text-xs text-slate-500">মালিক / মহাজন</p>
                        <p className="text-xl font-extrabold">{ownersList.length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border">
                        <p className="text-xs text-slate-500">সার্ভিস প্রোভাইডার</p>
                        <p className="text-xl font-extrabold">{providersList.length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border">
                        <p className="text-xs text-slate-500">অনুমোদিত আয়</p>
                        <p className="text-xl font-extrabold text-emerald-700">
                          {totalApprovedIncome} টাকা
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border space-y-3">
                      <h3 className="font-extrabold text-sm">
                        সকল ব্যবহারকারী (মেয়াদোত্তীর্ণ: {expiredProvidersList.length} জন)
                      </h3>
                      <div className="space-y-2">
                        {users.map((u) => {
                          const st = getMembershipStatus(u, settings);
                          return (
                            <div
                              key={u.id}
                              className="border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <p className="font-bold text-sm">
                                  {u.fullName} ({u.phone})
                                </p>
                                <p className="text-slate-600">
                                  {u.accountType === "owner"
                                    ? "মালিক/মহাজন"
                                    : `সার্ভিস প্রোভাইডার (${u.profession})`}{" "}
                                  • {st.statusText}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {u.accountType === "provider" && !u.isPermanentFree && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminToggleMembership(u, settings.subscriptionDays)
                                    }
                                    className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg"
                                  >
                                    {st.isActive ? "সদস্যপদ বন্ধ করুন" : "সদস্যপদ চালু করুন"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAdminToggleBlock(u)}
                                  className={`font-bold px-3 py-1.5 rounded-lg ${
                                    u.isBlocked
                                      ? "bg-amber-500 text-slate-950"
                                      : "bg-rose-600 text-white"
                                  }`}
                                >
                                  {u.isBlocked ? "আনব্লক" : "ব্লক"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === "payments" && (
                  <div className="bg-white p-4 rounded-2xl border space-y-3">
                    <h3 className="font-extrabold text-sm">পেমেন্ট অনুমোদন ও হিসাব</h3>
                    {payments.length === 0 ? (
                      <p className="text-xs text-slate-500">কোনো পেমেন্ট রেকর্ড নেই।</p>
                    ) : (
                      payments.map((pay) => (
                        <div
                          key={pay.id}
                          className="border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-sm">
                              {pay.userName} ({pay.userPhone}) — {pay.amount} টাকা
                            </p>
                            <p className="text-slate-600">
                              মাধ্যম: {pay.method.toUpperCase()} • TrxID: <strong>{pay.trxId}</strong> •
                              অবস্থা: {pay.status}
                            </p>
                            {pay.screenshot && (
                              <img
                                src={pay.screenshot}
                                alt="পেমেন্ট স্ক্রিনশট"
                                className="mt-2 w-36 h-24 object-cover rounded-lg border"
                              />
                            )}
                          </div>
                          {pay.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprovePayment(pay)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl"
                              >
                                অনুমোদন ({pay.days || settings.subscriptionDays} দিন)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectPayment(pay)}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-xl"
                              >
                                বাতিল
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {adminSubTab === "content" && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border space-y-2">
                      <h3 className="font-extrabold text-sm">কাজের বিজ্ঞাপন নিয়ন্ত্রণ ({jobs.length})</h3>
                      {jobs.map((j) => (
                        <div
                          key={j.id}
                          className="border rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <p className="font-bold">{j.title}</p>
                            <p className="text-slate-500">
                              {j.ownerName} ({j.contactPhone}) • {j.status}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteDoc(doc(db, "nirmanzone_jobs", j.id))}
                            className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg"
                          >
                            মুছে ফেলুন
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border space-y-2">
                      <h3 className="font-extrabold text-sm">
                        নির্মাণসামগ্রীর দোকান নিয়ন্ত্রণ ({shops.length})
                      </h3>
                      {shops.map((s) => (
                        <div
                          key={s.id}
                          className="border rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <p className="font-bold">{s.shopName}</p>
                            <p className="text-slate-500">
                              {s.ownerName} ({s.ownerPhone}) • {s.district}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteDoc(doc(db, "nirmanzone_shops", s.id))}
                            className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg"
                          >
                            মুছে ফেলুন
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border space-y-2">
                      <h3 className="font-extrabold text-sm">অভিযোগ ও রিপোর্ট ({reports.length})</h3>
                      {reports.map((r) => (
                        <div key={r.id} className="border rounded-xl p-3 text-xs space-y-1">
                          <p className="font-bold">
                            টার্গেট: {r.targetName} ({r.targetPhone || r.targetType})
                          </p>
                          <p className="text-slate-700">কারণ: {r.reason}</p>
                          <p className="text-slate-400">রিপোর্টার: {r.reporterPhone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminSubTab === "settings" && (
                  <form
                    onSubmit={handleSaveSettings}
                    className="bg-white p-4 rounded-2xl border space-y-3 max-w-lg"
                  >
                    <h3 className="font-extrabold text-sm">
                      বিকাশ/নগদ নম্বর, ফি, মেয়াদ ও অ্যাডমিন যোগাযোগ তথ্য
                    </h3>

                    <div>
                      <label className="block text-xs font-bold mb-1">বিকাশ নম্বর</label>
                      <input
                        type="tel"
                        value={editSettings.bkashNumber}
                        onChange={(e) =>
                          setEditSettings({ ...editSettings, bkashNumber: e.target.value })
                        }
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">নগদ নম্বর</label>
                      <input
                        type="tel"
                        value={editSettings.nagadNumber}
                        onChange={(e) =>
                          setEditSettings({ ...editSettings, nagadNumber: e.target.value })
                        }
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold mb-1">সদস্যপদ ফি (টাকা)</label>
                        <input
                          type="number"
                          value={editSettings.subscriptionFee}
                          onChange={(e) =>
                            setEditSettings({ ...editSettings, subscriptionFee: e.target.value })
                          }
                          className="w-full border rounded-xl px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">মেয়াদ (দিন)</label>
                        <input
                          type="number"
                          value={editSettings.subscriptionDays}
                          onChange={(e) =>
                            setEditSettings({ ...editSettings, subscriptionDays: e.target.value })
                          }
                          className="w-full border rounded-xl px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">অ্যাডমিন মোবাইল নম্বর</label>
                      <input
                        type="tel"
                        value={editSettings.adminPhone}
                        onChange={(e) =>
                          setEditSettings({ ...editSettings, adminPhone: e.target.value })
                        }
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">অ্যাডমিন যোগাযোগের তথ্য</label>
                      <input
                        type="text"
                        value={editSettings.adminEmailOrContact}
                        onChange={(e) =>
                          setEditSettings({
                            ...editSettings,
                            adminEmailOrContact: e.target.value,
                          })
                        }
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-sm"
                    >
                      সেটিংস সংরক্ষণ করুন
                    </button>
                  </form>
                )}

                {adminSubTab === "logs" && (
                  <div className="bg-white p-4 rounded-2xl border space-y-2">
                    <h3 className="font-extrabold text-sm">নিরাপত্তা ও কার্যক্রমের রেকর্ড (Audit Log)</h3>
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border-b pb-2 text-xs">
                        <p className="font-bold">
                          {log.action} • {log.actorPhone}
                        </p>
                        <p className="text-slate-600">{log.details}</p>
                        <p className="text-slate-400">
                          {new Date(log.createdAt).toLocaleString("bn-BD")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================== নতুন কাজের বিজ্ঞাপন মডাল ==================== */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateJob}
            className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-3 shadow-xl my-auto"
          >
            <h3 className="text-lg font-extrabold text-slate-900">নতুন কাজের বিজ্ঞাপন দিন</h3>

            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="কাজের শিরোনাম *"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={jobCategory}
                onChange={(e) => setJobCategory(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                {JOB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={jobProfessionNeeded}
                onChange={(e) => setJobProfessionNeeded(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                <option value="">প্রয়োজনীয় পেশা (ঐচ্ছিক)</option>
                {SERVICE_PROVIDER_PROFESSIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={3}
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="কাজের বিস্তারিত বিবরণ *"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={jobDivision}
                onChange={(e) => {
                  setJobDivision(e.target.value);
                  setJobDistrict("");
                  setJobUpazila("");
                }}
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
              >
                <option value="">বিভাগ *</option>
                {Object.keys(BANGLADESH_LOCATIONS).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={jobDistrict}
                onChange={(e) => {
                  setJobDistrict(e.target.value);
                  setJobUpazila("");
                }}
                disabled={!jobDivision}
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white disabled:bg-slate-100"
              >
                <option value="">জেলা *</option>
                {jobDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>

              <select
                value={jobUpazila}
                onChange={(e) => setJobUpazila(e.target.value)}
                disabled={!jobDistrict}
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white disabled:bg-slate-100"
              >
                <option value="">উপজেলা/থানা *</option>
                {jobUpazilas.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              value={jobAreaDetail}
              onChange={(e) => setJobAreaDetail(e.target.value)}
              placeholder="ইউনিয়ন/ওয়ার্ড ও গ্রাম/মহল্লার ঠিকানা"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={jobBudget}
                onChange={(e) => setJobBudget(e.target.value)}
                placeholder="সম্ভাব্য বাজেট (ঐচ্ছিক)"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                type="date"
                value={jobStartDate}
                onChange={(e) => setJobStartDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>

            <input
              type="tel"
              maxLength={11}
              value={jobContactPhone}
              onChange={(e) => setJobContactPhone(e.target.value)}
              placeholder="যোগাযোগের মোবাইল নম্বর *"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
            />

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                কাজের ছবি আপলোড (ঐচ্ছিক)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  try {
                    const url = await readFileAsDataUrl(e.target.files?.[0]);
                    setJobPhoto(url);
                  } catch (err) {
                    showToast(err.message, "error");
                  }
                }}
                className="text-xs w-full"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="flex-1 bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-sm"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={postingJob}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-sm"
              >
                {postingJob ? "প্রকাশ হচ্ছে..." : "বিজ্ঞাপন প্রকাশ করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== পেমেন্ট ও TrxID মডাল ==================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitPayment}
            className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 shadow-xl my-auto"
          >
            <h3 className="text-lg font-extrabold text-slate-900">
              সদস্যপদ পেমেন্ট ({settings.subscriptionFee} টাকা / {settings.subscriptionDays} দিন)
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod("bkash")}
                className={`py-2.5 rounded-xl text-sm font-extrabold border ${
                  payMethod === "bkash"
                    ? "bg-pink-600 text-white border-pink-600"
                    : "bg-pink-50 text-pink-800 border-pink-200"
                }`}
              >
                বিকাশ (bKash)
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("nagad")}
                className={`py-2.5 rounded-xl text-sm font-extrabold border ${
                  payMethod === "nagad"
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-orange-50 text-orange-800 border-orange-200"
                }`}
              >
                নগদ (Nagad)
              </button>
            </div>

            <div className="bg-slate-100 p-3.5 rounded-xl text-xs space-y-1">
              <p>
                ১. নিচের নম্বরে <strong>{settings.subscriptionFee} টাকা</strong> সেন্ড মানি করুন:
              </p>
              <p className="text-base font-mono font-extrabold text-slate-900">
                {payMethod === "nagad" ? settings.nagadNumber : settings.bkashNumber}
              </p>
              <p>২. পেমেন্টের পর Transaction ID (TrxID) ও প্রয়োজনে স্ক্রিনশট জমা দিন।</p>
         <div className="pt-1">
  {payMethod === "bkash" ? (
    <a
      href="intent://com.bKash.customerapp/#Intent;scheme=bKash;package=com.bKash.customerapp;end"
      className="inline-block text-xs font-bold text-pink-700 underline"
    >
      বিকাশ অ্যাপ খুলুন
    </a>
  ) : (
    <a
      href="intent://com.konasl.nagad/#Intent;scheme=nagad;package=com.konasl.nagad;end"
      className="inline-block text-xs font-bold text-orange-700 underline"
    >
      নগদ অ্যাপ খুলুন
    </a>
  )}
</div>
            </div>

            <input
  type="text"
  value={trxIdInput}
  onChange={(e) => setTrxIdInput(e.target.value)}
  placeholder="Transaction ID (TrxID) লিখুন *"
  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
/>
<input
  type="tel"
  value={senderPhoneInput}
  onChange={(e) => setSenderPhoneInput(e.target.value)}
  placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number) *"
  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm mb-2.5"
/>


            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  try {
                    const url = await readFileAsDataUrl(e.target.files?.[0]);
                    setPayScreenshot(url);
                  } catch (err) {
                    showToast(err.message, "error");
                  }
                }}
                className="text-xs w-full"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-sm"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-sm"
              >
                {submittingPayment ? "জমা হচ্ছে..." : "পেমেন্ট জমা দিন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== অভিযোগ / রিপোর্ট মডাল ==================== */}
      {reportTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReport}
            className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 shadow-xl"
          >
            <h3 className="text-base font-extrabold text-slate-900">
              রিপোর্ট করুন: {reportTarget.name}
            </h3>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="ভুয়া তথ্য, স্প্যাম বা সমস্যার কারণ লিখুন..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="flex-1 bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-sm"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submittingReport}
                className="flex-1 bg-rose-600 text-white font-extrabold py-2.5 rounded-xl text-sm"
              >
                {submittingReport ? "পাঠানো হচ্ছে..." : "রিপোর্ট পাঠান"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* নিচের মোবাইল নেভিগেশন বার */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 shadow-lg">
        <div className="max-w-5xl mx-auto grid grid-cols-5 text-center">
          {[
            ["home", "হোম"],
            ["jobs", "কাজ"],
            ["providers", "মিস্ত্রি"],
            ["shops", "দোকান"],
            ["profile", "অ্যাকাউন্ট"],
          ].map(([tabKey, label]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`py-3 text-xs font-extrabold transition ${
                activeTab === tabKey
                  ? "text-emerald-700 bg-emerald-50 border-t-2 border-emerald-700"
                  : "text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* অ্যাডমিন প্যানেলে যাওয়ার ছোট লিংক ফুটারে */}
      <footer className="max-w-5xl mx-auto px-4 mt-6 mb-4 text-center">
        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          className="text-[11px] text-slate-400 hover:text-slate-600 underline"
        >
          অ্যাডমিন প্যানেল
        </button>
      </footer>
    </div>
  );
}

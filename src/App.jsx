import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, onSnapshot, addDoc } from 'firebase/firestore';

// আপনার পার্সোনাল বিকাশ/নগদ নম্বর, অ্যাডমিন মোবাইল নম্বর এবং গোপন অ্যাডমিন পিন এখানে সেট করা আছে
const ADMIN_BKASH_NUMBER = "01944121530";
const ADMIN_NAGAD_NUMBER = "01944121530";
const ADMIN_LOGIN_NUMBER = "01944121530";
const ADMIN_SECRET_PIN = "2580"; // আপনার গোপন অ্যাডমিন পিন (চাইলে পরিবর্তন করতে পারেন)
const SAVED_MOBILE_KEY = "nirman_zone_logged_in_mobile";

// বাংলাদেশের বিভাগ, জেলা এবং থানা/উপজেলার তালিকা
const bangladeshLocations = {
  "ঢাকা": {
    "ঢাকা": ["ধানমন্ডি থানা", "মিরপুর থানা", "মোহাম্মদপুর থানা", "মতিঝিল থানা", "তেজগাঁও থানা", "অন্যান্য থানা"],
    "গাজীপুর": ["গাজীপুর সদর উপজেলা", "কালিয়াকৈর উপজেলা", "শ্রীপুর উপজেলা", "কাপাসিয়া উপজেলা", "কালীগঞ্জ উপজেলা", "অন্যান্য উপজেলা"],
    "নারায়ণগঞ্জ": ["নারায়ণগঞ্জ সদর উপজেলা", "রূপগঞ্জ উপজেলা", "আড়াইহাজার উপজেলা", "সোনারগাঁও উপজেলা", "বন্দর উপজেলা", "অন্যান্য উপজেলা"],
    "ফরিদপুর": ["ফরিদপুর সদর উপজেলা", "ভাঙা উপজেলা", "মধুখালী উপজেলা", "অন্যান্য উপজেলা"],
    "গোপালগঞ্জ": ["গোপালগঞ্জ সদর উপজেলা", "টুঙ্গিপাড়া উপজেলা", "মুকসুদপুর উপজেলা", "অন্যান্য উপজেলা"],
    "কিশোরগঞ্জ": ["কিশোরগঞ্জ সদর উপজেলা", "ভৈরব উপজেলা", "বাজিতপুর উপজেলা", "অন্যান্য উপজেলা"],
    "মাদারীপুর": ["মাদারীপুর সদর উপজেলা", "শিবচর উপজেলা", "রাজৈর উপজেলা", "অন্যান্য উপজেলা"],
    "মানিকগঞ্জ": ["মানিকগঞ্জ সদর উপজেলা", "সিংগাইর উপজেলা", "দৌলতপুর উপজেলা", "অন্যান্য উপজেলা"],
    "মুন্সীগঞ্জ": ["মুন্সীগঞ্জ সদর উপজেলা", "গজারিয়া উপজেলা", "লৌহজং উপজেলা", "অন্যান্য উপজেলা"],
    "নরসিংদী": ["নরসিংদী সদর উপজেলা", "পলাশ উপজেলা", "শিবপুর উপজেলা", "অন্যান্য উপজেলা"],
    "রাজবাড়ী": ["রাজবাড়ী সদর উপজেলা", "পাংশা উপজেলা", "কালুখালী উপজেলা", "অন্যান্য উপজেলা"],
    "শরীয়তপুর": ["শরীয়তপুর সদর উপজেলা", "নড়িয়া উপজেলা", "জাজিরা উপজেলা", "অন্যান্য উপজেলা"],
    "টাঙ্গাইল": ["টাঙ্গাইল সদর উপজেলা", "ঘাটাইল উপজেলা", "দেলদুয়ার উপজেলা", "অন্যান্য উপজেলা"]
  },
  "চট্টগ্রাম": {
    "চট্টগ্রাম": ["কোতোয়ালী থানা", "পাহাড়তলী থানা", "পাঁচলাইশ থানা", "হালিশহর থানা", "পটিয়া উপজেলা", "সীতাকুণ্ড উপজেলা", "অন্যান্য থানা/উপজেলা"],
    "কুমিল্লা": ["কুমিল্লা সদর দক্ষিণ উপজেলা", "চৌদ্দগ্রাম উপজেলা", "দাউদকান্দি উপজেলা", "বরুড়া উপজেলা", "বুড়িচং উপজেলা", "অন্যান্য উপজেলা"],
    "ফেনী": ["ফেনী সদর উপজেলা", "পরশুরাম উপজেলা", "ছাগলনাইয়া উপজেলা", "দাগনভূঞা উপজেলা", "ফুলগাজী উপজেলা", "অন্যান্য উপজেলা"],
    "কক্সবাজার": ["কক্সবাজার সদর উপজেলা", "উখিয়া উপজেলা", "টেকনাফ উপজেলা", "অন্যান্য উপজেলা"],
    "ব্রাহ্মণবাড়িয়া": ["ব্রাহ্মণবাড়িয়া সদর উপজেলা", "আখাউড়া উপজেলা", "কসবা উপজেলা", "অন্যান্য উপজেলা"],
    "চাঁদপুর": ["চাঁদপুর সদর উপজেলা", "মতলব উত্তর উপজেলা", "হাজীগঞ্জ উপজেলা", "অন্যান্য উপজেলা"],
    "নোয়াখালী": ["নোয়াখালী সদর উপজেলা", "হাতিয়া উপজেলা", "সেনবাগ উপজেলা", "অন্যান্য উপজেলা"],
    "রাঙ্গামাটি": ["রাঙ্গামাটি সদর উপজেলা", "কাপ্তাই উপজেলা", "কাউখালী উপজেলা", "অন্যান্য উপজেলা"],
    "বান্দরবান": ["বান্দরবান সদর উপজেলা", "রুমা উপজেলা", "থানচি উপজেলা", "অন্যান্য উপজেলা"],
    "খাগড়াছড়ি": ["খাগড়াছড়ি সদর উপজেলা", "দীঘিনালা উপজেলা", "মাটিরাঙ্গা উপজেলা", "অন্যান্য উপজেলা"]
  },
  "খুলনা": {
    "খুলনা": ["খুলনা সদর থানা", "বটিয়াঘাটা উপজেলা", "রূপসা উপজেলা", "দিঘলিয়া উপজেলা", "দাকোপ উপজেলা", "অন্যান্য থানা/উপজেলা"],
    "যশোর": ["যশোর সদর উপজেলা", "অভয়নগর উপজেলা", "ঝিকরগাছা উপজেলা", "মনিরামপুর উপজেলা", "কেশবপুর উপজেলা", "অন্যান্য উপজেলা"],
    "বাগেরহাট": ["বাগেরহাট সদর উপজেলা", "মোংলা উপজেলা", "চিতলমারী উপজেলা", "ফকিরহাট উপজেলা", "রামপাল উপজেলা", "অন্যান্য উপজেলা"],
    "সাতক্ষীরা": ["সাতক্ষীরা সদর উপজেলা", "কলারোয়া উপজেলা", "দেবহাটা উপজেলা", "অন্যান্য উপজেলা"],
    "কুষ্টিয়া": ["কুষ্টিয়া সদর উপজেলা", "ভেড়ামারা উপজেলা", "কুমারখালী উপজেলা", "অন্যান্য উপজেলা"],
    "ঝিনাইদহ": ["ঝিনাইদহ সদর উপজেলা", "শৈলকুপা উপজেলা", "কালীগঞ্জ উপজেলা", "অন্যান্য উপজেলা"],
    "মাগুরা": ["মাগুরা সদর উপজেলা", "শ্রীপুর উপজেলা", "শালিখা উপজেলা", "অন্যান্য উপজেলা"],
    "নড়াইল": ["নড়াইল সদর উপজেলা", "লোহাগড়া উপজেলা", "কালিয়া উপজেলা", "অন্যান্য উপজেলা"],
    "চুয়াডাঙ্গা": ["চুয়াডাঙ্গা সদর উপজেলা", "আলমডাঙ্গা উপজেলা", "দামুড়হুদা উপজেলা", "অন্যান্য উপজেলা"],
    "মেহেরপুর": ["মেহেরপুর সদর উপজেলা", "মুজিবনগর উপজেলা", "গাংনী উপজেলা", "অন্যান্য উপজেলা"]
  },
  "রাজশাহী": {
    "রাজশাহী": ["রাজশাহী সদর থানা", "বাঘা উপজেলা", "চারঘাট উপজেলা", "অন্যান্য থানা/উপজেলা"],
    "বগুড়া": ["বগুড়া সদর উপজেলা", "শেরপুর উপজেলা", "ধুনট উপজেলা", "অন্যান্য উপজেলা"],
    "জয়পুরহাট": ["জয়পুরহাট সদর উপজেলা", "পাঁচবিবি উপজেলা", "কালাই উপজেলা", "অন্যান্য উপজেলা"],
    "নওগাঁ": ["নওগাঁ সদর উপজেলা", "আত্রাই উপজেলা", "মান্দা উপজেলা", "অন্যান্য উপজেলা"],
    "নাটোর": ["নাটোর সদর উপজেলা", "লালপুর উপজেলা", "বড়াইগ্রাম উপজেলা", "অন্যান্য উপজেলা"],
    "চাঁপাইনবাবগঞ্জ": ["চাঁপাইনবাবগঞ্জ সদর উপজেলা", "শিবগঞ্জ উপজেলা", "গোমস্তাপুর উপজেলা", "অন্যান্য উপজেলা"],
    "পাবনা": ["পাবনা সদর উপজেলা", "ঈশ্বরদী উপজেলা", "সুজানগর উপজেলা", "অন্যান্য উপজেলা"],
    "সিরাজগঞ্জ": ["সিরাজগঞ্জ সদর উপজেলা", "শাহজাদপুর উপজেলা", "উল্লাপাড়া উপজেলা", "অন্যান্য উপজেলা"]
  },
  "সিলেট": {
    "সিলেট": ["সিলেট সদর উপজেলা", "গোলাপগঞ্জ উপজেলা", "ফেঞ্চুগঞ্জ উপজেলা", "অন্যান্য উপজেলা"],
    "মৌলভীবাজার": ["মৌলভীবাজার সদর উপজেলা", "কমলগঞ্জ উপজেলা", "কুলাউড়া উপজেলা", "অন্যান্য উপজেলা"],
    "সুনামগঞ্জ": ["সুনামগঞ্জ সদর উপজেলা", "ছাতক উপজেলা", "দিরাই উপজেলা", "অন্যান্য উপজেলা"],
    "হবিগঞ্জ": ["হবিগঞ্জ সদর উপজেলা", "নবীগঞ্জ উপজেলা", "বাহুবল উপজেলা", "অন্যান্য উপজেলা"]
  },
  "রংপুর": {
    "রংপুর": ["রংপুর সদর উপজেলা", "পীরগঞ্জ উপজেলা", "কাউনিয়া উপজেলা", "অন্যান্য উপজেলা"],
    "দিনাজপুর": ["দিনাজপুর সদর উপজেলা", "পার্বতীপুর উপজেলা", "খানসামা উপজেলা", "অন্যান্য উপজেলা"],
    "গাইবান্ধা": ["গাইবান্ধা সদর উপজেলা", "পলাশবাড়ী উপজেলা", "সাদুল্লাপুর উপজেলা", "অন্যান্য উপজেলা"],
    "কুড়িগ্রাম": ["কুড়িগ্রাম সদর উপজেলা", "উলিপুর উপজেলা", "চিলমারী উপজেলা", "অন্যান্য উপজেলা"],
    "লালমনিরহাট": ["লালমনিরহাট সদর উপজেলা", "আদিতমারী উপজেলা", "পাটগ্রাম উপজেলা", "অন্যান্য উপজেলা"],
    "নীলফামারী": ["নীলফামারী সদর উপজেলা", "ডোমার উপজেলা", "সৈয়দপুর উপজেলা", "অন্যান্য উপজেলা"],
    "পঞ্চগড়": ["পঞ্চগড় সদর উপজেলা", "দেবীগঞ্জ উপজেলা", "বোদা উপজেলা", "অন্যান্য উপজেলা"],
    "ঠাকুরগাঁও": ["ঠাকুরগাঁও সদর উপজেলা", "পীরগঞ্জ উপজেলা", "রানীশংকৈল উপজেলা", "অন্যান্য উপজেলা"]
  },
  "ময়মনসিংহ": {
    "ময়মনসিংহ": ["ময়মনসিংহ সদর উপজেলা", "মুক্তাগাছা উপজেলা", "ভালুকা উপজেলা", "অন্যান্য উপজেলা"],
    "জামালপুর": ["জামালপুর সদর উপজেলা", "দেওয়ানগঞ্জ উপজেলা", "ইসলামপুর উপজেলা", "অন্যান্য উপজেলা"],
    "নেত্রকোনা": ["নেত্রকোণা সদর উপজেলা", "দুর্গাপুর উপজেলা", "কলমাকান্দা উপজেলা", "অন্যান্য উপজেলা"],
    "শেরপুর": ["শেরপুর সদর উপজেলা", "নকলা উপজেলা", "শ্রীবরদী উপজেলা", "অন্যান্য উপজেলা"]
  },
  "বরিশাল": {
    "বরিশাল": ["বরিশাল সদর উপজেলা", "বাবুগঞ্জ উপজেলা", "উজিরপুর উপজেলা", "অন্যান্য উপজেলা"],
    "ভোলা": ["ভোলা সদর উপজেলা", "চরফ্যাশন উপজেলা", "দৌলতখান উপজেলা", "অন্যান্য উপজেলা"],
    "ঝালকাঠি": ["ঝালকাঠি সদর উপজেলা", "নলছিটি উপজেলা", "রাজাপুর উপজেলা", "অন্যান্য উপজেলা"],
    "পটুয়াখালী": ["পটুয়াখালী সদর উপজেলা", "বাউফল উপজেলা", "গলাচিপা উপজেলা", "অন্যান্য উপজেলা"],
    "পিরোজপুর": ["পিরোজপুর সদর উপজেলা", "ভান্ডারিয়া উপজেলা", "নেছারাবাদ উপজেলা", "অন্যান্য উপজেলা"],
    "বরগুনা": ["বরগুনা সদর উপজেলা", "পাথরঘাটা উপজেলা", "আমতলী উপজেলা", "অন্যান্য উপজেলা"]
  }
};

const PROFESSION_OPTIONS = [
  'রাজমিস্ত্রি', 'সেন্টারিং মিস্ত্রি', 'ইলেকট্রিক মিস্ত্রি', 'স্যানিটারি মিস্ত্রি', 'কাঠমিস্ত্রি',
  'গ্রিল মিস্ত্রি', 'থাই গ্লাস মিস্ত্রি', 'ডিপ টিউবল মিস্ত্রি', 'রংমিস্ত্রি', 'অন্যান্য মিস্ত্রি',
  'হেলপার', 'সিভিল ইঞ্জিনিয়ার', 'আর্কিটেক্ট',
  'কন্ট্রাক্টর', 'সাব-কন্ট্রাক্টর', 'নির্মাণ সামগ্রী বিক্রেতা'
];

const SHOP_CATEGORY_OPTIONS = [
  'সিমেন্ট বিক্রেতা', 'রড বিক্রেতা', 'বালু ও পাথর বিক্রেতা', 'ইট বিক্রেতা',
  'হার্ডওয়্যার ও ইলেকট্রিক সামগ্রী', 'পেইন্ট ও কেমিক্যাল', 'টাইলস ও স্যানিটারি',
  'কাঠ ও ফার্নিচার সামগ্রী', 'অন্যান্য নির্মাণ সামগ্রী'
];

// মূল অ্যাপ কম্পোনেন্ট
function App() {
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState('auth');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [enteredMobile, setEnteredMobile] = useState('');

  // আপনার Firebase প্রজেক্টের আসল কনফিগারেশন
  const defaultFirebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyB02LNjfuOva_WN3QMF9EZbSx01W8fxBz8",
    authDomain: "nirman-zone.firebaseapp.com",
    projectId: "nirman-zone",
    storageBucket: "nirman-zone.firebasestorage.app",
    messagingSenderId: "964321389020",
    appId: "1:964321389020:web:f12bb2884561e91b6bc719"
  };

  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'nirman-zone-prod';

  // নোটিফিকেশন মেসেজ ৫ সেকেন্ড পর লুকানো
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // মোবাইল নম্বর দিয়ে সংরক্ষিত প্রোফাইল খোঁজার ফাংশন
  const fetchProfileByMobile = useCallback(async (firestore, mobile, uid) => {
    const mobileDocRef = doc(firestore, `artifacts/${appId}/public/data/profiles_by_mobile`, mobile);
    const mobileDocSnap = await getDoc(mobileDocRef);
    if (mobileDocSnap.exists()) {
      return mobileDocSnap.data();
    }

    if (uid) {
      const legacyDocRef = doc(firestore, `artifacts/${appId}/users/${uid}/userProfile`, 'profile');
      const legacyDocSnap = await getDoc(legacyDocRef);
      if (legacyDocSnap.exists() && legacyDocSnap.data().contactNumber === mobile) {
        const legacyData = legacyDocSnap.data();
        await setDoc(mobileDocRef, legacyData);
        return legacyData;
      }
    }

    return null;
  }, [appId]);

  // Firebase ইনিশিয়ালাইজেশন ও অটো-লগইন
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        if (!defaultFirebaseConfig || defaultFirebaseConfig.apiKey === "YOUR_API_KEY") {
          setMessage("সতর্কতা: Firebase কনফিগারেশন যুক্ত করা হয়নি।");
          setLoading(false);
          return;
        }

        const app = initializeApp(defaultFirebaseConfig);
        const firestore = getFirestore(app);
        const authService = getAuth(app);
        setDb(firestore);

        if (initialAuthToken) {
          await signInWithCustomToken(authService, initialAuthToken);
        } else {
          await signInAnonymously(authService);
        }

        onAuthStateChanged(authService, async (user) => {
          if (user) {
            const currentUserId = user.uid;
            setUserId(currentUserId);

            const savedMobile = localStorage.getItem(SAVED_MOBILE_KEY);
            if (savedMobile && savedMobile.length === 11) {
              const existingProfile = await fetchProfileByMobile(firestore, savedMobile, currentUserId);
              if (existingProfile) {
                setUserProfile(existingProfile);
                setCurrentPage('dashboard');
                setLoading(false);
                return;
              }
            }

            const legacyDocRef = doc(firestore, `artifacts/${appId}/users/${currentUserId}/userProfile`, 'profile');
            const legacyDocSnap = await getDoc(legacyDocRef);
            if (legacyDocSnap.exists()) {
              const data = legacyDocSnap.data();
              if (data.contactNumber) {
                localStorage.setItem(SAVED_MOBILE_KEY, data.contactNumber);
                const mobileDocRef = doc(firestore, `artifacts/${appId}/public/data/profiles_by_mobile`, data.contactNumber);
                await setDoc(mobileDocRef, data, { merge: true });
              }
              setUserProfile(data);
              setCurrentPage('dashboard');
            } else {
              setCurrentPage('auth');
            }
          } else {
            setUserId(null);
            setUserProfile(null);
            setCurrentPage('auth');
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Firebase initialization failed:", error);
        setMessage(`Firebase শুরু করতে ব্যর্থ: ${error.message}`);
        setLoading(false);
      }
    };

    initializeFirebase();
  }, [initialAuthToken, appId, fetchProfileByMobile]);

  const handleLogout = () => {
    localStorage.removeItem(SAVED_MOBILE_KEY);
    setUserProfile(null);
    setEnteredMobile('');
    setCurrentPage('auth');
    setMessage("সফলভাবে লগআউট করা হয়েছে।");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center text-lg font-semibold text-gray-700">
          নির্মাণ জোন লোড হচ্ছে...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-3 sm:p-4 font-sans">
      {message && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto bg-blue-600 text-white p-3 rounded-xl shadow-lg z-50 text-center sm:text-left">
          {message}
        </div>
      )}

      {currentPage === 'auth' && (
        <AuthPage
          db={db}
          userId={userId}
          fetchProfileByMobile={fetchProfileByMobile}
          setUserProfile={setUserProfile}
          setCurrentPage={setCurrentPage}
          setMessage={setMessage}
          setEnteredMobile={setEnteredMobile}
        />
      )}

      {currentPage === 'profileCreation' && db && userId && (
        <ProfileCreationPage
          db={db}
          userId={userId}
          appId={appId}
          defaultMobile={enteredMobile}
          setUserProfile={setUserProfile}
          setCurrentPage={setCurrentPage}
          setMessage={setMessage}
        />
      )}

      {currentPage === 'dashboard' && db && userId && userProfile && (
        <DashboardPage
          db={db}
          userId={userId}
          appId={appId}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          handleLogout={handleLogout}
          setMessage={setMessage}
        />
      )}
    </div>
  );
}

// লগইন / নিবন্ধন পেজ
function AuthPage({ db, userId, fetchProfileByMobile, setUserProfile, setCurrentPage, setMessage, setEnteredMobile }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [checking, setChecking] = useState(false);

  const handleAuth = async () => {
    const cleanMobile = mobileNumber.trim();
    if (cleanMobile.length === 11 && cleanMobile.startsWith('01')) {
      setChecking(true);
      setEnteredMobile(cleanMobile);
      try {
        if (db) {
          const existingProfile = await fetchProfileByMobile(db, cleanMobile, userId);
          if (existingProfile) {
            localStorage.setItem(SAVED_MOBILE_KEY, cleanMobile);
            setUserProfile(existingProfile);
            setCurrentPage('dashboard');
            setMessage(`স্বাগতম, ${existingProfile.fullName}! আপনার সেভ করা প্রোফাইল খুলেছে।`);
            setChecking(false);
            return;
          }
        }
        setMessage("এই নম্বরে নতুন প্রোফাইল তৈরি করুন।");
        setCurrentPage('profileCreation');
      } catch (err) {
        setCurrentPage('profileCreation');
      } finally {
        setChecking(false);
      }
    } else {
      setMessage("অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
      <div className="text-center mb-6">
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">নির্মাণ সেবা প্ল্যাটফর্ম</span>
        <h2 className="text-3xl font-bold text-gray-800 mt-2">নির্মাণ জোন</h2>
        <p className="text-gray-600 mt-1 text-sm">মোবাইল নম্বর দিয়ে প্রবেশ করুন</p>
      </div>
      <div className="mb-6">
        <label htmlFor="mobileNumber" className="block text-gray-700 text-sm font-medium mb-2">
          মোবাইল নম্বর:
        </label>
        <input
          type="tel"
          id="mobileNumber"
          className="shadow-sm appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="যেমন: 017XXXXXXXX"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          maxLength="11"
        />
      </div>
      <button
        onClick={handleAuth}
        disabled={checking}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
      >
        {checking ? 'যাচাই হচ্ছে...' : 'প্রবেশ করুন / নিবন্ধন করুন'}
      </button>
    </div>
  );
}

// প্রোফাইল তৈরি পেজ
function ProfileCreationPage({ db, userId, appId, defaultMobile, setUserProfile, setCurrentPage, setMessage }) {
  const [userType, setUserType] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState(defaultMobile || '');

  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazilaThana, setUpazilaThana] = useState('');
  const [unionOrWardType, setUnionOrWardType] = useState('');
  const [unionOrWardName, setUnionOrWardName] = useState('');
  const [specificAreaName, setSpecificAreaName] = useState('');

  const [profession, setProfession] = useState('');
  const [experience, setExperience] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopName, setShopName] = useState('');
  const [projectType, setProjectType] = useState('');

  const [loadingSave, setLoadingSave] = useState(false);

  const handleSaveProfile = async () => {
    const cleanNumber = contactNumber.trim();
    if (!fullName || !userType || cleanNumber.length !== 11 || !division || !district || !upazilaThana || !unionOrWardType || !unionOrWardName || !specificAreaName || (userType === 'সেবাপ্রদানকারী' && !profession)) {
      setMessage("অনুগ্রহ করে সকল প্রয়োজনীয় ফিল্ড এবং ১১ ডিজিটের সঠিক নম্বর পূরণ করুন।");
      return;
    }
    if (userType === 'সেবাপ্রদানকারী' && profession === 'নির্মাণ সামগ্রী বিক্রেতা' && (!shopCategory || !shopName)) {
      setMessage("দোকানের নাম এবং ক্যাটাগরি পূরণ করা আবশ্যক।");
      return;
    }

    setLoadingSave(true);
    try {
      const profileData = {
        userId: userId,
        fullName: fullName.trim(),
        type: userType,
        contactNumber: cleanNumber,
        division: division,
        district: district,
        upazilaThana: upazilaThana,
        unionOrWardType: unionOrWardType,
        unionOrWardName: unionOrWardName,
        specificAreaName: specificAreaName.trim(),
        createdAt: new Date().toISOString(),
        lastPaymentDate: null,
        nextPaymentDueDate: null,
        paymentStatus: 'unpaid',
      };

      if (userType === 'সেবাপ্রদানকারী') {
        profileData.profession = profession;
        profileData.experience = experience;
        const now = new Date();
        profileData.nextPaymentDueDate = now.toISOString();

        if (profession === 'নির্মাণ সামগ্রী বিক্রেতা') {
          profileData.shopCategory = shopCategory;
          profileData.shopName = shopName;
        }
      } else {
        profileData.projectType = projectType;
      }

      const mobileDocRef = doc(db, `artifacts/${appId}/public/data/profiles_by_mobile`, cleanNumber);
      await setDoc(mobileDocRef, profileData);

      const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/userProfile`, 'profile');
      await setDoc(userDocRef, profileData);

      localStorage.setItem(SAVED_MOBILE_KEY, cleanNumber);

      setUserProfile(profileData);
      setCurrentPage('dashboard');
      setMessage("প্রোফাইল স্থায়ীভাবে সেভ হয়েছে!");
    } catch (error) {
      setMessage(`প্রোফাইল সেভ করতে ব্যর্থ: ${error.message}`);
    } finally {
      setLoadingSave(false);
    }
  };

  const divisions = Object.keys(bangladeshLocations);
  const districts = division ? Object.keys(bangladeshLocations[division]) : [];
  const upazilaThanas = district ? bangladeshLocations[division][district] : [];

  const getSimulatedAreaNames = (type) => {
    if (type === 'ইউনিয়ন') return ['ইউনিয়ন ১', 'ইউনিয়ন ২', 'ইউনিয়ন ৩', 'ইউনিয়ন ৪', 'ইউনিয়ন ৫'];
    if (type === 'ওয়ার্ড') return ['ওয়ার্ড ১', 'ওয়ার্ড ২', 'ওয়ার্ড ৩', 'ওয়ার্ড ৪', 'ওয়ার্ড ৫', 'ওয়ার্ড ৬', 'ওয়ার্ড ৭', 'ওয়ার্ড ৮', 'ওয়ার্ড ৯'];
    return [];
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 my-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">প্রোফাইল তৈরি করুন</h2>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-1">আপনার সম্পূর্ণ নাম:</label>
        <input
          type="text"
          className="border rounded-xl w-full py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="যেমন: মোঃ রফিক"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-1">আপনি কি হিসেবে যুক্ত হতে চান?</label>
        <select
          className="border rounded-xl w-full py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value);
            setProfession('');
          }}
        >
          <option value="">নির্বাচন করুন</option>
          <option value="সেবাপ্রার্থী">সেবাপ্রার্থী (মালিক / মহাজন - সম্পূর্ণ ফ্রি)</option>
          <option value="সেবাপ্রদানকারী">সেবাপ্রদানকারী (মিস্ত্রি/ইঞ্জিনিয়ার/দোকানদার - ৫০ টাকা / ৩ মাস)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-1">যোগাযোগের নম্বর:</label>
        <input
          type="tel"
          className="border rounded-xl w-full py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          maxLength="11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">বিভাগ:</label>
          <select
            className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
            value={division}
            onChange={(e) => { setDivision(e.target.value); setDistrict(''); setUpazilaThana(''); }}
          >
            <option value="">নির্বাচন করুন</option>
            {divisions.map((div) => <option key={div} value={div}>{div}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">জেলা:</label>
          <select
            className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
            value={district}
            onChange={(e) => { setDistrict(e.target.value); setUpazilaThana(''); }}
            disabled={!division}
          >
            <option value="">নির্বাচন করুন</option>
            {districts.map((dist) => <option key={dist} value={dist}>{dist}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-1">উপজেলা/থানা:</label>
        <select
          className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
          value={upazilaThana}
          onChange={(e) => { setUpazilaThana(e.target.value); setUnionOrWardType(''); }}
          disabled={!district}
        >
          <option value="">নির্বাচন করুন</option>
          {upazilaThanas.map((ut) => <option key={ut} value={ut}>{ut}</option>)}
        </select>
      </div>

      {upazilaThana && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">এলাকার ধরন:</label>
            <select
              className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
              value={unionOrWardType}
              onChange={(e) => { setUnionOrWardType(e.target.value); setUnionOrWardName(''); }}
            >
              <option value="">নির্বাচন করুন</option>
              <option value="ইউনিয়ন">ইউনিয়ন</option>
              <option value="ওয়ার্ড">ওয়ার্ড</option>
            </select>
          </div>

          {unionOrWardType && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">{unionOrWardType}-এর নাম:</label>
              <select
                className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
                value={unionOrWardName}
                onChange={(e) => setUnionOrWardName(e.target.value)}
              >
                <option value="">নির্বাচন করুন</option>
                {getSimulatedAreaNames(unionOrWardType).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {unionOrWardName && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">গ্রাম/মহল্লার নাম:</label>
          <input
            type="text"
            className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
            value={specificAreaName}
            onChange={(e) => setSpecificAreaName(e.target.value)}
            placeholder="যেমন: সোনাডাঙ্গা, খুলনা"
          />
        </div>
      )}

      {userType === 'সেবাপ্রদানকারী' && (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">পেশা:</label>
            <select
              className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            >
              <option value="">নির্বাচন করুন</option>
              {PROFESSION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          {profession === 'নির্মাণ সামগ্রী বিক্রেতা' ? (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">দোকানের নাম:</label>
                <input
                  type="text"
                  className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="যেমন: ভাই ভাই হার্ডওয়্যার"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-1">দোকানের ক্যাটাগরি:</label>
                <select
                  className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
                  value={shopCategory}
                  onChange={(e) => setShopCategory(e.target.value)}
                >
                  <option value="">নির্বাচন করুন</option>
                  {SHOP_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-1">কাজের অভিজ্ঞতা (সংক্ষেপে):</label>
              <textarea
                rows="2"
                className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="যেমন: ৫ বছরের রাজমিস্ত্রির কাজের অভিজ্ঞতা"
              ></textarea>
            </div>
          )}
        </>
      )}

      {userType === 'সেবাপ্রার্থী' && (
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-1">আপনার প্রজেক্টের ধরন:</label>
          <textarea
            rows="2"
            className="border rounded-xl w-full py-2.5 px-3 text-gray-700"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            placeholder="যেমন: নতুন বাড়ি নির্মাণ"
          ></textarea>
        </div>
      )}

      <button
        onClick={handleSaveProfile}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200"
        disabled={loadingSave}
      >
        {loadingSave ? 'সেভ হচ্ছে...' : 'প্রোফাইল সেভ করুন'}
      </button>
    </div>
  );
}

// ড্যাশবোর্ড পেজ
function DashboardPage({ db, userId, appId, userProfile, setUserProfile, handleLogout, setMessage }) {
  const [activeTab, setActiveTab] = useState('jobs');
  const [showJobPostModal, setShowJobPostModal] = useState(false);

  // অ্যাডমিন পিন লক স্টেট
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const isAdmin = userProfile.contactNumber === ADMIN_LOGIN_NUMBER;

  const isServiceProviderActive = useCallback(() => {
    if (userProfile.type === 'সেবাপ্রদানকারী') {
      if (!userProfile.nextPaymentDueDate) return false;
      const now = new Date();
      const dueDate = new Date(userProfile.nextPaymentDueDate);
      return now < dueDate;
    }
    return true;
  }, [userProfile]);

  useEffect(() => {
    if (!db || !userProfile?.contactNumber) return;
    const mobileDocRef = doc(db, `artifacts/${appId}/public/data/profiles_by_mobile`, userProfile.contactNumber);
    const unsubscribe = onSnapshot(mobileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [db, appId, userProfile?.contactNumber, setUserProfile]);

  const handleVerifyAdminPin = () => {
    if (pinInput.trim() === ADMIN_SECRET_PIN) {
      setAdminUnlocked(true);
      setPinInput('');
      setMessage("অ্যাডমিন প্যানেল আনলক হয়েছে!");
    } else {
      setMessage("ভুল পিন দিয়েছেন! সঠিক অ্যাডমিন পিন দিন।");
    }
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-xl w-full max-w-5xl border border-gray-200 flex flex-col">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6 border-b pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">স্বাগতম, {userProfile.fullName}!</h2>
          <p className="text-xs text-gray-500">
            {userProfile.type === 'সেবাপ্রার্থী' ? 'সেবাপ্রার্থী (মালিক / মহাজন - ফ্রি)' : userProfile.type}{' '}
            {userProfile.profession ? `(${userProfile.profession})` : ''}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-xl"
        >
          লগআউট
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 mb-6">
        <button
          className={`py-2 px-4 text-sm sm:text-base font-medium rounded-xl transition ${
            activeTab === 'jobs' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setActiveTab('jobs')}
        >
          {userProfile.type === 'সেবাপ্রদানকারী' ? 'কাজের তালিকা' : 'আমার পোস্টকৃত কাজ'}
        </button>

        {userProfile.type === 'সেবাপ্রার্থী' && (
          <button
            className={`py-2 px-4 text-sm sm:text-base font-medium rounded-xl transition ${
              activeTab === 'findProfessionals' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveTab('findProfessionals')}
          >
            মিস্ত্রি / সেবা খুঁজুন
          </button>
        )}

        <button
          className={`py-2 px-4 text-sm sm:text-base font-medium rounded-xl transition ${
            activeTab === 'myProfile' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setActiveTab('myProfile')}
        >
          {userProfile.type === 'সেবাপ্রার্থী' ? 'আমার প্রোফাইল (ফ্রি)' : 'আমার প্রোফাইল ও পেমেন্ট'}
        </button>

        {isAdmin && (
          <button
            className={`py-2 px-4 text-sm sm:text-base font-medium rounded-xl transition ${
              activeTab === 'adminPanel' ? 'bg-purple-600 text-white shadow' : 'bg-purple-100 text-purple-800'
            }`}
            onClick={() => setActiveTab('adminPanel')}
          >
            অ্যাডমিন প্যানেল {adminUnlocked ? '🔓' : '🔒'}
          </button>
        )}
      </div>

      <div className="flex-grow">
        {activeTab === 'jobs' && (
          userProfile.type === 'সেবাপ্রদানকারী' ? (
            <ServiceProviderJobFeed db={db} appId={appId} isServiceProviderActive={isServiceProviderActive} setActiveTab={setActiveTab} setMessage={setMessage} />
          ) : (
            <ServiceSeekerJobPosts db={db} userProfile={userProfile} appId={appId} setShowJobPostModal={setShowJobPostModal} setMessage={setMessage} />
          )
        )}

        {activeTab === 'findProfessionals' && userProfile.type === 'সেবাপ্রার্থী' && (
          <FindProfessionals db={db} appId={appId} setMessage={setMessage} />
        )}

        {activeTab === 'myProfile' && (
          <MyProfile
            db={db}
            userId={userId}
            appId={appId}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            isServiceProviderActive={isServiceProviderActive}
            setMessage={setMessage}
          />
        )}

        {activeTab === 'adminPanel' && isAdmin && (
          !adminUnlocked ? (
            <div className="max-w-sm mx-auto bg-purple-50 border border-purple-200 p-6 rounded-2xl text-center space-y-4 my-4">
              <div className="text-3xl">🔒</div>
              <h3 className="text-lg font-bold text-purple-900">অ্যাডমিন প্যানেল সুরক্ষিত</h3>
              <p className="text-xs text-gray-600">পেমেন্ট যাচাই ও অনুমোদন করতে আপনার গোপন পিন দিন:</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength="6"
                placeholder="গোপন পিন লিখুন"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full border rounded-xl py-2.5 px-4 text-center text-lg tracking-widest font-bold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleVerifyAdminPin}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition"
              >
                অ্যাডমিন প্যানেল খুলুন
              </button>
            </div>
          ) : (
            <AdminPanel db={db} appId={appId} setMessage={setMessage} onLock={() => setAdminUnlocked(false)} />
          )
        )}
      </div>

      {showJobPostModal && (
        <JobPostModal
          db={db}
          userId={userId}
          userProfile={userProfile}
          appId={appId}
          setShowJobPostModal={setShowJobPostModal}
          setMessage={setMessage}
        />
      )}
    </div>
  );
}

// অ্যাডমিন প্যানেল
function AdminPanel({ db, appId, setMessage, onLock }) {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, `artifacts/${appId}/public/data/payment_requests`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      reqs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setPaymentRequests(reqs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db, appId]);

  const handleApprovePayment = async (req) => {
    try {
      const now = new Date();
      const nextDueDate = new Date(now.setMonth(now.getMonth() + 3)).toISOString();

      const targetMobile = req.contactNumber || req.senderBkashNumber;
      if (targetMobile) {
        const mobileDocRef = doc(db, `artifacts/${appId}/public/data/profiles_by_mobile`, targetMobile);
        await setDoc(mobileDocRef, {
          lastPaymentDate: new Date().toISOString(),
          nextPaymentDueDate: nextDueDate,
          paymentStatus: 'approved'
        }, { merge: true });
      }

      if (req.userId) {
        try {
          const userDocRef = doc(db, `artifacts/${appId}/users/${req.userId}/userProfile`, 'profile');
          await updateDoc(userDocRef, {
            lastPaymentDate: new Date().toISOString(),
            nextPaymentDueDate: nextDueDate,
            paymentStatus: 'approved'
          });
        } catch (e) {
          // পুরনো ডকুমেন্ট না থাকলে সমস্যা নেই
        }
      }

      const reqDocRef = doc(db, `artifacts/${appId}/public/data/payment_requests`, req.id);
      await updateDoc(reqDocRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      setMessage(`${req.fullName}-এর অ্যাকাউন্ট ৩ মাসের জন্য স্থায়ীভাবে অ্যাক্টিভ করা হয়েছে!`);
    } catch (error) {
      setMessage(`অনুমোদন ব্যর্থ: ${error.message}`);
    }
  };

  if (loading) return <div className="text-center py-6">পেমেন্ট রিকোয়েস্ট লোড হচ্ছে...</div>;

  return (
    <div className="p-2">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-purple-800">বিকাশ ও নগদ পেমেন্ট রিকোয়েস্টসমূহ (৫০ টাকা)</h3>
        {onLock && (
          <button
            onClick={onLock}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold py-1.5 px-3 rounded-xl"
          >
            🔒 লক করুন
          </button>
        )}
      </div>

      {paymentRequests.length === 0 ? (
        <p className="text-gray-600">এখনো কোনো পেমেন্ট রিকোয়েস্ট আসেনি।</p>
      ) : (
        <div className="space-y-4">
          {paymentRequests.map(req => {
            const methodLabel = req.paymentMethod === 'nagad' ? 'নগদ (Nagad)' : 'বিকাশ (bKash)';
            const badgeColor = req.paymentMethod === 'nagad' ? 'bg-orange-100 text-orange-800' : 'bg-pink-100 text-pink-800';
            return (
              <div key={req.id} className="border p-4 rounded-xl bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800">{req.fullName} ({req.profession})</p>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                      {methodLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">প্রোফাইল নম্বর: <span className="font-mono font-bold text-gray-800">{req.contactNumber || req.senderBkashNumber}</span></p>
                  <p className="text-sm text-gray-600">যে নম্বর থেকে টাকা পাঠিয়েছে: <span className="font-mono font-bold text-pink-600">{req.senderBkashNumber}</span></p>
                  <p className="text-sm text-gray-600">TrxID: <span className="font-mono font-bold text-blue-700">{req.trxId}</span> | পরিমাণ: ৫০ টাকা</p>
                  <p className="text-xs text-gray-400">সময়: {new Date(req.submittedAt).toLocaleString('bn-BD')}</p>
                </div>
                <div>
                  {req.status === 'pending' ? (
                    <button
                      onClick={() => handleApprovePayment(req)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-sm"
                    >
                      Approve (৩ মাস অ্যাক্টিভ করুন)
                    </button>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                      অনুমোদিত (Active)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// সেবাপ্রার্থীর পোস্ট করা কাজ (কাজ মুছে ফেলার বাটনসহ)
function ServiceSeekerJobPosts({ db, userProfile, appId, setShowJobPostModal, setMessage }) {
  const [myJobPosts, setMyJobPosts] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!db || !userProfile) return;
    const q = query(collection(db, `artifacts/${appId}/public/data/job_posts`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyJobPosts(posts.filter(post => post.postedByMobile === userProfile.contactNumber || post.postedByUserId === userProfile.userId));
      setLoadingJobs(false);
    });
    return () => unsubscribe();
  }, [db, userProfile, appId]);

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/job_posts`, jobId));
      setConfirmDeleteId(null);
      setMessage("কাজের পোস্টটি সফলভাবে মুছে ফেলা হয়েছে!");
    } catch (error) {
      setMessage(`পোস্ট মুছতে ব্যর্থ: ${error.message}`);
    }
  };

  if (loadingJobs) return <div className="text-center text-gray-600">লোড হচ্ছে...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">আপনার পোস্ট করা কাজ</h3>
        <button
          onClick={() => setShowJobPostModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-sm"
        >
          + নতুন কাজের পোস্ট
        </button>
      </div>
      {myJobPosts.length === 0 ? (
        <p className="text-gray-600 text-center py-10">আপনি এখনো কোনো কাজের পোস্ট করেননি।</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myJobPosts.map(job => (
            <div key={job.id} className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-blue-800 mb-1">{job.title}</h4>
                <p className="text-gray-700 text-sm mb-2">{job.description}</p>
                <p className="text-gray-600 text-xs">প্রয়োজনীয় পেশা: <span className="font-semibold">{job.requiredProfession}</span></p>
                <p className="text-gray-600 text-xs">অবস্থান: {job.specificAreaName}, {job.upazilaThana}, {job.district}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between gap-2">
                {confirmDeleteId === job.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-xs text-red-700 font-semibold">নিশ্চিত মুছবেন?</span>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
                    >
                      হ্যাঁ, মুছুন
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="bg-gray-300 text-gray-800 text-xs font-bold py-1.5 px-3 rounded-lg"
                    >
                      না
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(job.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-1.5 px-3 rounded-lg transition"
                  >
                    🗑️ কাজ সম্পন্ন / পোস্ট মুছুন
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// সেবাপ্রদানকারীর কাজের তালিকা (সরাসরি কল করুন বাটনসহ)
function ServiceProviderJobFeed({ db, appId, isServiceProviderActive, setActiveTab }) {
  const [jobPosts, setJobPosts] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [filterProfession, setFilterProfession] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, `artifacts/${appId}/public/data/job_posts`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobPosts(posts);
      setLoadingJobs(false);
    });
    return () => unsubscribe();
  }, [db, appId]);

  const active = isServiceProviderActive();

  const filteredJobPosts = jobPosts.filter(job => {
    const matchesProfession = filterProfession === '' || job.requiredProfession === filterProfession;
    const matchesDistrict = filterDistrict === '' || job.district.includes(filterDistrict);
    return matchesProfession && matchesDistrict;
  });

  if (loadingJobs) return <div className="text-center text-gray-600">কাজের পোস্ট লোড হচ্ছে...</div>;

  return (
    <div>
      {!active && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="font-bold">আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় (Disconnected)!</p>
            <p className="text-sm">কাজের যোগাযোগ নম্বর দেখতে এবং প্রোফাইল সচল রাখতে মাত্র ৫০ টাকা বিকাশ বা নগদে পাঠিয়ে ৩ মাসের জন্য অ্যাক্টিভ করুন।</p>
          </div>
          <button
            onClick={() => setActiveTab('myProfile')}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-xl text-sm whitespace-nowrap"
          >
            বিকাশ / নগদে ৫০ টাকা দিন
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <select
          value={filterProfession}
          onChange={(e) => setFilterProfession(e.target.value)}
          className="p-2.5 border rounded-xl text-sm"
        >
          <option value="">সকল পেশার কাজ</option>
          {PROFESSION_OPTIONS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="জেলার নাম লিখে খুঁজুন (যেমন: খুলনা)"
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          className="p-2.5 border rounded-xl text-sm"
        />
      </div>

      {filteredJobPosts.length === 0 ? (
        <p className="text-gray-600 text-center py-10">এই মুহূর্তে কোনো কাজ উপলব্ধ নেই।</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobPosts.map(job => (
            <div key={job.id} className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-blue-800 mb-1">{job.title}</h4>
                <p className="text-gray-700 text-sm mb-2">{job.description}</p>
                <p className="text-gray-600 text-xs">পেশা: <span className="font-semibold">{job.requiredProfession}</span></p>
                <p className="text-gray-600 text-xs">স্থান: {job.specificAreaName}, {job.upazilaThana}, {job.district}</p>
              </div>

              {active ? (
                <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between gap-2">
                  <span className="text-green-800 text-sm font-bold font-mono">{job.contactNumber}</span>
                  <a
                    href={`tel:${job.contactNumber}`}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-sm transition inline-flex items-center gap-1"
                  >
                    📞 কল করুন
                  </a>
                </div>
              ) : (
                <div className="mt-3 bg-gray-200 p-2 rounded-lg text-center">
                  <span className="text-xs font-bold text-red-600">নম্বর দেখতে ৫০ টাকা দিয়ে অ্যাকাউন্ট অ্যাক্টিভ করুন</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// মিস্ত্রি / সেবা খোঁজার পেজ (সরাসরি কল করুন বাটনসহ)
function FindProfessionals({ db, appId }) {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProfession, setFilterProfession] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  useEffect(() => {
    if (!db) return;
    const profilesColRef = collection(db, `artifacts/${appId}/public/data/profiles_by_mobile`);
    const unsubscribe = onSnapshot(profilesColRef, (snapshot) => {
      const fetched = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.type === 'সেবাপ্রদানকারী');
      setProfessionals(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db, appId]);

  const now = new Date();
  const activeProfessionals = professionals.filter(p => {
    const isActive = p.nextPaymentDueDate && now < new Date(p.nextPaymentDueDate);
    const matchesProf = filterProfession === '' || p.profession === filterProfession;
    const matchesDist = filterDistrict === '' || (p.district && p.district.includes(filterDistrict));
    return isActive && matchesProf && matchesDist;
  });

  if (loading) return <div className="text-center text-gray-600">তথ্য লোড হচ্ছে...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <select
          value={filterProfession}
          onChange={(e) => setFilterProfession(e.target.value)}
          className="p-2.5 border rounded-xl text-sm"
        >
          <option value="">সকল সক্রিয় পেশাজীবী</option>
          {PROFESSION_OPTIONS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="জেলার নাম লিখে খুঁজুন (যেমন: খুলনা)"
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          className="p-2.5 border rounded-xl text-sm"
        />
      </div>

      {activeProfessionals.length === 0 ? (
        <p className="text-gray-600 text-center py-10">এই মুহূর্তে কোনো সক্রিয় সেবাপ্রদানকারী পাওয়া যায়নি।</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProfessionals.map(prof => (
            <div key={prof.id} className="bg-green-50 p-5 rounded-xl border border-green-100 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-green-800">{prof.fullName}</h4>
                <p className="text-sm font-semibold text-gray-700">পেশা: {prof.profession}</p>
                {prof.profession === 'নির্মাণ সামগ্রী বিক্রেতা' ? (
                  <p className="text-xs text-gray-600 mt-1">দোকান: {prof.shopName} ({prof.shopCategory})</p>
                ) : (
                  <p className="text-xs text-gray-600 mt-1">অভিজ্ঞতা: {prof.experience || 'উল্লেখ নেই'}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">ঠিকানা: {prof.specificAreaName}, {prof.upazilaThana}, {prof.district}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-green-200 flex items-center justify-between gap-2">
                <span className="text-blue-800 text-sm font-bold font-mono">{prof.contactNumber}</span>
                <a
                  href={`tel:${prof.contactNumber}`}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-sm transition inline-flex items-center gap-1"
                >
                  📞 কল করুন
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// নিজের প্রোফাইল, প্রোফাইল এডিট ও বিকাশ/নগদ পেমেন্ট
function MyProfile({ db, userId, appId, userProfile, setUserProfile, isServiceProviderActive, setMessage }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // প্রোফাইল এডিট স্টেট
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.fullName || '');
  const [editDivision, setEditDivision] = useState(userProfile.division || '');
  const [editDistrict, setEditDistrict] = useState(userProfile.district || '');
  const [editUpazila, setEditUpazila] = useState(userProfile.upazilaThana || '');
  const [editArea, setEditArea] = useState(userProfile.specificAreaName || '');
  const [editProfession, setEditProfession] = useState(userProfile.profession || '');
  const [editExperience, setEditExperience] = useState(userProfile.experience || '');
  const [editShopName, setEditShopName] = useState(userProfile.shopName || '');
  const [editShopCategory, setEditShopCategory] = useState(userProfile.shopCategory || '');
  const [editProjectType, setEditProjectType] = useState(userProfile.projectType || '');
  const [savingEdit, setSavingEdit] = useState(false);

  const FEE_AMOUNT = 50;

  const calculateDaysRemaining = (dueDateISO) => {
    if (!dueDateISO) return 0;
    const dueDate = new Date(dueDateISO);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleOpenEdit = () => {
    setEditName(userProfile.fullName || '');
    setEditDivision(userProfile.division || '');
    setEditDistrict(userProfile.district || '');
    setEditUpazila(userProfile.upazilaThana || '');
    setEditArea(userProfile.specificAreaName || '');
    setEditProfession(userProfile.profession || '');
    setEditExperience(userProfile.experience || '');
    setEditShopName(userProfile.shopName || '');
    setEditShopCategory(userProfile.shopCategory || '');
    setEditProjectType(userProfile.projectType || '');
    setIsEditing(true);
  };

  const handleSaveProfileEdit = async () => {
    if (!editName.trim() || !editDivision || !editDistrict || !editUpazila || !editArea.trim()) {
      setMessage("নাম এবং ঠিকানার সকল ঘর পূরণ করুন।");
      return;
    }

    setSavingEdit(true);
    try {
      const updatedFields = {
        fullName: editName.trim(),
        division: editDivision,
        district: editDistrict,
        upazilaThana: editUpazila,
        specificAreaName: editArea.trim(),
      };

      if (userProfile.type === 'সেবাপ্রদানকারী') {
        if (editProfession) updatedFields.profession = editProfession;
        if (editProfession === 'নির্মাণ সামগ্রী বিক্রেতা') {
          updatedFields.shopName = editShopName.trim();
          updatedFields.shopCategory = editShopCategory;
        } else {
          updatedFields.experience = editExperience.trim();
        }
      } else {
        updatedFields.projectType = editProjectType.trim();
      }

      const mobileDocRef = doc(db, `artifacts/${appId}/public/data/profiles_by_mobile`, userProfile.contactNumber);
      await setDoc(mobileDocRef, updatedFields, { merge: true });

      setUserProfile(prev => ({ ...prev, ...updatedFields }));
      setIsEditing(false);
      setMessage("আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে!");
    } catch (error) {
      setMessage(`আপডেট ব্যর্থ: ${error.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSubmitPaymentInfo = async () => {
    const methodTitle = paymentMethod === 'nagad' ? 'নগদ' : 'বিকাশ';
    if (senderNumber.length !== 11 || !trxId.trim()) {
      setMessage(`অনুগ্রহ করে সঠিক ১১ ডিজিটের ${methodTitle} নম্বর এবং ট্রানজেকশন আইডি (TrxID) দিন।`);
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/payment_requests`), {
        userId: userId,
        contactNumber: userProfile.contactNumber,
        fullName: userProfile.fullName,
        profession: userProfile.profession,
        amount: FEE_AMOUNT,
        paymentMethod: paymentMethod,
        senderBkashNumber: senderNumber.trim(),
        trxId: trxId.trim().toUpperCase(),
        status: 'pending',
        submittedAt: new Date().toISOString()
      });

      const mobileDocRef = doc(db, `artifacts/${appId}/public/data/profiles_by_mobile`, userProfile.contactNumber);
      await setDoc(mobileDocRef, {
        paymentStatus: 'pending'
      }, { merge: true });

      setUserProfile(prev => ({ ...prev, paymentStatus: 'pending' }));
      setMessage(`আপনার ${methodTitle} পেমেন্টের তথ্য জমা হয়েছে! যাচাইয়ের পর ৩ মাসের জন্য অ্যাকাউন্ট চালু হয়ে যাবে।`);
      setShowPaymentModal(false);
      setSenderNumber('');
      setTrxId('');
    } catch (error) {
      setMessage(`তথ্য জমা দিতে ব্যর্থ: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const daysRemaining = userProfile.type === 'সেবাপ্রদানকারী' ? calculateDaysRemaining(userProfile.nextPaymentDueDate) : null;
  const active = isServiceProviderActive();
  const targetWalletNumber = paymentMethod === 'nagad' ? ADMIN_NAGAD_NUMBER : ADMIN_BKASH_NUMBER;

  const editDivisions = Object.keys(bangladeshLocations);
  const editDistricts = editDivision && bangladeshLocations[editDivision] ? Object.keys(bangladeshLocations[editDivision]) : [];
  const editUpazilas = editDivision && editDistrict && bangladeshLocations[editDivision]?.[editDistrict] ? bangladeshLocations[editDivision][editDistrict] : [];

  return (
    <div>
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6 space-y-2 text-sm sm:text-base">
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <h3 className="font-bold text-gray-800 text-base sm:text-lg">ব্যক্তিগত তথ্য</h3>
          {!isEditing && (
            <button
              onClick={handleOpenEdit}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold py-1.5 px-3.5 rounded-xl transition"
            >
              ✏️ প্রোফাইল এডিট করুন
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">সম্পূর্ণ নাম:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border rounded-xl w-full py-2 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">বিভাগ:</label>
                <select
                  value={editDivision}
                  onChange={(e) => { setEditDivision(e.target.value); setEditDistrict(''); setEditUpazila(''); }}
                  className="border rounded-xl w-full py-2 px-3 text-sm"
                >
                  <option value="">নির্বাচন করুন</option>
                  {editDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">জেলা:</label>
                <select
                  value={editDistrict}
                  onChange={(e) => { setEditDistrict(e.target.value); setEditUpazila(''); }}
                  className="border rounded-xl w-full py-2 px-3 text-sm"
                  disabled={!editDivision}
                >
                  <option value="">নির্বাচন করুন</option>
                  {editDistricts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">উপজেলা/থানা:</label>
              <select
                value={editUpazila}
                onChange={(e) => setEditUpazila(e.target.value)}
                className="border rounded-xl w-full py-2 px-3 text-sm"
                disabled={!editDistrict}
              >
                <option value="">নির্বাচন করুন</option>
                {editUpazilas.map(ut => <option key={ut} value={ut}>{ut}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">গ্রাম/মহল্লার নাম:</label>
              <input
                type="text"
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                className="border rounded-xl w-full py-2 px-3 text-sm"
              />
            </div>

            {userProfile.type === 'সেবাপ্রদানকারী' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">পেশা:</label>
                  <select
                    value={editProfession}
                    onChange={(e) => setEditProfession(e.target.value)}
                    className="border rounded-xl w-full py-2 px-3 text-sm"
                  >
                    {PROFESSION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {editProfession === 'নির্মাণ সামগ্রী বিক্রেতা' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">দোকানের নাম:</label>
                      <input
                        type="text"
                        value={editShopName}
                        onChange={(e) => setEditShopName(e.target.value)}
                        className="border rounded-xl w-full py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">দোকানের ক্যাটাগরি:</label>
                      <select
                        value={editShopCategory}
                        onChange={(e) => setEditShopCategory(e.target.value)}
                        className="border rounded-xl w-full py-2 px-3 text-sm"
                      >
                        <option value="">নির্বাচন করুন</option>
                        {SHOP_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">কাজের অভিজ্ঞতা:</label>
                    <input
                      type="text"
                      value={editExperience}
                      onChange={(e) => setEditExperience(e.target.value)}
                      className="border rounded-xl w-full py-2 px-3 text-sm"
                    />
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">প্রজেক্টের ধরন:</label>
                <input
                  type="text"
                  value={editProjectType}
                  onChange={(e) => setEditProjectType(e.target.value)}
                  className="border rounded-xl w-full py-2 px-3 text-sm"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-xl text-xs"
                disabled={savingEdit}
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveProfileEdit}
                className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs"
                disabled={savingEdit}
              >
                {savingEdit ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p><strong className="text-blue-700">নাম:</strong> {userProfile.fullName}</p>
            <p>
              <strong className="text-blue-700">ধরন:</strong>{' '}
              {userProfile.type === 'সেবাপ্রার্থী' ? 'সেবাপ্রার্থী (মালিক / মহাজন)' : userProfile.type}
            </p>
            <p><strong className="text-blue-700">মোবাইল:</strong> {userProfile.contactNumber}</p>
            <p><strong className="text-blue-700">ঠিকানা:</strong> {userProfile.specificAreaName}, {userProfile.unionOrWardName ? `${userProfile.unionOrWardName}, ` : ''}{userProfile.upazilaThana}, {userProfile.district}, {userProfile.division}</p>

            {userProfile.type === 'সেবাপ্রার্থী' && (
              <div className="pt-3 border-t mt-3 space-y-2">
                {userProfile.projectType && <p><strong className="text-blue-700">প্রজেক্টের ধরন:</strong> {userProfile.projectType}</p>}
                <span className="inline-block bg-green-100 text-green-800 font-bold px-3 py-1.5 rounded-full text-xs">
                  মালিক / মহাজন অ্যাকাউন্ট: সম্পূর্ণ ফ্রি (কোনো ফি প্রযোজ্য নয়)
                </span>
              </div>
            )}

            {userProfile.type === 'সেবাপ্রদানকারী' && (
              <div className="pt-3 border-t mt-3 space-y-2">
                <p><strong className="text-blue-700">পেশা:</strong> {userProfile.profession}</p>
                {userProfile.profession === 'নির্মাণ সামগ্রী বিক্রেতা' ? (
                  <p><strong className="text-blue-700">দোকান:</strong> {userProfile.shopName} ({userProfile.shopCategory})</p>
                ) : (
                  userProfile.experience && <p><strong className="text-blue-700">অভিজ্ঞতা:</strong> {userProfile.experience}</p>
                )}
                <p>
                  <strong className="text-blue-700">অ্যাকাউন্ট স্ট্যাটাস:</strong>{' '}
                  {active ? (
                    <span className="bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full text-xs">
                      সক্রিয় (Active) - বাকি {daysRemaining} দিন
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full text-xs">
                      সংযোগ বিচ্ছিন্ন (Disconnected)
                    </span>
                  )}
                </p>
                {userProfile.nextPaymentDueDate && active && (
                  <p className="text-xs text-gray-500">
                    মেয়াদ শেষ হবে: {new Date(userProfile.nextPaymentDueDate).toLocaleDateString('bn-BD')} (এরপর অটোমেটিক ডিসকানেক্ট হয়ে যাবে)
                  </p>
                )}

                {userProfile.paymentStatus === 'pending' && !active && (
                  <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-3 rounded-xl text-sm mt-2">
                    আপনার ৫০ টাকা পেমেন্টের তথ্য যাচাই করা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।
                  </div>
                )}

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="mt-4 w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow transition"
                >
                  {active ? 'মেয়াদ বাড়ান (বিকাশ / নগদ - ৫০ টাকা)' : 'বিকাশ বা নগদে ৫০ টাকা দিয়ে অ্যাক্টিভ করুন'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
            <div className="text-center mb-4">
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                bKash / Nagad Send Money
              </span>
              <h3 className="text-xl font-bold text-gray-800 mt-2">৩ মাসের সাবস্ক্রিপশন ফি: ৫০ টাকা</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`py-2.5 px-3 rounded-xl font-bold text-sm border transition ${
                  paymentMethod === 'bkash'
                    ? 'bg-pink-600 text-white border-pink-600 shadow'
                    : 'bg-pink-50 text-pink-700 border-pink-200'
                }`}
              >
                বিকাশ (bKash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`py-2.5 px-3 rounded-xl font-bold text-sm border transition ${
                  paymentMethod === 'nagad'
                    ? 'bg-orange-600 text-white border-orange-600 shadow'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}
              >
                নগদ (Nagad)
              </button>
            </div>

            <div className={`p-4 rounded-xl border text-sm text-gray-700 space-y-2 mb-4 ${
              paymentMethod === 'nagad' ? 'bg-orange-50 border-orange-200' : 'bg-pink-50 border-pink-200'
            }`}>
              <p>
                ১. আপনার <strong>{paymentMethod === 'nagad' ? 'নগদ (Nagad)' : 'বিকাশ (bKash)'}</strong> অ্যাপ থেকে নিচের পার্সোনাল নম্বরে <strong>৫০ টাকা (Send Money)</strong> করুন:
              </p>
              <p className={`text-center text-lg font-mono font-bold bg-white py-2 rounded-lg border ${
                paymentMethod === 'nagad' ? 'text-orange-700' : 'text-pink-700'
              }`}>
                {targetWalletNumber}
              </p>
              <p>২. টাকা পাঠানোর পর ফিরতি মেসেজ থেকে <strong>Transaction ID (TrxID)</strong> কপি করে নিচে বসান।</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-1">
                  যে {paymentMethod === 'nagad' ? 'নগদ' : 'বিকাশ'} নম্বর থেকে টাকা পাঠিয়েছেন:
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  maxLength="11"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="border rounded-xl w-full py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-1">
                  {paymentMethod === 'nagad' ? 'নগদ' : 'বিকাশ'} ট্রানজেকশন আইডি (TrxID):
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 9H7G6F5D4S"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="border rounded-xl w-full py-2.5 px-3 text-gray-700 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2.5 rounded-xl"
                disabled={submitting}
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmitPaymentInfo}
                className={`w-1/2 text-white font-bold py-2.5 rounded-xl ${
                  paymentMethod === 'nagad' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-pink-600 hover:bg-pink-700'
                }`}
                disabled={submitting}
              >
                {submitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// নতুন কাজের পোস্ট মডাল
function JobPostModal({ db, userId, userProfile, appId, setShowJobPostModal, setMessage }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredProfession, setRequiredProfession] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazilaThana, setUpazilaThana] = useState('');
  const [specificAreaName, setSpecificAreaName] = useState('');
  const [contactNumber, setContactNumber] = useState(userProfile?.contactNumber || '');
  const [loadingPost, setLoadingPost] = useState(false);

  const divisionsList = Object.keys(bangladeshLocations);
  const districtsList = division ? Object.keys(bangladeshLocations[division]) : [];
  const upazilaThanasList = district ? bangladeshLocations[division][district] : [];

  const handleSubmit = async () => {
    if (!title || !description || !requiredProfession || !division || !district || !upazilaThana || !specificAreaName || !contactNumber) {
      setMessage("অনুগ্রহ করে সকল ফিল্ড পূরণ করুন।");
      return;
    }
    setLoadingPost(true);
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/job_posts`), {
        title,
        description,
        requiredProfession,
        division,
        district,
        upazilaThana,
        specificAreaName,
        contactNumber,
        postedByUserId: userId,
        postedByMobile: userProfile?.contactNumber || contactNumber,
        postedAt: new Date().toISOString(),
      });
      setMessage("কাজের পোস্ট সফলভাবে করা হয়েছে!");
      setShowJobPostModal(false);
    } catch (error) {
      setMessage(`কাজের পোস্ট করতে ব্যর্থ: ${error.message}`);
    } finally {
      setLoadingPost(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 my-auto">
        <h3 className="text-xl font-bold text-center text-gray-800 mb-4">নতুন কাজের পোস্ট করুন</h3>

        <div className="space-y-3 mb-5">
          <input
            type="text"
            className="border rounded-xl w-full py-2.5 px-3 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="কাজের শিরোনাম (যেমন: ছাদ ঢালাইয়ের মিস্ত্রি চাই)"
          />
          <select
            className="border rounded-xl w-full py-2.5 px-3 text-sm"
            value={requiredProfession}
            onChange={(e) => setRequiredProfession(e.target.value)}
          >
            <option value="">প্রয়োজনীয় পেশা নির্বাচন করুন</option>
            {PROFESSION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="border rounded-xl w-full py-2.5 px-3 text-sm"
              value={division}
              onChange={(e) => { setDivision(e.target.value); setDistrict(''); }}
            >
              <option value="">বিভাগ</option>
              {divisionsList.map((div) => <option key={div} value={div}>{div}</option>)}
            </select>
            <select
              className="border rounded-xl w-full py-2.5 px-3 text-sm"
              value={district}
              onChange={(e) => { setDistrict(e.target.value); setUpazilaThana(''); }}
              disabled={!division}
            >
              <option value="">জেলা</option>
              {districtsList.map((dist) => <option key={dist} value={dist}>{dist}</option>)}
            </select>
          </div>

          <select
            className="border rounded-xl w-full py-2.5 px-3 text-sm"
            value={upazilaThana}
            onChange={(e) => setUpazilaThana(e.target.value)}
            disabled={!district}
          >
            <option value="">উপজেলা/থানা</option>
            {upazilaThanasList.map((ut) => <option key={ut} value={ut}>{ut}</option>)}
          </select>

          <input
            type="text"
            className="border rounded-xl w-full py-2.5 px-3 text-sm"
            value={specificAreaName}
            onChange={(e) => setSpecificAreaName(e.target.value)}
            placeholder="গ্রাম/মহল্লার নাম"
          />

          <textarea
            rows="3"
            className="border rounded-xl w-full py-2.5 px-3 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="কাজের বিস্তারিত বিবরণ..."
          ></textarea>

          <input
            type="tel"
            className="border rounded-xl w-full py-2.5 px-3 text-sm"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="আপনার মোবাইল নম্বর (01XXXXXXXXX)"
            maxLength="11"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowJobPostModal(false)}
            className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-xl text-sm"
          >
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-sm"
            disabled={loadingPost}
          >
            {loadingPost ? 'পোস্ট হচ্ছে...' : 'পোস্ট করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

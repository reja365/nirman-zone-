import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, onSnapshot, addDoc } from 'firebase/firestore';

// আপনার পার্সোনাল বিকাশ/নগদ নম্বর, অ্যাডমিন মোবাইল নম্বর এবং গোপন অ্যাডমিন পিন এখানে সেট করা আছে
const ADMIN_BKASH_NUMBER = "01944121530";
const ADMIN_NAGAD_NUMBER = "01944121530";
const ADMIN_LOGIN_NUMBER = "01944121530";
const ADMIN_SECRET_PIN = "4829"; // আপনার গোপন অ্যাডমিন পিন (চাইলে পরিবর্তন করতে পারেন)
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
   export default App;

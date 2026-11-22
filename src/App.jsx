// ... existing code ...
        onAuthStateChanged(authService, async (user) => {
          if (user) {
            const currentUserId = user.uid;
            setUserId(currentUserId);

            const userDocRef = doc(firestore, `artifacts/${appId}/users/${currentUserId}/userProfile`, 'profile');
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              setUserProfile(userDocSnap.data());
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
  }, [initialAuthToken, appId]);
// ... existing code ...

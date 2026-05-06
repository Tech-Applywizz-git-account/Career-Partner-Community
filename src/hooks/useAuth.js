// //src/hooks/useAuth.js
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";

// const AuthContext = createContext({
//   user: null,
//   role: null,
//   loading: true,
//   signOut: async () => { },
// });

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchUserRole = async (userId, email) => {
//     try {
//       let { data, error } = await supabase
//         .from("profiles")
//         .select("role")
//         .eq("id", userId)
//         .single();

//       if (error?.code === 'PGRST116') { // No rows returned
//         // Create default profile
//         const { data: newProfile, error: createError } = await supabase
//           .from("profiles")
//           .insert([{
//             id: userId,
//             email: email,
//             role: "user", // Default role
//             created_at: new Date().toISOString()
//           }])
//           .select()
//           .single();

//         if (createError) throw createError;

//         setRole(newProfile.role);
//       } else if (error) {
//         throw error;
//       } else {
//         setRole(data?.role || "user");
//       }
//     } catch (err) {
//       console.error("Error in fetchUserRole:", err);
//       setRole("user");
//     }
//   };

//   const signOut = async () => {
//     console.log("🚨 SignOut called from AuthContext");
//     try {
//       // Clear state immediately for instant UI feedback
//       setUser(null);
//       setRole(null);

//       // Then sign out from Supabase
//       const { error } = await supabase.auth.signOut();

//       if (error) {
//         console.error("Supabase signOut error:", error);
//       } else {
//         console.log("✅ Successfully signed out");
//       }
//     } catch (err) {
//       console.error("SignOut exception:", err);
//     }
//   };

//   useEffect(() => {
//     // Get initial session
//     const getSession = async () => {
//       try {
//         const { data: { session } } = await supabase.auth.getSession();

//         if (session?.user) {
//           setUser(session.user);
//           await fetchUserRole(session.user.email, session.user.id);
//         } else {
//           setUser(null);
//           setRole(null);
//         }
//       } catch (error) {
//         console.error("Error checking auth:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     getSession();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log("Auth state changed:", event);

//       if (event === 'SIGNED_OUT' || !session) {
//         console.log("User signed out, clearing state");
//         setUser(null);
//         setRole(null);
//         setLoading(false);
//         return;
//       }

//       if (session?.user) {
//         setUser(session.user);
//         await fetchUserRole(session.user.email, session.user.id);
//       }
//       setLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const value = {
//     user,
//     role,
//     isAdmin: role === "admin",
//     loading,
//     signOut,
//   };

//   // Use React.createElement instead of JSX
//   return React.createElement(AuthContext.Provider, { value }, children);
// }

// export default function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }



// // src/hooks/useAuth.js
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";

// const AuthContext = createContext({
//   user: null,
//   role: null,
//   loading: true,
//   signOut: async () => { },
// });

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState(localStorage.getItem("userRole") || null);
//   const [loading, setLoading] = useState(true);
//   const [loggingOut, setLoggingOut] = useState(false);

//   // Helper: load profile.role for a user
//   const loadUserRole = async (userObj) => {
//     if (!userObj) {
//       setRole(null);
//       localStorage.removeItem("userRole"); // maintain consistency
//       return;
//     }

//     try {
//       console.log("📡 Querying profiles table for user:", userObj.id);

//       // Add timeout to prevent infinite loading
//       const timeoutPromise = new Promise((_, reject) =>
//         setTimeout(() => reject(new Error("Query timeout")), 5000)
//       );

//       const queryPromise = supabase
//         .from("profiles")
//         .select("role")
//         .eq("id", userObj.id)
//         .single();

//       const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]);

//       if (error) {
//         // PGRST116 is the error for "The result contains 0 rows" when using .single()
//         if (error.code === 'PGRST116') {
//           console.warn("ℹ️ Profile not found (PGRST116). Defaulting to 'user' role.");
//           setRole("user");
//           localStorage.setItem("userRole", "user");
//         } else {
//           console.error("❌ Error loading profile role:", error.message);
//           setRole("user");
//           localStorage.setItem("userRole", "user");
//         }
//       } else {
//         const userRole = profile?.role || "user";
//         console.log("✅ Profile loaded successfully! Role:", userRole);
//         setRole(userRole);
//         localStorage.setItem("userRole", userRole);
//       }
//     } catch (err) {
//       console.error("💥 Unexpected error loading profile role:", err);
//       console.warn("⚠️ Defaulting to 'user' role due to error");
//       setRole("user");
//       localStorage.setItem("userRole", "user");
//     }
//   };

//   // On first load, get existing session
//   useEffect(() => {
//     const init = async () => {
//       try {
//         const {
//           data: { session },
//           error,
//         } = await supabase.auth.getSession();

//         if (error) {
//           console.error("Error getting session:", error.message);
//         }

//         // Force fresh user fetch so Supabase doesn't use cached stale data
//         const { data: freshUser } = await supabase.auth.getUser();

//         if (freshUser?.user) {
//           setUser(freshUser.user);
//           await loadUserRole(freshUser.user);
//         } else if (session?.user) {
//           // fallback if freshUser fails
//           setUser(session.user);
//           await loadUserRole(session.user);
//         } else {
//           setUser(null);
//           setRole(null);
//         }

//       } catch (err) {
//         console.error("Unexpected error during auth init:", err);
//         setUser(null);
//         setRole(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     init();

//     // Listen for login/logout changes
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       console.log("🔔 Auth change event:", _event);
//       console.log("📝 Session exists:", !!session);

//       if (session?.user) {
//         console.log("👤 Setting user:", session.user.email);
//         setUser(session.user);
//         console.log("🔄 Loading user role...");
//         await loadUserRole(session.user);
//         console.log("✅ Role loaded, setting loading to false");
//       } else {
//         console.log("🚫 No session, clearing user and role");
//         setUser(null);
//         setRole(null);
//       }
//       setLoading(false);
//       console.log("⏹️ Loading state set to false");
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   const signOut = async () => {
//     console.log("🚨 SignOut called from AuthContext");
//     setLoggingOut(true);
//     try {
//       // Clear state immediately for instant UI feedback
//       setUser(null);
//       setRole(null);

//       // Clear localStorage immediately
//       localStorage.removeItem("userRole");
//       localStorage.removeItem("userId");
//       localStorage.removeItem("userEmail");

//       // Then sign out from Supabase
//       const { error } = await supabase.auth.signOut();

//       if (error) {
//         console.error("❌ Supabase signOut error:", error);
//         throw error;
//       } else {
//         console.log("✅ Successfully signed out from Supabase");
//       }
//     } catch (err) {
//       console.error("💥 SignOut exception:", err);
//       // Even if there's an error, ensure state is cleared
//       setUser(null);
//       setRole(null);
//       localStorage.clear();
//     } finally {
//       setLoggingOut(false);
//     }
//   };

//   const value = {
//     user,
//     role,
//     loading,
//     loggingOut,
//     signOut,
//   };

//   // Use React.createElement instead of JSX
//   return React.createElement(AuthContext.Provider, { value }, children);
// }

// export default function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (ctx === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return ctx;
// }



// src/hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext({
  user: null,
  role: null,
  subscriptionExpired: false,
  subscriptionEndDate: null,
  checkingSub: true,
  loading: true,
  refresh: async () => { },
  signOut: async () => { },
});

  // Cache for user roles to prevent redundant DB queries
  // Kept intentionally short (90s) so DB role changes (e.g. user→admin) propagate promptly
  const roleCache = new Map();
  const CACHE_DURATION = 90 * 1000; // 90-second cache — short enough to pick up role changes quickly

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(() => {
      // Initialize from localStorage immediately
      const storedRole = localStorage.getItem("userRole");
      return storedRole || null;
    });
    const [subscriptionExpired, setSubscriptionExpired] = useState(false);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
    const [checkingSub, setCheckingSub] = useState(true);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(true);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);
    const isInitialLoad = useRef(true);
    const hasProfileQueryRun = useRef(false);
    const isAuthInitialized = useRef(false);

    // Helper: load profile.role for a user with caching
    const loadUserRole = async (userObj) => {
      if (!userObj) {
        setRole(null);
        localStorage.removeItem("userRole");
        return;
      }

      const userId = userObj.id;

      // Check cache first
      const cachedData = roleCache.get(userId);
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        setRole(cachedData.role);
        setSubscriptionExpired(cachedData.subscriptionExpired);
        setSubscriptionEndDate(cachedData.subscriptionEndDate);
        setFirstName(cachedData.firstName || "");
        setLastName(cachedData.lastName || "");
        setCheckingSub(false);
        localStorage.setItem("userRole", cachedData.role);
        return;
      }

      try {
        console.log("📡 Querying profiles table for user:", userId);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error("❌ Error loading profile role:", error.message);
          }
          setRole("user");
          localStorage.setItem("userRole", "user");
        } else {
          const userRole = profile?.role || "user";
          const fullName = profile?.full_name || "";
          const [fName, ...lNames] = fullName.split(' ');

          setRole(userRole);
          setFirstName(fName || "");
          setLastName(lNames.join(' ') || "");
          localStorage.setItem("userRole", userRole);

          // Update cache
          roleCache.set(userId, {
            role: userRole,
            timestamp: Date.now(),
            firstName: fName,
            lastName: lNames.join(' '),
            subscriptionExpired: false,
            subscriptionEndDate: null
          });
        }
      } catch (err) {
        console.error("💥 Unexpected error loading profile role:", err);
        setRole("user");
        localStorage.setItem("userRole", "user");
      } finally {
        setCheckingSub(false);
        setPaymentLoading(false);
        isInitialLoad.current = false;
        hasProfileQueryRun.current = true;
      }
    };

    // On first load: check for real Supabase session
    useEffect(() => {
      let isMounted = true;
      let initTimeout;

      const init = async () => {
        try {
          // Set a loading timeout to prevent infinite loading
          initTimeout = setTimeout(() => {
            if (isMounted && !isAuthInitialized.current) {
              const storedRole = localStorage.getItem("userRole");
              if (storedRole && !role) setRole(storedRole);
              setLoading(false);
            }
          }, 8000);

          // 1. Get session first (usually from local storage, very fast)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            // If the session is invalid (stale refresh token), clear local data
            if (sessionError.message?.includes('Refresh Token')) {
              localStorage.removeItem("userRole");
              localStorage.removeItem("userId");
              setUser(null);
              setRole(null);
            }
            throw sessionError;
          }

          let currentUser = session?.user || null;

          // 2. ONLY if we have a session, verify it with getUser() to prevent 403 logs
          if (currentUser) {
            try {
              const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
              if (!userError && freshUser) {
                currentUser = freshUser;
              }
            } catch (e) {
              // Silence getUser verification errors
            }
          }

          if (currentUser && isMounted) {
            setUser(currentUser);
            // Load role in background
            loadUserRole(currentUser).finally(() => {
              if (isMounted) {
                isAuthInitialized.current = true;
                clearTimeout(initTimeout);
                setLoading(false);
              }
            });
          } else {
            if (isMounted) {
              isAuthInitialized.current = true;
              clearTimeout(initTimeout);
              setUser(null);
              setRole(null);
              setLoading(false);
              setCheckingSub(false);
            }
          }

        } catch (err) {
          if (isMounted) {
            isAuthInitialized.current = true;
            clearTimeout(initTimeout);
            setLoading(false);
            setCheckingSub(false);
          }
        }
      };

      init();

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        switch (event) {
          case 'SIGNED_OUT':
            setUser(null);
            setRole(null);
            localStorage.removeItem("userRole");
            roleCache.clear();
            hasProfileQueryRun.current = false;
            break;

          case 'SIGNED_IN':
          case 'USER_UPDATED':
            if (session?.user) {
              setUser(session.user);
              roleCache.delete(session.user.id);
              hasProfileQueryRun.current = false;
              setTimeout(() => loadUserRole(session.user), 100);
            }
            break;

          case 'TOKEN_REFRESHED':
          case 'INITIAL_SESSION':
            if (session?.user) {
              setUser(session.user);
              setTimeout(() => loadUserRole(session.user), 100);
            }
            break;

          default:
            break;
        }
      });

      return () => {
        isMounted = false;
        clearTimeout(initTimeout);
        subscription?.unsubscribe();
      };
    }, []);

    const refresh = async () => {
      if (user) {
        roleCache.delete(user.id);
        hasProfileQueryRun.current = false;
        await loadUserRole(user);
      }
    };

    const signOut = async () => {
      setLoggingOut(true);
      try {
        // Clear cache and storage first for immediate UI feedback
        roleCache.clear();
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");

        // Update state
        setUser(null);
        setRole(null);
        hasProfileQueryRun.current = false;

        // Sign out from Supabase (fire and forget)
        supabase.auth.signOut().catch(err => {
          console.error("❌ Supabase signOut error:", err);
        });

      } catch (err) {
        console.error("💥 SignOut exception:", err);
      } finally {
        setLoggingOut(false);
      }
    };

    const value = {
      user,
      role,
      isAdmin: role === 'admin',
      isDummy: false,
      subscriptionExpired,
      subscriptionEndDate,
      checkingSub,
      loading,
      paymentStatus,
      paymentLoading,
      firstName,
      lastName,
      loggingOut,
      refresh,
      signOut,
    };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from './firebase'

const AuthContext = createContext<any>({})

export const useAuth = () => useContext(AuthContext)

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRoles, setUserRoles] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Firebase auth state changed:', user?.email);
      
      if (user) {
        // Default user object with no specific role
        let userData: any = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'user', // Default role
          roles: ['user'] // Default roles array
        }

        // Check user's role in the database
        if (user.email) {
          try {
            // First check if user is in admins collection
            const adminsQuery = query(
              collection(db, "admins"),
              where("email", "==", user.email),
              where("status", "==", "active")
            );
            const adminSnapshot = await getDocs(adminsQuery);
            
            console.log('AuthContext: Admin check result:', {
              email: user.email,
              adminFound: !adminSnapshot.empty,
              adminCount: adminSnapshot.size
            });
            
            if (!adminSnapshot.empty) {
              // User is an admin
              const adminDoc = adminSnapshot.docs[0];
              const adminData = adminDoc.data();
              
              console.log('AuthContext: Admin data found:', adminData);
              
              // Set user roles from database
              const dbRoles = adminData.roles || [];
              setUserRoles(dbRoles);
              
              // Determine primary role and admin status
              if (dbRoles.includes("admin")) {
                setIsAdmin(true);
                userData.role = "admin";
              } else if (dbRoles.includes("helpdesk")) {
                userData.role = "helpdesk";
                setIsAdmin(false);
              } else if (dbRoles.includes("tours+media")) {
                userData.role = "tours+media";
                setIsAdmin(false);
              } else if (dbRoles.includes("tours")) {
                userData.role = "tours";
                setIsAdmin(false);
              } else {
                // Default to first role or 'user'
                userData.role = dbRoles[0] || "user";
                setIsAdmin(false);
              }
              
              userData.roles = dbRoles;
            } else {
              // Check if user is in partners collection
              const partnersQuery = query(
                collection(db, "partners"),
                where("email", "==", user.email),
                where("status", "==", "active")
              );
              const partnerSnapshot = await getDocs(partnersQuery);
              
              console.log('AuthContext: Partner check result:', {
                email: user.email,
                partnerFound: !partnerSnapshot.empty,
                partnerCount: partnerSnapshot.size
              });
              
              if (!partnerSnapshot.empty) {
                // User is a partner
                const partnerDoc = partnerSnapshot.docs[0];
                const partnerData = partnerDoc.data();
                
                console.log('AuthContext: Partner data found:', partnerData);
                
                // Set user roles from database - partners have partner role
                const dbRoles = ["partner"];
                setUserRoles(dbRoles);
                
                // Set partner role and admin status
                userData.role = "partner";
                setIsAdmin(false);
                userData.roles = dbRoles;
                
                // Add partner-specific data
                userData.displayName = partnerData.name || user.displayName;
                userData.phone = partnerData.phone;
                userData.country = partnerData.country;
              } else {
                // User is not in either collection or not active
                console.log('AuthContext: User not found in any collection');
                setIsAdmin(false);
                setUserRoles(['user']);
              }
            }
          } catch (error) {
            console.error("AuthContext: Error checking user role:", error);
            setIsAdmin(false);
            setUserRoles(['user']);
          }
        }
        
        console.log('AuthContext: Final user data:', userData);
        
        // Update the current user with role information
        setCurrentUser(userData);
      } else {
        console.log('AuthContext: No user - clearing state');
        setCurrentUser(null)
        setIsAdmin(false)
        setUserRoles([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function signup (email: string, password: string, name:string) {
    try {
  
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (user) {
        // Update profile
        await updateProfile(user, {
          displayName: name,
        });
  
        setCurrentUser({
          ...user,
          role: 'user', // Default role for new users
          roles: ['user']
        });
  
        console.log('Signup successful:', user);
      } else {
        console.error('Signup error: User is null');
      }
    } catch (error) {
      console.error('Signup error:', error);
    }

  }

const login = async (email: string, password: string) => {
  try {
    // Step 1: Check if user exists in either admins or partners collection with active status
    const adminsQuery = query(
      collection(db, "admins"),
      where("email", "==", email),
      where("status", "==", "active")
    );
    const adminSnapshot = await getDocs(adminsQuery);

    const partnersQuery = query(
      collection(db, "partners"),
      where("email", "==", email),
      where("status", "==", "active")
    );
    const partnerSnapshot = await getDocs(partnersQuery);

    if (adminSnapshot.empty && partnerSnapshot.empty) {
      throw new Error("Unauthorized: You are not registered as an admin or partner, or your status is not active.");
    }

    // Step 2: Proceed to sign in with Firebase
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Step 3: Set user context based on which collection they're in
    if (!adminSnapshot.empty) {
      // User is an admin
      const adminDoc = adminSnapshot.docs[0].data();
      const dbRoles = adminDoc.roles || [];
      
      setCurrentUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || adminDoc.name,
        role: dbRoles.includes("admin") ? "admin" : dbRoles[0] || "user",
        roles: dbRoles
      });

      setUserRoles(dbRoles);
      setIsAdmin(dbRoles.includes("admin"));
    } else {
      // User is a partner
      const partnerDoc = partnerSnapshot.docs[0].data();
      
      setCurrentUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || partnerDoc.name,
        phone: partnerDoc.phone,
        country: partnerDoc.country,
        role: "partner",
        roles: ["partner"]
      });

      setUserRoles(["partner"]);
      setIsAdmin(false);
    }

    return result;

  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};


  const logout = async () => {
    setCurrentUser(null)
    setIsAdmin(false)
    setUserRoles([])
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, userRoles, login, signup, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  )
} 
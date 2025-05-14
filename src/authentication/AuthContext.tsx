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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Default user object with no specific role
        let userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'user' // Default role
        }

        // Check user's role in the database
        if (user.email) {
          try {
            // Check if user is in admins collection
            const adminsQuery = query(
              collection(db, "admins"),
              where("email", "==", user.email)
            );
            const adminSnapshot = await getDocs(adminsQuery);
            
            if (!adminSnapshot.empty) {
              // Get the first document (should only be one)
              const adminDoc = adminSnapshot.docs[0];
              const adminData = adminDoc.data();
              
              // Check if the user's role is admin or helpdesk
              if (adminData.roles && adminData.roles.includes("admin")) {
                // Set user as admin
                setIsAdmin(true);
                userData.role = "admin";
              } else if (adminData.roles && adminData.roles.includes("helpdesk")) {
                // User has helpdesk role
                userData.role = "helpdesk";
                setIsAdmin(false);
              } else {
                // Default to whatever role is in the database or 'user'
                userData.role = adminData.roles?.[0] || "user";
                setIsAdmin(false);
              }
            } else {
              // User is not in admins collection
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error checking user role:", error);
            setIsAdmin(false);
          }
        }
        
        // Update the current user with role information
        setCurrentUser(userData);
      } else {
        setCurrentUser(null)
        setIsAdmin(false)
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
          role: 'user' // Default role for new users
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      let userRole = 'user';
      let isUserAdmin = false;

      // Check user's role in admin collection
      if (result.user.email) {
        const adminsQuery = query(
          collection(db, "admins"),
          where("email", "==", result.user.email)
        );
        const adminSnapshot = await getDocs(adminsQuery);
        
        if (!adminSnapshot.empty) {
          // User is in admins collection, check their role
          const adminDoc = adminSnapshot.docs[0];
          const adminData = adminDoc.data();
          
          if (adminData.roles && adminData.roles.includes("admin")) {
            // User has admin role
            userRole = "admin";
            isUserAdmin = true;
          } else if (adminData.roles && adminData.roles.includes("helpdesk")) {
            // User has helpdesk role
            userRole = "helpdesk";
            isUserAdmin = false;
          } else {
            // Default to whatever role is in the database
            userRole = adminData.roles?.[0] || "user";
            isUserAdmin = false;
          }
        } else {
          // If user is not in admins collection, sign them out
          await signOut(auth);
          throw new Error("Unauthorized: You do not have access to this system");
        }
        
        setIsAdmin(isUserAdmin);
        
        // Update the current user with role information
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          role: userRole
        });
      }
      
      return result;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  const logout = async () => {
    setCurrentUser(null)
    setIsAdmin(false)
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, login, signup, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  )
}
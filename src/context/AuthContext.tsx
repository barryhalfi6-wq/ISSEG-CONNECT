import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from '../firebase';
import { UserProfile } from '../types';
import { getStudentProfile, saveStudentProfile } from '../services/dataService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    department: string;
    program: string;
    level: string;
    ine?: string;
    studentCardPhotoUrl?: string;
  }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (partial: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          let userProf = await getStudentProfile(user.uid);
          if (!userProf) {
            // Build fallback profile from user auth
            const displayNameParts = (user.displayName || '').split(' ');
            const firstName = displayNameParts[0] || 'Étudiant';
            const lastName = displayNameParts.slice(1).join(' ') || 'ISSEG';
            userProf = {
              uid: user.uid,
              email: user.email || '',
              firstName,
              lastName,
              fullName: user.displayName || `${firstName} ${lastName}`,
              department: 'Sciences',
              program: 'Mathématiques-Physique',
              level: 'Licence 2',
              institution: 'ISSEG (Institut Supérieur des Sciences de l\'Éducation de Guinée)',
              role: 'student',
              verificationStatus: 'approved'
            };
            await saveStudentProfile(userProf);
          }
          setProfile(userProf);
        } catch (err) {
          console.error('Erreur chargement profil Firestore:', err);
          // Fallback to memory profile so student is never locked out
          setProfile({
            uid: user.uid,
            email: user.email || '',
            firstName: user.displayName?.split(' ')[0] || 'Étudiant',
            lastName: user.displayName?.split(' ')[1] || 'ISSEG',
            fullName: user.displayName || 'Étudiant ISSEG',
            department: 'Sciences',
            program: 'Filière générale',
            level: 'Licence',
            institution: 'ISSEG'
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    department: string;
    program: string;
    level: string;
    ine?: string;
    studentCardPhotoUrl?: string;
  }) => {
    const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
    await updateProfile(cred.user, { displayName: fullName });

    const isCardProvided = Boolean(data.studentCardPhotoUrl && data.ine);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || data.email.trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      fullName,
      ine: data.ine?.trim() || undefined,
      studentCardPhotoUrl: data.studentCardPhotoUrl || undefined,
      department: data.department,
      program: data.program,
      level: data.level,
      institution: 'ISSEG (Lambanyi, Ratoma)',
      role: 'student',
      verificationStatus: isCardProvided ? 'approved' : 'missing_card'
    };

    await saveStudentProfile(newProfile);
    setProfile(newProfile);
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    if (res.user) {
      const existing = await getStudentProfile(res.user.uid);
      if (!existing) {
        const parts = (res.user.displayName || '').split(' ');
        const newProf: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || '',
          firstName: parts[0] || 'Étudiant',
          lastName: parts.slice(1).join(' ') || 'ISSEG',
          fullName: res.user.displayName || 'Étudiant ISSEG',
          department: 'Sciences',
          program: 'Mathématiques-Physique',
          level: 'Licence 1',
          institution: 'ISSEG',
          role: 'student',
          verificationStatus: 'approved',
          photoURL: res.user.photoURL || undefined
        };
        await saveStudentProfile(newProf);
        setProfile(newProf);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateProfileData = async (partial: Partial<UserProfile>) => {
    if (!currentUser || !profile) return;
    const updated = { ...profile, ...partial };
    await saveStudentProfile(updated);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfileData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

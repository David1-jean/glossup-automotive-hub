import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin_master" | "gerente" | "consultor";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  oficina_id: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  isAdminMaster: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser: User) => {
    const userId = currentUser.id;
    
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const userRoles = rolesRes.data?.map((r: { role: string }) => r.role as AppRole) || [];
    setRoles(userRoles);

    if (profileRes.data) {
      const prof = profileRes.data as Profile;
      
      if (!prof.oficina_id && userRoles.includes("admin_master")) {
        const defaultOficinaId = "00000000-0000-0000-0000-000000000001";
        await supabase.from("profiles").update({ oficina_id: defaultOficinaId }).eq("id", userId);
        prof.oficina_id = defaultOficinaId;
      } else if (!prof.oficina_id && currentUser.user_metadata?.oficina_id) {
        const metaOficinaId = currentUser.user_metadata.oficina_id;
        await supabase.from("profiles").update({ oficina_id: metaOficinaId }).eq("id", userId);
        prof.oficina_id = metaOficinaId;
      }
      
      setProfile(prof);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Use onAuthStateChange as the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase auth internals
          setTimeout(async () => {
            if (!mounted) return;
            try {
              await fetchUserData(currentSession.user);
            } catch (err) {
              console.error("[AuthContext] fetchUserData error:", err);
            }
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdminMaster = hasRole("admin_master");

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, roles, loading, hasRole, isAdminMaster, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

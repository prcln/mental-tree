import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';
import { fruitService } from '../../services/fruitService';
import { treeService } from '../../services/treeService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [autoSpawnResult, setAutoSpawnResult] = useState(null);

  const handleAutoSpawn = async (userId) => {
  
    try {
      const trees = await treeService.getUserTrees(userId);

      if (!trees || trees.length === 0) {
        return { spawned: 0, reason: 'no_tree' };
      }

      const tree = trees[0];
      const result = await fruitService.autoSpawnFruitsOnLogin(tree.id);
      
      setAutoSpawnResult(result);
      
      return result;
    } catch (error) {
      console.error('[AUTO-SPAWN] Error:', error);
      console.error('[AUTO-SPAWN] Error stack:', error.stack);
      return { spawned: 0, error: error.message };
    }
  };

  useEffect(() => {

    if (!sessionChecked) {
      
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setUser(session?.user ?? null);
        
        // Set loading to false FIRST to unblock UI
        setLoading(false);
        setSessionChecked(true);
        
        // Then spawn fruits in background (non-blocking)
        if (session?.user) {
          handleAutoSpawn(session.user.id).catch(err => {
            console.error('[AUTH] Background spawn failed:', err);
          });
        }
      }).catch(error => {
        console.error('[AUTH] Session check failed:', error);
        setLoading(false);
        setSessionChecked(true);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        
        // Run spawn in background (non-blocking)
        if (session?.user) {
          handleAutoSpawn(session.user.id).catch(err => {
            console.error('[AUTH] Sign-in spawn failed:', err);
          });
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        setAutoSpawnResult(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('[AUTH] Sign up error:', error);
      throw error;
    }
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('[AUTH] Sign in error:', error);
      throw error;
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AUTH] Sign out error:', error);
      throw error;
    }
    setAutoSpawnResult(null);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    autoSpawnResult,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
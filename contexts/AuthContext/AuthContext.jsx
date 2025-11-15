import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';
import { fruitService } from '../../services/fruitService';
import { treeService } from '../../services/treeService';
import { analyticsService } from '../../services/analyticsService';

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
  const [analyticsSessionStarted, setAnalyticsSessionStarted] = useState(false);
  const [fruitSpawnTrigger, setFruitSpawnTrigger] = useState(0);

  const handleAutoSpawn = async (userId) => {
  
    try {
      const trees = await treeService.getUserTrees(userId);

      if (!trees || trees.length === 0) {
        return { spawned: 0, reason: 'no_tree' };
      }

      const tree = trees[0];
      const result = await fruitService.autoSpawnFruitsOnLogin(tree.id);
      
      setAutoSpawnResult(result);

      // Trigger fruit reload if fruits were spawned
      if (result.spawned > 0) {
        setFruitSpawnTrigger(prev => prev + 1); // INCREMENT TRIGGER
      }
      
      return result;
    } catch (error) {
      console.error('[AUTO-SPAWN] Error:', error);
      console.error('[AUTO-SPAWN] Error stack:', error.stack);
      return { spawned: 0, error: error.message };
    }
  };

  // Start analytics session when user logs in
  const startAnalyticsSession = async (userId) => {
    try {
      console.log('[ANALYTICS] Starting session for user:', userId);
      await analyticsService.startSession(userId);
      setAnalyticsSessionStarted(true);
    } catch (error) {
      console.error('[ANALYTICS] Failed to start session:', error);
    }
  };

  // End analytics session when user logs out or closes tab
  const endAnalyticsSession = async () => {
    try {
      if (analyticsSessionStarted) {
        console.log('[ANALYTICS] Ending session');
        await analyticsService.endSession();
        setAnalyticsSessionStarted(false);
      }
    } catch (error) {
      console.error('[ANALYTICS] Failed to end session:', error);
    }
  };

  useEffect(() => {
    if (!sessionChecked) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
        setSessionChecked(true);
        
        if (session?.user) {
          // Start analytics session (non-blocking)
          startAnalyticsSession(session.user.id).catch(err => {
            console.error('[AUTH] Analytics session start failed:', err);
          });
          
          // Spawn fruits in background (non-blocking)
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
      console.log('[AUTH] Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        
        // Start analytics session
        if (session?.user) {
          startAnalyticsSession(session.user.id).catch(err => {
            console.error('[AUTH] Sign-in analytics failed:', err);
          });
          
          // Run spawn in background
          handleAutoSpawn(session.user.id).catch(err => {
            console.error('[AUTH] Sign-in spawn failed:', err);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        // End analytics session before clearing user
        await endAnalyticsSession();
        setUser(null);
        setAutoSpawnResult(null);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  // Track when user switches tabs or minimizes browser
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from the tab - end session
        console.log('[ANALYTICS] Tab hidden, ending session');
        endAnalyticsSession();
      } else {
        // User came back to the tab - start new session
        console.log('[ANALYTICS] Tab visible, starting session');
        startAnalyticsSession(user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, analyticsSessionStarted]);

  // Track when user closes browser/tab
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable tracking on page unload
      const sessionId = sessionStorage.getItem('analytics_session_id');
      if (sessionId) {
        navigator.sendBeacon(
          `${supabase.supabaseUrl}/rest/v1/rpc/end_session_beacon`,
          JSON.stringify({ session_id: sessionId })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

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
    // End analytics session before signing out
    await endAnalyticsSession();
    
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
    fruitSpawnTrigger,
    trackActivity: analyticsService.trackActivity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import { supabase } from '../supabase/client';

export const isAdmin = async (userId) => {
  try {
    // Check if user has admin role in user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
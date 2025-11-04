import { supabase } from "../supabase/client";
import { fetchSingleRow } from "../utils/helpers";

export const cooldownService = {
  canResetTree: async (treeId) => {
    const tree = await fetchSingleRow(
      supabase.from('trees').select('last_reset_tree').eq('id', treeId),
      'canResetTree'
    );

    if (!tree.last_reset_tree) {
      return { canResetTree: true, timeLeft: 0 };
    }

    const timeDiff = Date.now() - new Date(tree.last_reset_tree).getTime();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours

    return timeDiff >= cooldownPeriod
      ? { canResetTree: true, timeLeft: 0 }
      : { canResetTree: false, timeLeft: cooldownPeriod - timeDiff };
  },

  canCheckIn: async (treeId) => {
    const tree = await fetchSingleRow(
      supabase.from('trees').select('last_check_in').eq('id', treeId),
      'canCheckIn'
    );

    if (!tree.last_check_in) {
      return { canCheckIn: true, timeLeft: 0 };
    }

    const timeDiff = Date.now() - new Date(tree.last_check_in).getTime();
    const cooldownPeriod = 60 * 60 * 1000; // 1 hour

    return timeDiff >= cooldownPeriod
      ? { canCheckIn: true, timeLeft: 0 }
      : { canCheckIn: false, timeLeft: cooldownPeriod - timeDiff };
  }
};
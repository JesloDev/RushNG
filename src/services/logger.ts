import { supabase } from '../supabase';

export const logActivity = async (action: string, details: any = {}, userId: string | null = null) => {
  if (!supabase) return;

  try {
    const { error } = await supabase.from('activity_logs').insert([
      {
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

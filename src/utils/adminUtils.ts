
import { supabase } from '@/integrations/supabase/client';

/**
 * SECURITY: Updated to use secure edge function for role assignment
 * This prevents direct database manipulation from the frontend
 */
export const assignAdminRole = async (
  userEmail: string, 
  role: 'admin' | 'developer' | 'user' | 'viewer' = 'admin'
) => {
  try {
    const { data, error } = await supabase.functions.invoke('assign-user-role', {
      body: {
        targetUserEmail: userEmail,
        role: role
      }
    });

    if (error) {
      console.error('Error assigning role:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: data.message 
    };
  } catch (error) {
    console.error('Error in assignAdminRole:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Remove user role by setting role to 'viewer' (lowest privilege)
 */
export const removeUserRole = async (
  userEmail: string,
  role: 'admin' | 'developer' | 'user' | 'viewer'
) => {
  try {
    // Set to viewer role instead of removing (maintains user access)
    const { data, error } = await supabase.functions.invoke('assign-user-role', {
      body: {
        targetUserEmail: userEmail,
        role: 'viewer'
      }
    });

    if (error) {
      console.error('Error removing role:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: `Successfully removed ${role} role from ${userEmail}` 
    };
  } catch (error) {
    console.error('Error in removeUserRole:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};


import { supabase } from '@/integrations/supabase/client';

/**
 * Assign admin role to a user (must be called by an existing admin)
 */
export const assignAdminRole = async (userEmail: string, role: 'admin' | 'developer' | 'viewer' = 'admin') => {
  try {
    // First, get the user ID from email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const targetUser = users.find(user => user.email === userEmail);
    
    if (!targetUser) {
      throw new Error(`User with email ${userEmail} not found`);
    }

    // Get current user (who must be admin to assign roles)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error('You must be logged in to assign roles');
    }

    // Insert the role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUser.id,
        role: role,
        assigned_by: currentUser.id
      });

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error(`User already has the ${role} role`);
      }
      throw new Error(`Failed to assign role: ${insertError.message}`);
    }

    return { success: true, message: `Successfully assigned ${role} role to ${userEmail}` };
  } catch (error) {
    console.error('Error assigning admin role:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

/**
 * Remove role from a user (must be called by an existing admin)
 */
export const removeUserRole = async (userEmail: string, role: 'admin' | 'developer' | 'viewer') => {
  try {
    // First, get the user ID from email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const targetUser = users.find(user => user.email === userEmail);
    
    if (!targetUser) {
      throw new Error(`User with email ${userEmail} not found`);
    }

    // Remove the role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', targetUser.id)
      .eq('role', role);

    if (deleteError) {
      throw new Error(`Failed to remove role: ${deleteError.message}`);
    }

    return { success: true, message: `Successfully removed ${role} role from ${userEmail}` };
  } catch (error) {
    console.error('Error removing user role:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

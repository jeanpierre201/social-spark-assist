import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header to verify admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    console.log('Starting test user cleanup...')

    // Find all test users (emails ending with @socialnova.test)
    const { data: authUsers, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`)
    }

    const testUsers = authUsers.users.filter(u => 
      u.email?.endsWith('@socialnova.test') || u.email?.includes('testuser')
    )

    console.log(`Found ${testUsers.length} test users to delete`)

    let deletedCount = 0
    const errors: string[] = []

    for (const testUser of testUsers) {
      try {
        console.log(`Deleting user: ${testUser.email} (${testUser.id})`)

        // Delete user's posts
        const { error: postsError } = await supabaseAdmin
          .from('posts')
          .delete()
          .eq('user_id', testUser.id)
        
        if (postsError) {
          console.error(`Error deleting posts for ${testUser.email}:`, postsError)
          errors.push(`Posts deletion failed for ${testUser.email}: ${postsError.message}`)
        } else {
          console.log(`Deleted posts for ${testUser.email}`)
        }

        // Delete user's monthly usage
        const { error: usageError } = await supabaseAdmin
          .from('monthly_usage')
          .delete()
          .eq('user_id', testUser.id)
        
        if (usageError) {
          console.error(`Error deleting monthly_usage for ${testUser.email}:`, usageError)
        }

        // Delete user's roles
        const { error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', testUser.id)
        
        if (rolesError) {
          console.error(`Error deleting user_roles for ${testUser.email}:`, rolesError)
        }

        // Delete user's profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', testUser.id)
        
        if (profileError) {
          console.error(`Error deleting profile for ${testUser.email}:`, profileError)
        }

        // Delete user's subscriber record
        const { error: subscriberError } = await supabaseAdmin
          .from('subscribers')
          .delete()
          .eq('user_id', testUser.id)
        
        if (subscriberError) {
          console.error(`Error deleting subscriber for ${testUser.email}:`, subscriberError)
        }

        // Delete user's social accounts
        const { error: socialError } = await supabaseAdmin
          .from('social_accounts')
          .delete()
          .eq('user_id', testUser.id)
        
        if (socialError) {
          console.error(`Error deleting social_accounts for ${testUser.email}:`, socialError)
        }

        // Delete user's analytics data
        const { error: analyticsError } = await supabaseAdmin
          .from('analytics_data')
          .delete()
          .eq('user_id', testUser.id)
        
        if (analyticsError) {
          console.error(`Error deleting analytics_data for ${testUser.email}:`, analyticsError)
        }

        // Finally, delete the auth user
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
          testUser.id
        )

        if (deleteUserError) {
          console.error(`Error deleting auth user ${testUser.email}:`, deleteUserError)
          errors.push(`User deletion failed for ${testUser.email}: ${deleteUserError.message}`)
        } else {
          deletedCount++
          console.log(`Successfully deleted user: ${testUser.email}`)
        }
      } catch (error) {
        console.error(`Error processing user ${testUser.email}:`, error)
        errors.push(`Error processing ${testUser.email}: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully deleted ${deletedCount} test users`,
        totalFound: testUsers.length,
        deleted: deletedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in cleanup-test-users:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

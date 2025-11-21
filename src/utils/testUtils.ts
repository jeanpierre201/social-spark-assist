/**
 * Test Utilities for Creating Test Users and Content
 * Use these functions to generate test data for the application
 */

import { supabase } from '@/integrations/supabase/client';

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Generates an array of test user data
 * @param count Number of test users to generate
 * @returns Array of test user objects
 */
export const generateTestUsers = (count: number): TestUser[] => {
  const users: TestUser[] = [];
  
  for (let i = 1; i <= count; i++) {
    users.push({
      email: `testuser${i}@rombipost.test`,
      password: `TestPass${i}123!`,
      fullName: `Test User ${i}`
    });
  }
  
  return users;
};

/**
 * Creates a single test user account
 * @param email User email
 * @param password User password
 * @param fullName User's full name
 * @returns Object with user data and any errors
 */
export const createTestUser = async (
  email: string,
  password: string,
  fullName: string
) => {
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      console.error(`Error creating user ${email}:`, error.message);
      return { success: false, error: error.message, email };
    }

    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    return { success: true, user: data.user, email };
  } catch (error: any) {
    console.error(`Exception creating user ${email}:`, error.message);
    return { success: false, error: error.message, email };
  }
};

/**
 * Creates multiple test users in batches to avoid rate limiting
 * @param users Array of test user data
 * @param batchSize Number of users to create at once
 * @returns Array of results
 */
export const createTestUsersBatch = async (
  users: TestUser[],
  batchSize: number = 5
) => {
  const results = [];
  
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    console.log(`Creating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}...`);
    
    const batchResults = await Promise.all(
      batch.map(user => createTestUser(user.email, user.password, user.fullName))
    );
    
    results.push(...batchResults);
    
    // Wait between batches to avoid rate limiting
    if (i + batchSize < users.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
};

/**
 * Logs in as a test user
 * @param email User email
 * @param password User password
 * @returns Login result
 */
export const loginTestUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Creates a Starter plan subscription for a test user
 * @param userId User ID
 * @param email User email
 * @returns Subscription creation result
 */
export const createStarterSubscription = async (userId: string, email: string) => {
  try {
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // 30 days from now

    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        user_id: userId,
        email: email,
        subscription_tier: 'Starter',
        subscribed: true,
        subscription_end: subscriptionEnd.toISOString(),
        stripe_customer_id: `cus_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, subscription: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Creates a Pro plan subscription for a test user
 * @param userId User ID
 * @param email User email
 * @returns Subscription creation result
 */
export const createProSubscription = async (userId: string, email: string) => {
  try {
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // 30 days from now

    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        user_id: userId,
        email: email,
        subscription_tier: 'Pro',
        subscribed: true,
        subscription_end: subscriptionEnd.toISOString(),
        stripe_customer_id: `cus_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, subscription: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Simulates a Stripe webhook for subscription creation
 * @param customerId Stripe customer ID
 * @param priceId Stripe price ID
 * @param subscriptionTier Subscription tier (Starter or Pro)
 * @returns Webhook simulation result
 */
export const simulateStripeWebhook = async (
  customerId: string,
  priceId: string,
  subscriptionTier: 'Starter' | 'Pro'
) => {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-webhook', {
      body: {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: `sub_test_${Date.now()}`,
            customer: customerId,
            status: 'active',
            items: {
              data: [{
                price: {
                  id: priceId,
                  recurring: {
                    interval: 'month'
                  }
                }
              }]
            },
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
          }
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Generates test content for a user
 * @param userId User ID
 * @returns Content generation result
 */
export const generateTestContent = async (userId: string) => {
  try {
    // First call generate-content function
    const { data: contentData, error: contentError } = await supabase.functions.invoke('generate-content', {
      body: {
        industry: 'Technology',
        goal: 'Test content generation',
        nicheInfo: 'Testing platform',
        includeEmojis: true,
        userId: userId
      }
    });

    if (contentError) {
      return { success: false, error: contentError.message };
    }

    // Increment usage
    await supabase.rpc('increment_monthly_usage', { user_uuid: userId });

    // Save the post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        generated_caption: contentData.caption,
        generated_hashtags: contentData.hashtags,
        industry: 'Technology',
        goal: 'Test content generation',
        niche_info: 'Testing platform',
        status: 'draft'
      })
      .select()
      .single();

    if (postError) {
      return { success: false, error: postError.message };
    }

    return { success: true, post: postData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Updates profile for a test user
 * @param userId User ID
 * @param fullName New full name
 * @param avatarUrl Avatar URL (optional)
 * @returns Update result
 */
export const updateTestUserProfile = async (
  userId: string,
  fullName: string,
  avatarUrl?: string | null
) => {
  try {
    const updateData: any = { full_name: fullName };
    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Changes password for a test user
 * @param newPassword New password
 * @returns Update result
 */
export const changeTestUserPassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Logs out current user
 */
export const logoutTestUser = async () => {
  await supabase.auth.signOut();
};

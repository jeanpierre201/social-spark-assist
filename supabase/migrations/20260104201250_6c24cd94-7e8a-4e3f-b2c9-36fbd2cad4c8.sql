-- Delete test subscribers with test email patterns and test Stripe customer IDs
DELETE FROM subscribers 
WHERE 
  email LIKE '%@socialnova.test' 
  OR email LIKE '%test%@%test%'
  OR stripe_customer_id LIKE 'cus_test_%';
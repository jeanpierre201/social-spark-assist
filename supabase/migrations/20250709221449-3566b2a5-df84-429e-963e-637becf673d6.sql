-- Create function to automatically update subscription analytics
CREATE OR REPLACE FUNCTION update_subscription_analytics()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  tier_name TEXT;
BEGIN
  -- Handle INSERT (new subscription)
  IF TG_OP = 'INSERT' THEN
    IF NEW.subscribed = true AND NEW.subscription_tier IS NOT NULL THEN
      -- Insert or update analytics for today
      INSERT INTO subscription_analytics (
        date_recorded,
        subscription_tier,
        new_subscriptions,
        active_subscriptions,
        revenue_generated,
        upgrade_count,
        downgrade_count
      ) VALUES (
        today_date,
        NEW.subscription_tier,
        1,
        1,
        CASE 
          WHEN NEW.subscription_tier = 'Pro' THEN 25.00
          WHEN NEW.subscription_tier = 'Starter' THEN 12.00
          ELSE 0
        END,
        0,
        0
      )
      ON CONFLICT (date_recorded, subscription_tier) 
      DO UPDATE SET
        new_subscriptions = subscription_analytics.new_subscriptions + 1,
        active_subscriptions = subscription_analytics.active_subscriptions + 1,
        revenue_generated = subscription_analytics.revenue_generated + EXCLUDED.revenue_generated,
        updated_at = now();
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE (subscription change)
  IF TG_OP = 'UPDATE' THEN
    -- Handle subscription status change
    IF OLD.subscribed != NEW.subscribed THEN
      IF NEW.subscribed = true AND NEW.subscription_tier IS NOT NULL THEN
        -- New activation
        INSERT INTO subscription_analytics (
          date_recorded,
          subscription_tier,
          new_subscriptions,
          active_subscriptions,
          revenue_generated,
          upgrade_count,
          downgrade_count
        ) VALUES (
          today_date,
          NEW.subscription_tier,
          1,
          1,
          CASE 
            WHEN NEW.subscription_tier = 'Pro' THEN 25.00
            WHEN NEW.subscription_tier = 'Starter' THEN 12.00
            ELSE 0
          END,
          0,
          0
        )
        ON CONFLICT (date_recorded, subscription_tier) 
        DO UPDATE SET
          new_subscriptions = subscription_analytics.new_subscriptions + 1,
          active_subscriptions = subscription_analytics.active_subscriptions + 1,
          revenue_generated = subscription_analytics.revenue_generated + EXCLUDED.revenue_generated,
          updated_at = now();
      ELSIF OLD.subscribed = true AND NEW.subscribed = false AND OLD.subscription_tier IS NOT NULL THEN
        -- Cancellation
        INSERT INTO subscription_analytics (
          date_recorded,
          subscription_tier,
          new_subscriptions,
          active_subscriptions,
          revenue_generated,
          upgrade_count,
          downgrade_count
        ) VALUES (
          today_date,
          OLD.subscription_tier,
          0,
          -1,
          0,
          0,
          0
        )
        ON CONFLICT (date_recorded, subscription_tier) 
        DO UPDATE SET
          active_subscriptions = GREATEST(0, subscription_analytics.active_subscriptions - 1),
          updated_at = now();
      END IF;
    END IF;

    -- Handle tier upgrade/downgrade
    IF OLD.subscription_tier != NEW.subscription_tier AND OLD.subscribed = true AND NEW.subscribed = true THEN
      -- Downgrade old tier
      IF OLD.subscription_tier IS NOT NULL THEN
        INSERT INTO subscription_analytics (
          date_recorded,
          subscription_tier,
          new_subscriptions,
          active_subscriptions,
          revenue_generated,
          upgrade_count,
          downgrade_count
        ) VALUES (
          today_date,
          OLD.subscription_tier,
          0,
          -1,
          0,
          0,
          1
        )
        ON CONFLICT (date_recorded, subscription_tier) 
        DO UPDATE SET
          active_subscriptions = GREATEST(0, subscription_analytics.active_subscriptions - 1),
          downgrade_count = subscription_analytics.downgrade_count + 1,
          updated_at = now();
      END IF;

      -- Upgrade to new tier
      IF NEW.subscription_tier IS NOT NULL THEN
        INSERT INTO subscription_analytics (
          date_recorded,
          subscription_tier,
          new_subscriptions,
          active_subscriptions,
          revenue_generated,
          upgrade_count,
          downgrade_count
        ) VALUES (
          today_date,
          NEW.subscription_tier,
          0,
          1,
          CASE 
            WHEN NEW.subscription_tier = 'Pro' THEN 25.00
            WHEN NEW.subscription_tier = 'Starter' THEN 12.00
            ELSE 0
          END,
          1,
          0
        )
        ON CONFLICT (date_recorded, subscription_tier) 
        DO UPDATE SET
          active_subscriptions = subscription_analytics.active_subscriptions + 1,
          revenue_generated = subscription_analytics.revenue_generated + EXCLUDED.revenue_generated,
          upgrade_count = subscription_analytics.upgrade_count + 1,
          updated_at = now();
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE (subscription removed)
  IF TG_OP = 'DELETE' THEN
    IF OLD.subscribed = true AND OLD.subscription_tier IS NOT NULL THEN
      INSERT INTO subscription_analytics (
        date_recorded,
        subscription_tier,
        new_subscriptions,
        active_subscriptions,
        revenue_generated,
        upgrade_count,
        downgrade_count
      ) VALUES (
        today_date,
        OLD.subscription_tier,
        0,
        -1,
        0,
        0,
        0
      )
      ON CONFLICT (date_recorded, subscription_tier) 
      DO UPDATE SET
        active_subscriptions = GREATEST(0, subscription_analytics.active_subscriptions - 1),
        updated_at = now();
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on subscribers table
DROP TRIGGER IF EXISTS trigger_update_subscription_analytics_insert ON subscribers;
DROP TRIGGER IF EXISTS trigger_update_subscription_analytics_update ON subscribers;
DROP TRIGGER IF EXISTS trigger_update_subscription_analytics_delete ON subscribers;

CREATE TRIGGER trigger_update_subscription_analytics_insert
  AFTER INSERT ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_analytics();

CREATE TRIGGER trigger_update_subscription_analytics_update
  AFTER UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_analytics();

CREATE TRIGGER trigger_update_subscription_analytics_delete
  AFTER DELETE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_analytics();

-- Initialize analytics for existing subscribers
INSERT INTO subscription_analytics (
  date_recorded,
  subscription_tier,
  new_subscriptions,
  active_subscriptions,
  revenue_generated,
  upgrade_count,
  downgrade_count
)
SELECT 
  CURRENT_DATE,
  subscription_tier,
  COUNT(*) as new_subscriptions,
  COUNT(*) as active_subscriptions,
  COUNT(*) * CASE 
    WHEN subscription_tier = 'Pro' THEN 25.00
    WHEN subscription_tier = 'Starter' THEN 12.00
    ELSE 0
  END as revenue_generated,
  0 as upgrade_count,
  0 as downgrade_count
FROM subscribers 
WHERE subscribed = true AND subscription_tier IS NOT NULL
GROUP BY subscription_tier
ON CONFLICT (date_recorded, subscription_tier) DO NOTHING;
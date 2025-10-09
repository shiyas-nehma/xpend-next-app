import ActiveUserSubscriptionService from '@/lib/firebase/activeUserSubscriptionService';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import PaymentDetailsService from '@/lib/firebase/paymentDetailsService';

export class SubscriptionDataVerification {
  /**
   * Verify that all 3 tables are properly synced for a user
   * @param userId - The authenticated user's ID
   * @returns Verification results for all 3 tables
   */
  static async verifyUserSubscriptionData(userId: string) {
    console.log('=== Verifying 3-Table Subscription Data for User:', userId, '===');
    
    try {
      // 1. Check user_subscriptions table (main historical record)
      const mainSubscription = await FirebaseUserSubscriptionService.getUserSubscription(userId);
      console.log('📊 1. user_subscriptions table:', mainSubscription ? {
        id: mainSubscription.id,
        planName: mainSubscription.planName,
        status: mainSubscription.status,
        userId: mainSubscription.userId
      } : 'NO SUBSCRIPTION FOUND');

      // 2. Check active_user_subscriptions table (unique userId with current subscription)
      const activeSubscription = await ActiveUserSubscriptionService.getActiveSubscription(userId);
      console.log('🎯 2. active_user_subscriptions table:', activeSubscription ? {
        id: activeSubscription.id,
        planName: activeSubscription.planName,
        status: activeSubscription.status,
        userId: activeSubscription.userId
      } : 'NO ACTIVE SUBSCRIPTION FOUND');

      // 3. Check payment_details table (all payment records)
      const paymentHistory = await PaymentDetailsService.getPaymentsByUserId(userId);
      const paymentStats = await PaymentDetailsService.getPaymentStats(userId);
      console.log('💳 3. payment_details table:', {
        totalPayments: paymentHistory.length,
        latestPayment: paymentHistory.length > 0 ? {
          id: paymentHistory[0].id,
          amount: paymentHistory[0].paymentAmount,
          planName: paymentHistory[0].planName,
          status: paymentHistory[0].paymentStatus
        } : 'NO PAYMENTS FOUND',
        stats: {
          totalAmount: paymentStats.totalAmount,
          completedPayments: paymentStats.completedPayments,
          lastPaymentDate: paymentStats.lastPaymentDate?.toISOString()
        }
      });

      // Verify data consistency
      const consistencyChecks = {
        hasMainSubscription: !!mainSubscription,
        hasActiveSubscription: !!activeSubscription,
        hasPaymentHistory: paymentHistory.length > 0,
        activeMatchesMain: mainSubscription && activeSubscription ? 
          mainSubscription.id === activeSubscription.id : false,
        paymentExistsForSubscription: mainSubscription && paymentHistory.length > 0 ? 
          paymentHistory.some(p => p.subscriptionId === mainSubscription.id) : false
      };

      console.log('✅ Data Consistency Checks:', consistencyChecks);

      return {
        success: true,
        userId,
        tables: {
          userSubscriptions: mainSubscription,
          activeUserSubscriptions: activeSubscription,
          paymentDetails: {
            count: paymentHistory.length,
            latest: paymentHistory[0] || null,
            stats: paymentStats
          }
        },
        consistency: consistencyChecks,
        message: `Found ${mainSubscription ? '1' : '0'} main subscription, ${activeSubscription ? '1' : '0'} active subscription, ${paymentHistory.length} payment records`
      };

    } catch (error) {
      console.error('❌ Error verifying subscription data:', error);
      return {
        success: false,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        tables: null,
        consistency: null,
        message: 'Verification failed'
      };
    }
  }

  /**
   * Create a test subscription and verify all 3 tables are updated
   * @param userId - The authenticated user's ID
   * @param planDetails - Plan details for subscription creation
   */
  static async testSubscriptionCreation(userId: string, planDetails: any) {
    console.log('=== Testing Subscription Creation & 3-Table Integration ===');
    
    try {
      // Before state
      const beforeState = await this.verifyUserSubscriptionData(userId);
      console.log('📋 BEFORE subscription creation:', beforeState.message);

      // Create subscription
      console.log('🚀 Creating subscription...');
      const subscription = await FirebaseUserSubscriptionService.createSubscription(
        {
          userId,
          planId: planDetails.id,
          billingCycle: 'monthly',
          userDetails: {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            userId
          }
        },
        planDetails
      );

      console.log('✅ Subscription created:', subscription.id);

      // After state (wait 2 seconds for async operations)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const afterState = await this.verifyUserSubscriptionData(userId);
      console.log('📋 AFTER subscription creation:', afterState.message);

      return {
        success: true,
        subscriptionId: subscription.id,
        beforeState,
        afterState,
        message: '3-table integration test completed successfully'
      };

    } catch (error) {
      console.error('❌ Error testing subscription creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Subscription creation test failed'
      };
    }
  }
}
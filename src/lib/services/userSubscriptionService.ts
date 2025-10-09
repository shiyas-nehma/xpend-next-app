// Mock user subscription service
// In a real app, this would connect to your actual subscription database

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  monthlyPrice: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'cancelled' | 'expired';
  paymentMethod?: {
    type: 'card';
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for testing - toggle the commented section to test different states
const mockUserSubscriptions: Record<string, UserSubscription> = {
  // Comment/uncomment this to test with/without active subscription
  // 'test-user-id': {
  //   id: 'sub-123',
  //   userId: 'test-user-id',
  //   planId: 'plan-pro',
  //   planName: 'Pro Plan',
  //   monthlyPrice: 19.99,
  //   startDate: new Date('2024-01-01'),
  //   endDate: new Date('2025-07-08'),
  //   status: 'active',
  //   paymentMethod: {
  //     type: 'card',
  //     last4: '1234',
  //     expiryMonth: 6,
  //     expiryYear: 2028,
  //   },
  //   createdAt: new Date('2024-01-01'),
  //   updatedAt: new Date('2024-01-01'),
  // }
};

export class UserSubscriptionService {
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockUserSubscriptions[userId] || null;
  }

  static async createSubscription(userId: string, planId: string, planName: string, monthlyPrice: number): Promise<UserSubscription> {
    // Simulate creating a subscription
    const subscription: UserSubscription = {
      id: `sub-${Date.now()}`,
      userId,
      planId,
      planName,
      monthlyPrice,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active',
      paymentMethod: {
        type: 'card',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: 2028,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real app, this would save to your database
    mockUserSubscriptions[userId] = subscription;
    
    return subscription;
  }

  static async cancelSubscription(subscriptionId: string): Promise<void> {
    // Find and cancel the subscription
    Object.values(mockUserSubscriptions).forEach(sub => {
      if (sub.id === subscriptionId) {
        sub.status = 'cancelled';
        sub.updatedAt = new Date();
      }
    });
  }
}
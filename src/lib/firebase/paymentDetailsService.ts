import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'payment_details';

// Payment record interface
export interface PaymentRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  paymentAmount: number;
  currency: string;
  modeOfPayment: 'card' | 'bank' | 'other' | 'pending';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeInvoiceId?: string; // Added for invoice tracking
  cardDetails?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  userDetails: {
    email: string;
    firstName: string;
    lastName: string;
    userId: string;
  };
  subscriptionDetails?: {
    planName: string;
    billingCycle: 'monthly' | 'annual';
    startDate?: Date;
    endDate?: Date;
    status?: string;
  };
  planName: string;
  billingCycle: 'monthly' | 'annual';
  description?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payment creation data interface
export interface PaymentCreateData {
  userId: string;
  subscriptionId: string;
  paymentAmount: number;
  currency: string;
  modeOfPayment: 'card' | 'bank' | 'other' | 'pending';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeInvoiceId?: string; // Added for invoice tracking
  cardDetails?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  userDetails: {
    email: string;
    firstName: string;
    lastName: string;
    userId: string;
  };
  subscriptionDetails?: {
    planName: string;
    billingCycle: 'monthly' | 'annual';
    startDate?: Date;
    endDate?: Date;
    status?: string;
  };
  planName: string;
  billingCycle: 'monthly' | 'annual';
  description?: string;
}

// Payment statistics interface
export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  lastPaymentDate?: Date;
  averagePaymentAmount: number;
}

/**
 * PaymentDetailsService
 * 
 * Manages the payment_details collection for tracking all payment transactions
 * Includes payments for free plans (amount = 0) and paid plans
 */
class PaymentDetailsService {
  
  // Convert Firestore data to PaymentRecord object
  private static firestoreToPayment(data: Record<string, unknown>, id: string): PaymentRecord {
    return {
      id,
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      paymentAmount: data.paymentAmount || 0,
      currency: data.currency || 'usd',
      modeOfPayment: data.modeOfPayment || 'other',
      paymentStatus: data.paymentStatus || 'pending',
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeChargeId: data.stripeChargeId,
      stripeInvoiceId: data.stripeInvoiceId,
      cardDetails: data.cardDetails,
      userDetails: data.userDetails,
      subscriptionDetails: data.subscriptionDetails,
      planName: data.planName,
      billingCycle: data.billingCycle || 'monthly',
      description: data.description,
      paymentDate: data.paymentDate?.toDate() || data.createdAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  // Convert PaymentRecord to Firestore data
  private static paymentToFirestore(payment: Partial<PaymentRecord>): Record<string, unknown> {
    const data: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    // Copy non-date fields, filtering out undefined values
    Object.entries(payment).forEach(([key, value]) => {
      if (value !== undefined && !['paymentDate', 'createdAt', 'updatedAt'].includes(key)) {
        data[key] = value;
      }
    });

    // Convert dates to Firestore timestamps, only if they exist
    if (payment.paymentDate instanceof Date) {
      data.paymentDate = Timestamp.fromDate(payment.paymentDate);
    }
    if (payment.createdAt instanceof Date) {
      data.createdAt = Timestamp.fromDate(payment.createdAt);
    }

    return data;
  }

  // Create a new payment record
  static async createPayment(paymentData: PaymentCreateData): Promise<PaymentRecord> {
    try {
      const now = new Date();
      
      const payment: Omit<PaymentRecord, 'id'> = {
        ...paymentData,
        paymentDate: now,
        createdAt: now,
        updatedAt: now,
      };

      const firestoreData = this.paymentToFirestore(payment);
      firestoreData.createdAt = serverTimestamp();
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), firestoreData);
      
      console.log('Payment record created:', {
        id: docRef.id,
        userId: payment.userId,
        amount: payment.paymentAmount,
        planName: payment.planName
      });
      
      return {
        ...payment,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  // Get payment record by ID
  static async getPaymentById(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, paymentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.firestoreToPayment(docSnap.data(), docSnap.id);
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      throw error;
    }
  }

  // Get all payments for a user
  static async getPaymentsByUserId(userId: string): Promise<PaymentRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.firestoreToPayment(doc.data(), doc.id)
      );
    } catch (error) {
      console.error('Error getting payments by user ID:', error);
      throw error;
    }
  }

  // Get payments for a specific subscription
  static async getPaymentsBySubscriptionId(subscriptionId: string): Promise<PaymentRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('subscriptionId', '==', subscriptionId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.firestoreToPayment(doc.data(), doc.id)
      );
    } catch (error) {
      console.error('Error getting payments by subscription ID:', error);
      throw error;
    }
  }

  // Get recent payments for a user (limited)
  static async getRecentPayments(userId: string, limitCount: number = 10): Promise<PaymentRecord[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.firestoreToPayment(doc.data(), doc.id)
      );
    } catch (error) {
      console.error('Error getting recent payments:', error);
      throw error;
    }
  }

  // Update payment record
  static async updatePayment(paymentId: string, updateData: Partial<PaymentRecord>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, paymentId);
      const firestoreData = this.paymentToFirestore(updateData);
      
      await updateDoc(docRef, firestoreData);
      
      console.log('Payment record updated:', paymentId);
    } catch (error) {
      console.error('Error updating payment record:', error);
      throw error;
    }
  }

  // Get payment statistics for a user
  static async getPaymentStats(userId: string): Promise<PaymentStats> {
    try {
      const payments = await this.getPaymentsByUserId(userId);
      
      const totalPayments = payments.length;
      const totalAmount = payments.reduce((sum, payment) => sum + payment.paymentAmount, 0);
      const completedPayments = payments.filter(p => p.paymentStatus === 'completed').length;
      const pendingPayments = payments.filter(p => p.paymentStatus === 'pending').length;
      const failedPayments = payments.filter(p => p.paymentStatus === 'failed').length;
      
      const lastPaymentDate = payments.length > 0 ? payments[0].paymentDate : undefined;
      const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
      
      return {
        totalPayments,
        totalAmount,
        completedPayments,
        pendingPayments,
        failedPayments,
        lastPaymentDate,
        averagePaymentAmount,
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  // Real-time listener for user's payments
  static onPaymentsChange(
    userId: string, 
    callback: (payments: PaymentRecord[]) => void
  ): () => void {
    console.log('Setting up payments listener for userId:', userId);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      console.log('Payments listener fired for user:', userId);
      
      const payments = querySnapshot.docs.map(doc => 
        this.firestoreToPayment(doc.data(), doc.id)
      );
      
      console.log(`Found ${payments.length} payment record(s) for user:`, userId);
      
      callback(payments);
    }, (error) => {
      console.error('Error in payments listener:', error);
      callback([]);
    });
  }

  // Mark payment as completed
  static async markPaymentCompleted(
    paymentId: string, 
    stripePaymentIntentId?: string,
    stripeChargeId?: string,
    cardDetails?: PaymentRecord['cardDetails']
  ): Promise<void> {
    try {
      await this.updatePayment(paymentId, {
        paymentStatus: 'completed',
        stripePaymentIntentId,
        stripeChargeId,
        cardDetails,
        paymentDate: new Date(),
      });
      
      console.log('Payment marked as completed:', paymentId);
    } catch (error) {
      console.error('Error marking payment as completed:', error);
      throw error;
    }
  }

  // Mark payment as failed
  static async markPaymentFailed(paymentId: string, reason?: string): Promise<void> {
    try {
      await this.updatePayment(paymentId, {
        paymentStatus: 'failed',
        description: reason ? `Failed: ${reason}` : 'Payment failed',
      });
      
      console.log('Payment marked as failed:', paymentId);
    } catch (error) {
      console.error('Error marking payment as failed:', error);
      throw error;
    }
  }
}

export default PaymentDetailsService;
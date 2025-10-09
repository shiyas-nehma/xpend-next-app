const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase config for testing
const firebaseConfig = {
  apiKey: "AIzaSyAbfAAFf_teW5TyGQwCU8g-IUQmWifZNAw",
  authDomain: "testxpend.firebaseapp.com",
  projectId: "testxpend",
  storageBucket: "testxpend.firebasestorage.app",
  messagingSenderId: "1094056735477",
  appId: "1:1094056735477:web:8e292f05f29fd6e0facbbc",
  measurementId: "G-D5XY3GRYQF"
};

async function testFirebaseConnection() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Testing Firestore connection...');
    
    // Test creating a plan
    const freePlan = {
      name: 'Free Test Plan',
      monthlyPrice: 0,
      annualDiscountPct: 0,
      features: ['Test feature'],
      featureLimits: {
        maxCategories: 3,
        maxIncomes: 5,
        maxExpenses: 5,
        maxAccounts: 1,
        maxBudgets: 1,
        analyticsAccess: false,
        reportGeneration: false,
        dataExport: false,
        apiAccess: false,
        prioritySupport: false,
        customIntegrations: false,
      },
      status: 'active',
      subscribers: 0,
      trialDays: 0,
      maxDuration: 365,
      durationType: 'days',
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'subscriptionPlans'), freePlan);
    console.log('Successfully created plan with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error testing Firebase:', error);
    throw error;
  }
}

// Run the test
testFirebaseConnection()
  .then((planId) => {
    console.log('Firebase test completed successfully. Plan ID:', planId);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Firebase test failed:', error);
    process.exit(1);
  });
'use client';

import React from 'react';
import FirebaseDebugger from '@/components/debug/FirebaseDebugger';

export default function FirebaseDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FirebaseDebugger />
    </div>
  );
}
"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserExtraProfile, upsertUserExtraProfile } from '@/lib/firebase/userProfileService';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface CurrencyState {
  code: string;
  symbol: string;
  loading: boolean;
  setCurrency: (code: string, symbol?: string) => Promise<void>;
  format: (amount: number, opts?: Intl.NumberFormatOptions) => string;
}

const CurrencyContext = createContext<CurrencyState | undefined>(undefined);

const DEFAULT_CODE = 'USD';
const DEFAULT_SYMBOL = '$';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let active = true;

    const init = async () => {
      if (!user) {
        // Reset to defaults when user logs out
        setCode(DEFAULT_CODE);
        setSymbol(DEFAULT_SYMBOL);
        return;
      }
      setLoading(true);
      try {
        // Immediate fetch so UI has current values before listener fires
        const profile = await getUserExtraProfile();
        if (active && profile) {
          setCode(profile.currency || DEFAULT_CODE);
          setSymbol(profile.currencySymbol || DEFAULT_SYMBOL);
        }
      } finally {
        if (active) setLoading(false);
      }

      // Set up real-time listener
      const ref = doc(db, 'user_profiles', user.uid);
      unsub = onSnapshot(ref, snap => {
        if (!snap.exists()) return; // keep previous values
        const data = snap.data() as any;
        setCode(data.currency || DEFAULT_CODE);
        setSymbol(data.currencySymbol || DEFAULT_SYMBOL);
      });
    };

    init();
    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [user]);

  const setCurrency = useCallback(async (newCode: string, newSymbol?: string) => {
    // Optimistic update; Firestore listener will confirm / overwrite if needed.
    setCode(newCode);
    setSymbol(newSymbol || symbol || DEFAULT_SYMBOL);
    try {
      await upsertUserExtraProfile({ currency: newCode, currencySymbol: newSymbol || symbol || DEFAULT_SYMBOL });
    } catch (e) {
      // Revert on failure
      console.error('Failed to update currency preference', e);
      const profile = await getUserExtraProfile();
      if (profile) {
        setCode(profile.currency || DEFAULT_CODE);
        setSymbol(profile.currencySymbol || DEFAULT_SYMBOL);
      }
    }
  }, [symbol]);

  const format = useCallback((amount: number, opts: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      ...opts
    }).format(amount);
  }, [code]);

  return (
    <CurrencyContext.Provider value={{ code, symbol, loading, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};

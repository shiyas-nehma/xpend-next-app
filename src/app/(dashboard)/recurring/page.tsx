'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { useData } from '@/hooks/useData';
import { RepeatIcon, TrashIcon, PencilIcon, InformationCircleIcon } from '@/components/icons/NavIcons';
import type { Expense, Income, Recurrence } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/useToast';

// Simple utility to compute next occurrence date (not persisted)
function computeFutureOccurrences(baseDate: string, rec: Recurrence | undefined, existingDates: string[], count: number): string[] {
  if (!rec || rec.status === 'Paused' || count <= 0) return [];
  const sorted = [...existingDates].sort((a,b)=> new Date(a).getTime()-new Date(b).getTime());
  const last = sorted[sorted.length-1] || baseDate;
  const cursor = new Date(last);
  const advances: string[] = [];
  const advance = () => {
    switch (rec.frequency) {
      case 'Daily': cursor.setDate(cursor.getDate()+1); break;
      case 'Weekly': cursor.setDate(cursor.getDate()+7); break;
      case 'Monthly': cursor.setMonth(cursor.getMonth()+1); break;
      case 'Yearly': cursor.setFullYear(cursor.getFullYear()+1); break;
    }
  };
  while (advances.length < count) {
    advance();
    const nextStr = cursor.toISOString().split('T')[0];
    if (rec.end.type === 'OnDate' && typeof rec.end.value === 'string' && nextStr > rec.end.value) break;
    if (rec.end.type === 'After' && typeof rec.end.value === 'number') {
      if (existingDates.length + advances.length >= rec.end.value) break;
    }
    advances.push(nextStr);
  }
  return advances;
}

const RecurringPage: React.FC = () => {
  const { expenses, incomes, updateExpense, updateIncome } = useData();
  const { addToast } = useToast();
  const [showType, setShowType] = useState<'All'|'Expense'|'Income'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ frequency: Recurrence['frequency']; endType: Recurrence['end']['type']; endValue?: string | number }>({ frequency: 'Monthly', endType: 'Never' });

  const parents = useMemo(() => {
    const expenseParents = expenses.filter(e => e.recurrence && !e.generated);
    const incomeParents = incomes.filter(i => i.recurrence && !i.generated);
    return [
      ...(showType === 'All' || showType === 'Expense' ? expenseParents.map(p => ({ kind: 'Expense' as const, record: p })) : []),
      ...(showType === 'All' || showType === 'Income' ? incomeParents.map(p => ({ kind: 'Income' as const, record: p })) : []),
    ];
  }, [expenses, incomes, showType]);

  const handleToggle = useCallback(async (kind: 'Expense'|'Income', item: Expense|Income) => {
    const current = item.recurrence;
    if (!current) return;
    const nextStatus = current.status === 'Paused' ? 'Active' : 'Paused';
    const updated: Expense | Income = { ...item, recurrence: { ...current, status: nextStatus } } as Expense | Income;
    try {
      if (kind === 'Expense') await (updateExpense as (e: Expense)=>Promise<void>)(updated as Expense);
      else await (updateIncome as (i: Income)=>Promise<void>)(updated as Income);
      addToast(`Recurrence ${nextStatus === 'Paused' ? 'paused' : 'resumed'}`, 'info');
    } catch (e) {
      addToast('Failed to toggle recurrence', 'error');
    }
  }, [updateExpense, updateIncome, addToast]);

  const handleStop = useCallback(async (kind: 'Expense'|'Income', item: Expense|Income) => {
    if (!item.recurrence) return;
  // Remove recurrence by setting undefined (update layer interprets undefined vs null differently; we want null persisted so retain explicit null in a loose cast)
  const updated = { ...(item as any), recurrence: null } as unknown as Expense | Income;
    try {
      if (kind === 'Expense') await (updateExpense as (e: Expense)=>Promise<void>)(updated as Expense);
      else await (updateIncome as (i: Income)=>Promise<void>)(updated as Income);
      addToast('Recurrence stopped (rule removed). Existing instances kept.', 'warning');
    } catch {
      addToast('Failed to stop recurrence', 'error');
    }
  }, [updateExpense, updateIncome, addToast]);

  const startEdit = useCallback((r: { kind: 'Expense'|'Income'; record: Expense|Income }) => {
    if (!r.record.recurrence) return;
    setEditingId(r.record.docId || null);
    setEditForm({
      frequency: r.record.recurrence.frequency,
      endType: r.record.recurrence.end.type,
      endValue: r.record.recurrence.end.value,
    });
  }, []);

  const submitEdit = useCallback(async (row: { kind: 'Expense'|'Income'; record: Expense|Income }) => {
    if (!editingId || !row.record.recurrence) return;
    const rec: Recurrence = {
      frequency: editForm.frequency,
      end: { type: editForm.endType, ...(editForm.endType === 'After' ? { value: Number(editForm.endValue)||0 } : editForm.endType === 'OnDate' ? { value: editForm.endValue } : {}) },
      status: row.record.recurrence.status || 'Active'
    };
    const updated: Expense | Income = { ...row.record, recurrence: rec } as Expense | Income;
    try {
      if (row.kind === 'Expense') await (updateExpense as (e: Expense)=>Promise<void>)(updated as Expense);
      else await (updateIncome as (i: Income)=>Promise<void>)(updated as Income);
      addToast('Recurrence updated', 'success');
      setEditingId(null);
    } catch {
      addToast('Failed to update recurrence', 'error');
    }
  }, [editingId, editForm, updateExpense, updateIncome, addToast]);

  const rows = useMemo(() => parents.map(p => {
    const rec = p.record.recurrence!;
    // Gather existing generated dates for this parent
    const siblings = (p.kind === 'Expense' ? expenses : incomes).filter(r => r.recurrenceParentId === p.record.docId || r.docId === p.record.docId);
    const dates = siblings.map(s => s.date);
    const next3 = computeFutureOccurrences(p.record.date, rec, dates, 3);
    return { ...p, rec, next3, total: dates.length };
  }), [parents, expenses, incomes]);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-brand-text-primary flex items-center gap-2"><RepeatIcon className="w-6 h-6" /> Recurring</h1>
        <div className="flex items-center gap-2">
          {(['All','Expense','Income'] as const).map(t => (
            <button key={t} onClick={()=>setShowType(t)} className={`px-3 py-1 text-sm rounded-md border ${showType===t?'bg-brand-surface-2 text-white border-brand-blue':'border-brand-border text-brand-text-secondary hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-brand-text-secondary">No recurring items yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-brand-text-secondary border-b border-brand-border/60">
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="py-2 pr-4 font-medium">Frequency</th>
                <th className="py-2 pr-4 font-medium">End</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Occurrences</th>
                <th className="py-2 pr-4 font-medium">Upcoming</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
              {rows.map(r => (
                <motion.tr key={r.record.docId} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} className="border-b border-brand-border/30">
                  <td className="py-2 pr-4 align-top"><span className={`px-2 py-0.5 rounded text-xs ${r.kind==='Expense'?'bg-red-500/15 text-red-400':'bg-blue-500/15 text-blue-400'}`}>{r.kind}</span></td>
                  <td className="py-2 pr-4 align-top max-w-[220px]">
                    <div className="font-medium text-brand-text-primary truncate" title={r.record.description}>{r.record.description}</div>
                    <div className="text-xs text-brand-text-secondary truncate">{r.record.category.name}</div>
                  </td>
                  <td className="py-2 pr-4 align-top">{r.rec.frequency}</td>
                  <td className="py-2 pr-4 align-top text-xs">
                    {r.rec.end.type==='Never' && 'Never'}
                    {r.rec.end.type==='After' && `After ${r.rec.end.value} occ.`}
                    {r.rec.end.type==='OnDate' && `On ${r.rec.end.value}`}
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${r.rec.status==='Paused'?'bg-yellow-500/10 text-yellow-400 border-yellow-500/30':'bg-green-500/10 text-green-400 border-green-500/30'}`}>{r.rec.status || 'Active'}</span>
                  </td>
                  <td className="py-2 pr-4 align-top text-xs">{r.total}{r.rec.end.type==='After' && r.rec.end.value ? ` / ${r.rec.end.value}`:''}</td>
                  <td className="py-2 pr-4 align-top text-xs min-w-[160px]">{r.next3.length? r.next3.join(', ') : <span className="text-brand-text-secondary/60">—</span>}</td>
                  <td className="py-2 pr-4 align-top">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>handleToggle(r.kind, r.record)} className="px-2 py-1 text-xs rounded bg-brand-surface-2 hover:bg-brand-border border border-brand-border text-brand-text-secondary hover:text-white transition">
                        {r.rec.status==='Paused' ? 'Resume' : 'Pause'}
                      </button>
                      <button onClick={()=>startEdit(r)} className="p-1 rounded hover:bg-brand-border/50" title="Edit recurrence"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={()=>handleStop(r.kind, r.record)} className="p-1 rounded hover:bg-red-500/20" title="Stop recurrence (remove rule)"><TrashIcon className="w-4 h-4 text-red-400" /></button>
                    </div>
                    {editingId === r.record.docId && (
                      <div className="mt-2 p-2 border border-brand-border rounded bg-brand-surface-2 space-y-2">
                        <div className="flex gap-2 items-center">
                          <label className="text-xs w-16">Freq</label>
                          <select value={editForm.frequency} onChange={e=>setEditForm(f=>({...f, frequency: e.target.value as Recurrence['frequency']}))} className="flex-1 bg-brand-surface-3 border border-brand-border rounded px-2 py-1 text-xs">
                            {['Daily','Weekly','Monthly','Yearly'].map(f=> <option key={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2 items-center">
                          <label className="text-xs w-16">End</label>
                          <select value={editForm.endType} onChange={e=>setEditForm(f=>({ ...f, endType: e.target.value as Recurrence['end']['type'], endValue: undefined }))} className="flex-1 bg-brand-surface-3 border border-brand-border rounded px-2 py-1 text-xs">
                            {['Never','After','OnDate'].map(et=> <option key={et}>{et}</option>)}
                          </select>
                        </div>
                        {editForm.endType==='After' && (
                          <input type="number" value={editForm.endValue as number || ''} onChange={e=>setEditForm(f=>({...f, endValue: e.target.value}))} placeholder="# occurrences" className="w-full bg-brand-surface-3 border border-brand-border rounded px-2 py-1 text-xs" />
                        )}
                        {editForm.endType==='OnDate' && (
                          <input type="date" value={editForm.endValue as string || ''} onChange={e=>setEditForm(f=>({...f, endValue: e.target.value}))} className="w-full bg-brand-surface-3 border border-brand-border rounded px-2 py-1 text-xs" />
                        )}
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={()=>setEditingId(null)} className="text-xs px-2 py-1 rounded bg-brand-surface-3 hover:bg-brand-border/60 border border-brand-border">Cancel</button>
                          <button onClick={()=>submitEdit(r)} className="text-xs px-2 py-1 rounded bg-brand-blue text-white hover:brightness-110">Save</button>
                        </div>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
      <div className="text-xs text-brand-text-secondary flex items-start gap-2 max-w-prose">
        <InformationCircleIcon className="w-4 h-4" />
        <p>Upcoming dates (up to 3) are simulated client-side; stopping removes the rule without deleting past instances. Edit lets you change frequency/end. Pause skips generation temporarily.</p>
      </div>
    </motion.div>
  );
};

export default RecurringPage;

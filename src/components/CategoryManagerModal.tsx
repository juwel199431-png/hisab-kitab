import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Tags, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';
import { Category } from '../types/finance';

export const CategoryManagerModal: React.FC = () => {
  const { data, lang, t, isCategoryModalOpen, setIsCategoryModalOpen, addCategory, deleteCategory } = useFinance();

  const [activeSectionTab, setActiveSectionTab] = useState<'bd-bank' | 'kuwait-personal' | 'boss-salary'>('bd-bank');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');

  if (!isCategoryModalOpen) return null;

  const currentCategories = data.categories.filter((c) => {
    if (activeSectionTab === 'kuwait-personal') return c.section === 'kuwait-personal';
    if (activeSectionTab === 'boss-salary') return c.section === 'boss-salary';
    return c.section === 'bd-bank';
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim() && !nameEn.trim()) return;

    addCategory({
      nameBn: nameBn.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameBn.trim(),
      type: activeSectionTab === 'kuwait-personal' || activeSectionTab === 'boss-salary' ? 'expense' : newCatType,
      section: activeSectionTab,
    });

    setNameBn('');
    setNameEn('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              {lang === 'bn' ? 'ক্যাটাগরি ম্যানেজমেন্ট (খাত ব্যবস্থাপনা)' : 'Manage Categories'}
            </h2>
          </div>
          <button
            onClick={() => setIsCategoryModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 bg-white">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveSectionTab('bd-bank')}
              className={`py-1.5 px-2 rounded-md transition-colors ${
                activeSectionTab === 'bd-bank'
                  ? 'bg-white text-emerald-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'বাংলাদেশের ব্যাংকের হিসাব বিবরনী' : 'BD Bank Statement'}
            </button>
            <button
              onClick={() => setActiveSectionTab('kuwait-personal')}
              className={`py-1.5 px-2 rounded-md transition-colors ${
                activeSectionTab === 'kuwait-personal'
                  ? 'bg-white text-amber-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'কুয়েত খরচ' : 'Kuwait Daily'}
            </button>
            <button
              onClick={() => setActiveSectionTab('boss-salary')}
              className={`py-1.5 px-2 rounded-md transition-colors ${
                activeSectionTab === 'boss-salary'
                  ? 'bg-white text-indigo-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'বসের খরচ' : 'Boss Expense'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'নতুন ক্যাটাগরি তৈরি করুন' : 'Create New Category'}</span>
            </h3>

            {activeSectionTab === 'bd-bank' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewCatType('expense')}
                  className={`flex-1 py-1 rounded text-xs font-semibold border ${
                    newCatType === 'expense'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  খরচ / ব্যয় (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setNewCatType('income')}
                  className={`flex-1 py-1 rounded text-xs font-semibold border ${
                    newCatType === 'income'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  জমা / আয় (Income)
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  বাংলা নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ইন্টারনেট বিল"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  English Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Internet Bill"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md"
              >
                {lang === 'bn' ? 'ক্যাটাগরি যুক্ত করুন' : 'Add Category'}
              </button>
            </div>
          </form>

          {/* List of existing categories */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              {lang === 'bn' ? 'বিদ্যমান ক্যাটাগরি তালিকা' : 'Existing Categories'} ({currentCategories.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-2 rounded border border-slate-200 bg-white flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900">{lang === 'bn' ? cat.nameBn : cat.nameEn}</p>
                    <p className="text-[10px] text-slate-500">{cat.nameEn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        cat.type === 'income'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {cat.type === 'income' ? 'আয়' : 'ব্যয়'}
                    </span>
                    {cat.isCustom && (
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

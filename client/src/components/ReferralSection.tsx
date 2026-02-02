import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/utils';
import { Copy, Check, Gift, AlertCircle, CheckCircle, XCircle, TrendingUp, X, Award, BarChart3 } from 'lucide-react';

interface ReferralStats {
  total: number;
  pending: number;
  confirmed: number;
  invalid: number;
}

interface Tier {
  threshold: number;
  unlocked: boolean;
  status: string | null;
  unlockedAt?: string;
}

interface ReferralData {
  stats: ReferralStats;
  tiers: {
    tier1: Tier;
    tier2: Tier;
    tier3: Tier;
    tier4: Tier;
  };
  nextTier: {
    tier: number;
    threshold: number;
    remaining: number;
  } | null;
  code: string;
  referralLink: string;
}

type TabType = 'referral' | 'perks' | 'dashboard';

const ReferralSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('referral');
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      console.log('Fetching referral data for user:', currentUser.uid);
      fetchReferralData();
    }
  }, [currentUser, isOpen]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
      console.log('🌐 Fetching from:', serverUrl);
      console.log('👤 Current user:', currentUser?.uid);
      
      let statsRes, codeRes;
      
      try {
        [statsRes, codeRes] = await Promise.all([
          apiFetch(`${serverUrl}/api/v1/referrals/stats`, {
            method: 'GET',
          }),
          apiFetch(`${serverUrl}/api/v1/referrals/my-code`, {
            method: 'GET',
          }),
        ]);
        
        console.log('📡 API Responses:', {
          stats: { ok: statsRes.ok, status: statsRes.status },
          code: { ok: codeRes.ok, status: codeRes.status }
        });
      } catch (err) {
        console.error('❌ Network error fetching referral data:', err);
        setLoading(false);
        setData({
          stats: { total: 0, pending: 0, confirmed: 0, invalid: 0 },
          tiers: {
            tier1: { threshold: 10, unlocked: false, status: null },
            tier2: { threshold: 50, unlocked: false, status: null },
            tier3: { threshold: 150, unlocked: false, status: null },
            tier4: { threshold: 300, unlocked: false, status: null },
          },
          nextTier: { tier: 1, threshold: 10, remaining: 10 },
          code: 'Error',
          referralLink: 'Error',
        });
        return;
      }
      
      // Check if responses are ok
      if (!statsRes.ok || !codeRes.ok) {
        const statsText = await statsRes.text().catch(() => '');
        const codeText = await codeRes.text().catch(() => '');
        console.error('❌ API error:', {
          statsStatus: statsRes.status,
          codeStatus: codeRes.status,
          statsStatusText: statsRes.statusText,
          codeStatusText: codeRes.statusText,
          statsBody: statsText,
          codeBody: codeText,
        });
      }

      let statsData, codeData;
      
      try {
        statsData = await statsRes.json();
        codeData = await codeRes.json();
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        setLoading(false);
        return;
      }

      console.log('API Response - Stats:', statsData);
      console.log('API Response - Code:', codeData);

      const finalStats = statsData.success ? statsData.data : {
        stats: { total: 0, pending: 0, confirmed: 0, invalid: 0 },
        tiers: {
          tier1: { threshold: 10, unlocked: false, status: null },
          tier2: { threshold: 50, unlocked: false, status: null },
          tier3: { threshold: 150, unlocked: false, status: null },
          tier4: { threshold: 300, unlocked: false, status: null },
        },
        nextTier: { tier: 1, threshold: 10, remaining: 10 },
      };

      if (!codeData.success) {
        console.error('❌ Code fetch failed:', {
          message: codeData.message,
          status: codeRes.status,
          statusText: codeRes.statusText,
          fullResponse: codeData,
          userId: currentUser?.uid
        });
        
        // If 401, show auth error
        if (codeRes.status === 401) {
          console.error('🔐 Authentication failed - user may not be logged in properly');
        }
      }

      // Handle code data
      if (codeData.success && codeData.data) {
        const code = codeData.data.code;
        const link = codeData.data.referral_link || `https://nexuschat.in/ref/${code}`;
        
        if (code && code !== 'N/A' && code !== 'Error') {
          setData({
            ...finalStats,
            code: code,
            referralLink: link,
          });
        } else {
          // Code exists but is invalid
          console.warn('Invalid code received:', code);
          setData({
            ...finalStats,
            code: 'N/A',
            referralLink: 'N/A',
          });
        }
      } else {
        // API call failed - show error details
        console.error('Failed to fetch referral code:', {
          success: codeData.success,
          message: codeData.message,
          status: codeRes.status,
          data: codeData
        });
        
        // Still set data with N/A so UI doesn't break
        setData({
          ...finalStats,
          code: 'N/A',
          referralLink: 'N/A',
        });
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setData({
        stats: { total: 0, pending: 0, confirmed: 0, invalid: 0 },
        tiers: {
          tier1: { threshold: 10, unlocked: false, status: null },
          tier2: { threshold: 50, unlocked: false, status: null },
          tier3: { threshold: 150, unlocked: false, status: null },
          tier4: { threshold: 300, unlocked: false, status: null },
        },
        nextTier: { tier: 1, threshold: 10, remaining: 10 },
        code: 'Error',
        referralLink: 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedItem(item);
      setTimeout(() => {
        setCopied(false);
        setCopiedItem(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyReferralLink = () => {
    if (!data?.referralLink || data.referralLink === 'N/A') return;
    copyToClipboard(data.referralLink, 'link');
  };

  if (!isOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Gift className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">Referrals</div>
              <div className="text-xs text-zinc-400">Earn rewards by inviting friends</div>
            </div>
          </div>
          <div className="text-green-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Minimal Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-lg p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Gift className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">Referrals</div>
              <div className="text-xs text-zinc-400">
                {data ? `${data.stats.confirmed} confirmed` : 'Loading...'}
              </div>
            </div>
          </div>
          <div className="text-green-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-md rounded-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-500" />
                Referrals
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('referral')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'referral'
                    ? 'text-green-500 border-b-2 border-green-500'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span>Referral</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('perks')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'perks'
                    ? 'text-green-500 border-b-2 border-green-500'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Perks</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'text-green-500 border-b-2 border-green-500'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                if (loading) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-zinc-400">Loading...</div>
                    </div>
                  );
                }
                if (!data) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-red-400">Error loading data</div>
                    </div>
                  );
                }
                return (
                <>
                  {/* Referral Tab */}
                  {activeTab === 'referral' && (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-green-500 mb-2">
                          {data.stats.confirmed}
                        </div>
                        <div className="text-sm text-zinc-400">
                          People joined via your referral
                        </div>
                      </div>

                      {data.code === 'N/A' || data.code === 'Error' ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center space-y-3">
                          <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                          <p className="text-sm text-yellow-500 mb-2">
                            {data.code === 'Error' 
                              ? 'Unable to load referral code'
                              : 'Referral code is being generated...'}
                          </p>
                          <div className="text-xs text-zinc-400 space-y-1">
                            <p>User ID: {currentUser?.uid || 'Not found'}</p>
                            <p>Please check browser console (F12) for details</p>
                          </div>
                          <button
                            onClick={() => {
                              setLoading(true);
                              fetchReferralData();
                            }}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            {loading ? 'Loading...' : 'Refresh'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="referral-code" className="text-sm text-zinc-400 mb-2 block">
                              Your Referral Code
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id="referral-code"
                                type="text"
                                value={data.code}
                                readOnly
                                className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 font-mono text-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(data.code, 'code')}
                                disabled={data.code === 'N/A' || data.code === 'Error'}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              >
                                {copied && copiedItem === 'code' ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="referral-link" className="text-sm text-zinc-400 mb-2 block">
                              Your Referral Link
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id="referral-link"
                                type="text"
                                value={data.referralLink}
                                readOnly
                                className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 text-xs"
                              />
                              <button
                                onClick={copyReferralLink}
                                disabled={data.referralLink === 'N/A' || data.referralLink === 'Error'}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              >
                                {copied && copiedItem === 'link' ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Perks Tab */}
                  {activeTab === 'perks' && (
                    <div className="space-y-4">
                      {data.nextTier && (
                        <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                          <div className="text-sm text-zinc-400 mb-2">
                            Progress to Tier {data.nextTier.tier}
                          </div>
                          <div className="w-full bg-zinc-700 rounded-full h-2 mb-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((data.stats.confirmed / data.nextTier.threshold) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-zinc-500">
                            {data.stats.confirmed} / {data.nextTier.threshold} • {data.nextTier.remaining} more needed
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {[
                          { key: 'tier1', label: 'Tier 1', threshold: 10, reward: '1 Month Premium' },
                          { key: 'tier2', label: 'Tier 2', threshold: 50, reward: 'Ultra Premium AI + Coupons' },
                          { key: 'tier3', label: 'Tier 3', threshold: 150, reward: 'Exclusive Merchandise' },
                          { key: 'tier4', label: 'Tier 4', threshold: 300, reward: '1 Year Premium + Cash + Benefits' },
                        ].map(({ key, label, threshold, reward }) => {
                          const tier = data.tiers[key as keyof typeof data.tiers];
                          const isUnlocked = tier.unlocked;
                          const isConfirmed = tier.status === 'confirmed' || tier.status === 'paid';
                          const isPending = tier.status === 'pending' || (tier.status === null && isUnlocked);

                          let borderColor = 'border-zinc-700';
                          if (isUnlocked) {
                            borderColor = isConfirmed ? 'border-green-500' : 'border-yellow-500';
                          }

                          let statusDisplay;
                          if (isUnlocked) {
                            if (isPending) {
                              statusDisplay = (
                                <span className="text-yellow-500 text-xs flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Pending
                                </span>
                              );
                            } else {
                              statusDisplay = (
                                <span className="text-green-500 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Unlocked
                                </span>
                              );
                            }
                          } else {
                            statusDisplay = <span className="text-zinc-500 text-xs">Locked</span>;
                          }

                          return (
                            <div
                              key={key}
                              className={`bg-zinc-800 rounded-lg p-4 border ${borderColor}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-white text-sm">
                                    {label}: {threshold} Referrals
                                  </div>
                                  <div className="text-xs text-zinc-400 mt-1">{reward}</div>
                                </div>
                                <div>{statusDisplay}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dashboard Tab */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className="text-4xl font-bold text-green-500 mb-2">
                          {data.stats.confirmed}
                        </div>
                        <div className="text-sm text-zinc-400">
                          Total Confirmed Referrals
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-800 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">Pending</span>
                          </div>
                          <div className="text-2xl font-bold text-white">{data.stats.pending}</div>
                          <div className="text-xs text-zinc-400 mt-1">Awaiting</div>
                        </div>

                        <div className="bg-zinc-800 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">Confirmed</span>
                          </div>
                          <div className="text-2xl font-bold text-white">{data.stats.confirmed}</div>
                          <div className="text-xs text-zinc-400 mt-1">Verified</div>
                        </div>

                        <div className="bg-zinc-800 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">Invalid</span>
                          </div>
                          <div className="text-2xl font-bold text-white">{data.stats.invalid}</div>
                          <div className="text-xs text-zinc-400 mt-1">Rejected</div>
                        </div>
                      </div>

                      <div className="bg-zinc-800 rounded-lg p-4 mt-4">
                        <div className="text-sm text-zinc-400 mb-2">Total Referrals</div>
                        <div className="text-2xl font-bold text-white">{data.stats.total}</div>
                      </div>
                    </div>
                  )}
                </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReferralSection;

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAutoBettingDecisions, type AutoBettingDecision } from '@/lib/auto-betting-api';

export default function AutoBettingDecisionsPage() {
  const [decisions, setDecisions] = useState<AutoBettingDecision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      setLoading(true);
      const data = await getAutoBettingDecisions('default', 100);
      setDecisions(data.decisions);
    } catch (error) {
      console.error('Failed to load decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/auto-betting" className="text-blue-400 hover:text-blue-300 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Decision History</h1>
            <p className="text-gray-400 mt-1">Auto-betting decisions and reasoning</p>
          </div>
        </div>

        {/* Decisions Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Opp ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Decision</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reason</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Stake</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Edge</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {decisions.map((decision) => (
                  <tr key={decision.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(decision.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {decision.opportunity_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        decision.decision === 'placed' ? 'bg-green-900/30 text-green-400' :
                        decision.decision === 'partial' ? 'bg-yellow-900/30 text-yellow-400' :
                        decision.decision === 'error' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {decision.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                      {decision.decision_reason}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-300">
                      {decision.calculated_stake ? `$${decision.calculated_stake.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-300">
                      {decision.calculated_edge ? `${decision.calculated_edge.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-300">
                      {decision.execution_time_ms ? `${decision.execution_time_ms}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {decisions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No decisions yet. Enable auto-betting to start seeing decisions here.
          </div>
        )}
      </div>
    </div>
  );
}



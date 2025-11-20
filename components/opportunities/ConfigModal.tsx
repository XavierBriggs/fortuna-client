import { useState, useEffect } from 'react';
import { BotConfig, getBotConfig, updateBotConfig } from '@/lib/api-opportunities';
import { X, Save, RefreshCw } from 'lucide-react';

interface ConfigModalProps {
    onClose: () => void;
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
    const [config, setConfig] = useState<BotConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await getBotConfig();
            setConfig(data);
        } catch (err) {
            setError('Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        try {
            setSaving(true);
            await updateBotConfig(config);
            onClose();
        } catch (err) {
            setError('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof BotConfig, value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            [field]: parseFloat(value) || 0,
        });
    };

    if (!config && loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card p-6 rounded-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card w-full max-w-md rounded-lg shadow-lg border border-border">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Bot Configuration</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 p-3 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {config && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Min Edge %</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={config.min_edge_pct}
                                    onChange={(e) => handleChange('min_edge_pct', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Minimum edge required to place a bet.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Kelly Fraction</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={config.kelly_fraction}
                                    onChange={(e) => handleChange('kelly_fraction', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Fraction of Kelly criterion to use (e.g. 0.1 for 10%).</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Max Stake ($)</label>
                                <input
                                    type="number"
                                    value={config.max_stake}
                                    onChange={(e) => handleChange('max_stake', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Maximum amount to bet on a single opportunity.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Min Unit Size ($)</label>
                                <input
                                    type="number"
                                    value={config.min_unit_size}
                                    onChange={(e) => handleChange('min_unit_size', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Minimum bet size allowed.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Default Bankroll ($)</label>
                                <input
                                    type="number"
                                    value={config.bankroll}
                                    onChange={(e) => handleChange('bankroll', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Fallback bankroll if dynamic fetch fails.</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

import { BoxScore } from '@/lib/stores/games-store';

interface BoxScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxScore?: BoxScore;
  sportKey: string;
}

export function BoxScoreModal({ isOpen, onClose, boxScore, sportKey }: BoxScoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {boxScore ? `${boxScore.game.away_team} @ ${boxScore.game.home_team}` : 'Box Score'}
              </h2>
              {boxScore && (
                <p className="text-muted-foreground mt-1">
                  {boxScore.game.status === 'live' 
                    ? `LIVE - ${boxScore.game.period_label} ${boxScore.game.time_remaining}`
                    : boxScore.game.status === 'final'
                    ? 'FINAL'
                    : 'Upcoming'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {!boxScore ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading box score...</p>
            </div>
          ) : boxScore.game.status === 'upcoming' ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-2">Game hasn't started yet</h3>
              <p className="text-muted-foreground">
                Box scores will be available once the game begins
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Summary */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Away</div>
                    <div className="text-2xl font-bold">{boxScore.game.away_team_abbr}</div>
                    <div className="text-3xl font-bold text-primary">{boxScore.game.away_score}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-muted-foreground">vs</span>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Home</div>
                    <div className="text-2xl font-bold">{boxScore.game.home_team_abbr}</div>
                    <div className="text-3xl font-bold text-primary">{boxScore.game.home_score}</div>
                  </div>
                </div>
              </div>

              {/* Period Scores */}
              {boxScore.period_scores && boxScore.period_scores.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Scoring by Period</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Team</th>
                          {boxScore.period_scores.map((p, i) => (
                            <th key={i} className="text-center py-2 px-3">{p.label}</th>
                          ))}
                          <th className="text-center py-2 px-3 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">{boxScore.game.away_team_abbr}</td>
                          {boxScore.period_scores.map((p, i) => (
                            <td key={i} className="text-center py-2 px-3">{p.away_score}</td>
                          ))}
                          <td className="text-center py-2 px-3 font-bold">{boxScore.game.away_score}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium">{boxScore.game.home_team_abbr}</td>
                          {boxScore.period_scores.map((p, i) => (
                            <td key={i} className="text-center py-2 px-3">{p.home_score}</td>
                          ))}
                          <td className="text-center py-2 px-3 font-bold">{boxScore.game.home_score}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Player Stats */}
              {sportKey === 'basketball_nba' && boxScore.away_players && boxScore.away_players.length > 0 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{boxScore.game.away_team} Stats</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 sticky left-0 bg-card">Player</th>
                            <th className="text-center py-2 px-2">MIN</th>
                            <th className="text-center py-2 px-2">PTS</th>
                            <th className="text-center py-2 px-2">REB</th>
                            <th className="text-center py-2 px-2">AST</th>
                            <th className="text-center py-2 px-2">FG</th>
                            <th className="text-center py-2 px-2">3PT</th>
                            <th className="text-center py-2 px-2">FT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boxScore.away_players.map((player, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2 px-3 font-medium sticky left-0 bg-card">{player.player_name}</td>
                              <td className="text-center py-2 px-2">{player.stats.minutes || '-'}</td>
                              <td className="text-center py-2 px-2 font-semibold">{player.stats.points || 0}</td>
                              <td className="text-center py-2 px-2">{player.stats.rebounds || 0}</td>
                              <td className="text-center py-2 px-2">{player.stats.assists || 0}</td>
                              <td className="text-center py-2 px-2">{player.stats.fg || '-'}</td>
                              <td className="text-center py-2 px-2">{player.stats.three_pt || '-'}</td>
                              <td className="text-center py-2 px-2">{player.stats.ft || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">{boxScore.game.home_team} Stats</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 sticky left-0 bg-card">Player</th>
                            <th className="text-center py-2 px-2">MIN</th>
                            <th className="text-center py-2 px-2">PTS</th>
                            <th className="text-center py-2 px-2">REB</th>
                            <th className="text-center py-2 px-2">AST</th>
                            <th className="text-center py-2 px-2">FG</th>
                            <th className="text-center py-2 px-2">3PT</th>
                            <th className="text-center py-2 px-2">FT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boxScore.home_players.map((player, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2 px-3 font-medium sticky left-0 bg-card">{player.player_name}</td>
                              <td className="text-center py-2 px-2">{player.stats.minutes || '-'}</td>
                              <td className="text-center py-2 px-2 font-semibold">{player.stats.points || 0}</td>
                              <td className="text-center py-2 px-2">{player.stats.rebounds || 0}</td>
                              <td className="text-center py-2 px-2">{player.stats.assists || 0}</td>
                              <td className="text-center py-2 px-2">{player.stats.fg || '-'}</td>
                              <td className="text-center py-2 px-2">{player.stats.three_pt || '-'}</td>
                              <td className="text-center py-2 px-2">{player.stats.ft || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

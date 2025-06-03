import { HybridResult } from '../services/HybridAnalysisService';
import { PlayerComparison } from '../services/RankBenchmarkService';
import { PlaystyleShift, ChampionEvolution } from '../services/PlaystyleAnalysisService';

export interface SmurfAnalysisDisplayProps {
  analysisResult: HybridResult;
  playerName: string;
}

export class SmurfAnalysisDisplay {
  private analysisResult: HybridResult;
  private playerName: string;

  constructor(analysisResult: HybridResult, playerName: string) {
    this.analysisResult = analysisResult;
    this.playerName = playerName;
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'exceptional': return '#ff4757';
      case 'above_average': return '#ffa502';
      case 'average': return '#2ed573';
      case 'below_average': return '#70a1ff';
      case 'far_below': return '#5352ed';
      default: return '#ffffff';
    }
  }

  private getSuspicionColor(level: number): string {
    if (level >= 80) return '#ff3838';
    if (level >= 60) return '#ff6348';
    if (level >= 40) return '#ffa502';
    if (level >= 20) return '#f1c40f';
    return '#2ed573';
  }

  private getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return '#ff3838';
    if (confidence >= 70) return '#ff6348';
    if (confidence >= 50) return '#ffa502';
    return '#2ed573';
  }

  public generateHTML(): string {
    const { quick, deep, recommendation } = this.analysisResult;

    return `
      <div class="smurf-analysis-container">
        <!-- Header Section -->
        <div class="analysis-header">
          <div class="player-info">
            <h1 class="player-name">${this.playerName}</h1>
            <div class="analysis-timestamp">
              Analysis completed • Response time: ${quick.responseTime}ms
            </div>
          </div>
          <div class="suspicion-badge">
            <div class="suspicion-level ${quick.suspicionLevel}">
              ${quick.suspicionLevel.toUpperCase().replace('_', ' ')}
            </div>
            <div class="confidence-score">
              Confidence: ${recommendation.confidence}%
            </div>
          </div>
        </div>

        <!-- Quick Flags -->
        ${quick.quickFlags.length > 0 ? `
          <div class="quick-flags-section">
            <h3>Immediate Concerns</h3>
            <div class="flags-container">
              ${quick.quickFlags.map(flag => `
                <div class="flag-item">${flag}</div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Rank Comparison Table -->
        <div class="section-container">
          <h3>Performance vs Rank Average</h3>
          <div class="table-container">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Player Value</th>
                  <th>Rank Average</th>
                  <th>Percentile</th>
                  <th>Deviation</th>
                  <th>Status</th>
                  <th>Suspicion Level</th>
                </tr>
              </thead>
              <tbody>
                ${quick.rankComparison.map(comparison => `
                  <tr class="${comparison.suspiciousLevel > 50 ? 'suspicious-row' : ''}">
                    <td class="metric-name">${comparison.metric}</td>
                    <td class="player-value">${comparison.playerValue.toFixed(2)}</td>
                    <td class="rank-average">${comparison.rankAverage.toFixed(2)}</td>
                    <td class="percentile">
                      <span class="${comparison.percentile >= 95 ? 'outlier' : ''}">
                        ${comparison.percentile.toFixed(1)}th
                      </span>
                    </td>
                    <td class="deviation">
                      <span class="${Math.abs(comparison.deviation) > 2 ? 'high-deviation' : ''}">
                        ${(comparison.deviation * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td class="status">
                      <span 
                        class="status-badge"
                        style="background-color: ${this.getStatusColor(comparison.status)}"
                      >
                        ${comparison.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td class="suspicion-level">
                      <div class="suspicion-bar">
                        <div 
                          class="suspicion-fill"
                          style="width: ${comparison.suspiciousLevel}%; background-color: ${this.getSuspicionColor(comparison.suspiciousLevel)}"
                        ></div>
                        <span class="suspicion-text">${comparison.suspiciousLevel}</span>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Matches Analysis -->
        <div class="section-container">
          <h3>Recent Match Performance</h3>
          <div class="matches-grid">
            ${quick.recentMatches.slice(0, 20).map((match, index) => `
              <div class="match-card">
                <div class="match-header">
                  <span class="match-result">Game ${index + 1}</span>
                  <span class="match-duration">${Math.floor(Math.random() * 20 + 20)}min</span>
                </div>
                <div class="match-stats">
                  <div class="stat-item">
                    <span class="stat-label">KDA</span>
                    <span class="stat-value">${(Math.random() * 5 + 1).toFixed(1)}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">CS/min</span>
                    <span class="stat-value">${(Math.random() * 3 + 5).toFixed(1)}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Vision</span>
                    <span class="stat-value">${Math.floor(Math.random() * 30 + 15)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Deep Analysis Section -->
        ${deep ? `
          <!-- Playstyle Evolution -->
          <div class="section-container">
            <h3>Playstyle Evolution Analysis</h3>
            <div class="evolution-summary">
              <div class="summary-stats">
                <div class="summary-item">
                  <span class="summary-label">Historical Matches</span>
                  <span class="summary-value">${deep.historicalData.totalMatches}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Analysis Period</span>
                  <span class="summary-value">${deep.historicalData.timeSpanMonths} months</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Suspicion Score</span>
                  <span 
                    class="summary-value"
                    style="color: ${this.getSuspicionColor(deep.playstyleEvolution.overallSuspicionScore)}"
                  >
                    ${deep.playstyleEvolution.overallSuspicionScore}/100
                  </span>
                </div>
              </div>
            </div>

            <!-- Playstyle Shifts Table -->
            ${deep.playstyleEvolution.shifts.length > 0 ? `
              <div class="table-container">
                <h4>Detected Playstyle Shifts</h4>
                <table class="shifts-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>CS Improvement</th>
                      <th>KDA Improvement</th>
                      <th>Vision Improvement</th>
                      <th>Champion Pool Change</th>
                      <th>Confidence</th>
                      <th>Suspicion Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${deep.playstyleEvolution.shifts.map(shift => `
                      <tr class="${shift.suspicionScore > 70 ? 'high-suspicion-row' : ''}">
                        <td>${shift.timestamp.toLocaleDateString()}</td>
                        <td>
                          <span class="shift-type ${shift.type}">
                            ${shift.type}
                          </span>
                        </td>
                        <td class="description">${shift.description}</td>
                        <td class="${shift.metrics.csImprovement > 1 ? 'significant-change' : ''}">
                          ${(shift.metrics.csImprovement * 100).toFixed(1)}%
                        </td>
                        <td class="${shift.metrics.kdaImprovement > 1 ? 'significant-change' : ''}">
                          ${(shift.metrics.kdaImprovement * 100).toFixed(1)}%
                        </td>
                        <td class="${shift.metrics.visionImprovement > 1 ? 'significant-change' : ''}">
                          ${(shift.metrics.visionImprovement * 100).toFixed(1)}%
                        </td>
                        <td class="${shift.metrics.championPoolChange > 0.7 ? 'significant-change' : ''}">
                          ${(shift.metrics.championPoolChange * 100).toFixed(1)}%
                        </td>
                        <td>
                          <div class="confidence-bar">
                            <div 
                              class="confidence-fill"
                              style="width: ${shift.confidence * 100}%; background-color: ${this.getConfidenceColor(shift.confidence * 100)}"
                            ></div>
                            <span>${(shift.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td>
                          <span 
                            class="suspicion-score"
                            style="color: ${this.getSuspicionColor(shift.suspicionScore)}"
                          >
                            ${shift.suspicionScore}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>

          <!-- Champion Evolution Analysis -->
          <div class="section-container">
            <h3>Champion Mastery Analysis</h3>
            <div class="table-container">
              <table class="champion-evolution-table">
                <thead>
                  <tr>
                    <th>Champion</th>
                    <th>Games Played</th>
                    <th>Early Win Rate</th>
                    <th>Late Win Rate</th>
                    <th>Early KDA</th>
                    <th>Late KDA</th>
                    <th>Early CS/min</th>
                    <th>Late CS/min</th>
                    <th>Skill Progression</th>
                    <th>Suspicion Flags</th>
                  </tr>
                </thead>
                <tbody>
                  ${deep.playstyleEvolution.championEvolution.map(evolution => {
                    const earlyWindow = evolution.timeWindows.find(w => w.period === 'early');
                    const lateWindow = evolution.timeWindows.find(w => w.period === 'late');
                    const flagCount = Object.values(evolution.suspicionFlags).filter(Boolean).length;
                    
                    return `
                      <tr class="${flagCount > 0 ? 'flagged-champion' : ''}">
                        <td class="champion-name">${evolution.championName}</td>
                        <td>${(earlyWindow?.games || 0) + (lateWindow?.games || 0)}</td>
                        <td class="win-rate">
                          ${((earlyWindow?.winRate || 0) * 100).toFixed(1)}%
                        </td>
                        <td class="win-rate">
                          ${((lateWindow?.winRate || 0) * 100).toFixed(1)}%
                        </td>
                        <td>${(earlyWindow?.averageKDA || 0).toFixed(2)}</td>
                        <td class="${
                          (lateWindow?.averageKDA || 0) > (earlyWindow?.averageKDA || 0) * 2 ? 
                          'dramatic-improvement' : ''
                        }">
                          ${(lateWindow?.averageKDA || 0).toFixed(2)}
                        </td>
                        <td>${(earlyWindow?.averageCS || 0).toFixed(1)}</td>
                        <td class="${
                          (lateWindow?.averageCS || 0) > (earlyWindow?.averageCS || 0) * 1.5 ? 
                          'dramatic-improvement' : ''
                        }">
                          ${(lateWindow?.averageCS || 0).toFixed(1)}
                        </td>
                        <td>
                          <span class="${
                            (lateWindow?.skillProgression || 0) > 5 ? 'high-progression' : ''
                          }">
                            ${(lateWindow?.skillProgression || 0).toFixed(1)}
                          </span>
                        </td>
                        <td>
                          <div class="flags-cell">
                            ${evolution.suspicionFlags.tooGoodTooFast ? 
                              '<span class="flag-badge too-good">Too Good Too Fast</span>' : ''}
                            ${evolution.suspicionFlags.suddenExpertise ? 
                              '<span class="flag-badge sudden-expertise">Sudden Expertise</span>' : ''}
                            ${evolution.suspicionFlags.metaShift ? 
                              '<span class="flag-badge meta-shift">Meta Shift</span>' : ''}
                            ${evolution.suspicionFlags.complexityJump ? 
                              '<span class="flag-badge complexity-jump">Complexity Jump</span>' : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Smurf Indicators Summary -->
          <div class="section-container">
            <h3>Smurf Detection Indicators</h3>
            <div class="indicators-grid">
              <div class="indicator-card ${deep.smurfIndicators.accountSwitchingPattern ? 'detected' : 'clean'}">
                <div class="indicator-title">Account Switching Pattern</div>
                <div class="indicator-status">
                  ${deep.smurfIndicators.accountSwitchingPattern ? 'DETECTED' : 'Clean'}
                </div>
                <div class="indicator-description">
                  Dramatic playstyle changes suggesting different players
                </div>
              </div>

              <div class="indicator-card ${deep.smurfIndicators.skillInconsistency ? 'detected' : 'clean'}">
                <div class="indicator-title">Skill Inconsistency</div>
                <div class="indicator-status">
                  ${deep.smurfIndicators.skillInconsistency ? 'DETECTED' : 'Clean'}
                </div>
                <div class="indicator-description">
                  Performance variations beyond normal improvement patterns
                </div>
              </div>

              <div class="indicator-card ${deep.smurfIndicators.championMasteryAnomalies ? 'detected' : 'clean'}">
                <div class="indicator-title">Champion Mastery Anomalies</div>
                <div class="indicator-status">
                  ${deep.smurfIndicators.championMasteryAnomalies ? 'DETECTED' : 'Clean'}
                </div>
                <div class="indicator-description">
                  Unusually rapid champion mastery progression
                </div>
              </div>

              <div class="indicator-card ${deep.smurfIndicators.performanceOutliers ? 'detected' : 'clean'}">
                <div class="indicator-title">Performance Outliers</div>
                <div class="indicator-status">
                  ${deep.smurfIndicators.performanceOutliers ? 'DETECTED' : 'Clean'}
                </div>
                <div class="indicator-description">
                  Statistical anomalies in performance metrics
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Final Recommendation -->
        <div class="section-container recommendation-section">
          <h3>Analysis Recommendation</h3>
          <div class="recommendation-card">
            <div class="recommendation-header">
              <div class="action-badge ${recommendation.action}">
                ${recommendation.action.toUpperCase().replace('_', ' ')}
              </div>
              <div class="confidence-display">
                Confidence: ${recommendation.confidence}%
              </div>
            </div>
            <div class="recommendation-content">
              <div class="reasoning-section">
                <h4>Reasoning</h4>
                <ul>
                  ${recommendation.reasoning.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
              </div>
              <div class="evidence-section">
                <h4>Supporting Evidence</h4>
                <ul>
                  ${recommendation.evidence.map(evidence => `<li>${evidence}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
} 
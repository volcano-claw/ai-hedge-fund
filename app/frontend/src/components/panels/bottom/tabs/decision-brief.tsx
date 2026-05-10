import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DecisionBriefProps {
  outputData: {
    decisions?: Record<string, DecisionPayload>;
    analyst_signals?: Record<string, Record<string, AnalystSignal>>;
    current_prices?: Record<string, number | string>;
  } | null;
}

interface DecisionPayload {
  action?: string;
  quantity?: number;
  confidence?: number;
  reasoning?: string;
}

interface AnalystSignal {
  signal?: string;
  confidence?: number;
  reasoning?: string;
}

export interface DecisionCard {
  ticker: string;
  verdict: 'favorable' | 'neutre' | 'défavorable' | 'incomplet';
  actionLabel: string;
  confidence: number;
  currentPrice?: number | string;
  positiveSignals: string[];
  negativeSignals: string[];
  missingSignals: string[];
  nextAction: string;
}

const actionLabels: Record<string, string> = {
  long: 'Renforcer / acheter',
  short: 'Vendre / couvrir',
  hold: 'Surveiller / attendre',
};

function normalizeSignal(signal?: string): string {
  return (signal || '').toLowerCase();
}

function verdictFromDecision(action?: string, confidence = 0): DecisionCard['verdict'] {
  const normalizedAction = (action || '').toLowerCase();

  if (!normalizedAction) return 'incomplet';
  if (normalizedAction === 'long' && confidence >= 60) return 'favorable';
  if (normalizedAction === 'short' && confidence >= 60) return 'défavorable';
  if (normalizedAction === 'hold') return 'neutre';
  return 'incomplet';
}

function verdictColor(verdict: DecisionCard['verdict']): string {
  switch (verdict) {
    case 'favorable':
      return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    case 'défavorable':
      return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    case 'neutre':
      return 'text-amber-300 border-amber-500/40 bg-amber-500/10';
    default:
      return 'text-slate-300 border-slate-500/40 bg-slate-500/10';
  }
}

function agentDisplayName(agentId: string): string {
  const base = agentId.replace(/_[a-z0-9]{6,}$/i, '');
  const names: Record<string, string> = {
    technical_analyst: 'Technique',
    fundamentals_analyst: 'Fondamental',
    valuation_analyst: 'Valorisation',
    sentiment_analyst: 'Sentiment',
    news_sentiment_analyst: 'News',
    risk_management_agent: 'Risque',
    portfolio_manager: 'Portfolio',
  };
  return names[base] || base.replace(/_/g, ' ');
}

export function buildDecisionCards(outputData: DecisionBriefProps['outputData']): DecisionCard[] {
  if (!outputData?.decisions) return [];

  return Object.entries(outputData.decisions).map(([ticker, decision]) => {
    const confidence = Number(decision.confidence || 0);
    const action = (decision.action || '').toLowerCase();
    const positiveSignals: string[] = [];
    const negativeSignals: string[] = [];
    const missingSignals: string[] = [];

    Object.entries(outputData.analyst_signals || {}).forEach(([agentId, tickerSignals]) => {
      const signal = tickerSignals?.[ticker];
      const displayName = agentDisplayName(agentId);
      if (!signal) {
        missingSignals.push(displayName);
        return;
      }

      const normalizedSignal = normalizeSignal(signal.signal);
      const signalConfidence = Number(signal.confidence || 0);
      const label = `${displayName}: ${signal.signal || 'signal inconnu'} (${signalConfidence.toFixed(0)}%)`;

      if (normalizedSignal.includes('bullish')) {
        positiveSignals.push(label);
      } else if (normalizedSignal.includes('bearish')) {
        negativeSignals.push(label);
      } else {
        missingSignals.push(label);
      }
    });

    const verdict = verdictFromDecision(action, confidence);
    const nextAction = (() => {
      if (verdict === 'favorable') return 'À creuser avec Alix: vérifier risques, prix d’entrée et concentration portefeuille.';
      if (verdict === 'défavorable') return 'Ne pas engager sans contre-analyse: chercher ce qui pourrait invalider le signal négatif.';
      if (verdict === 'neutre') return 'Mettre en surveillance: relancer si prix, news ou fondamentaux changent.';
      return 'Run incomplet: relancer avec données/agents complémentaires avant décision.';
    })();

    return {
      ticker,
      verdict,
      actionLabel: actionLabels[action] || action || 'Action non déterminée',
      confidence,
      currentPrice: outputData.current_prices?.[ticker],
      positiveSignals: positiveSignals.slice(0, 3),
      negativeSignals: negativeSignals.slice(0, 3),
      missingSignals: missingSignals.slice(0, 3),
      nextAction,
    };
  });
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {items.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-5">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground">{empty}</div>
      )}
    </div>
  );
}

export function DecisionBrief({ outputData }: DecisionBriefProps) {
  const cards = buildDecisionCards(outputData);
  if (cards.length === 0) return null;

  return (
    <Card className="mb-4 border-sky-500/30 bg-sky-950/10">
      <CardHeader>
        <CardTitle className="text-lg">Fiche décision Volcano Fund</CardTitle>
        <p className="text-sm text-muted-foreground">
          Synthèse opérationnelle générée depuis les signaux du run. Ce n’est pas un ordre de trading: c’est une aide de recherche à valider humainement.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {cards.map((card) => (
          <div key={card.ticker} className="rounded-lg border border-border/70 bg-background/40 p-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="text-base font-semibold">{card.ticker}</div>
              <div className={cn('rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide', verdictColor(card.verdict))}>
                {card.verdict}
              </div>
              <div className="text-sm text-muted-foreground">{card.actionLabel}</div>
              <div className="text-sm text-muted-foreground">Conviction: {card.confidence.toFixed(1)}%</div>
              {card.currentPrice !== undefined && (
                <div className="text-sm text-muted-foreground">Prix: {String(card.currentPrice)}</div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ListBlock title="Arguments pour" items={card.positiveSignals} empty="Aucun signal positif net." />
              <ListBlock title="Risques / contre-arguments" items={card.negativeSignals} empty="Aucun signal négatif net." />
              <ListBlock title="À vérifier" items={card.missingSignals} empty="Pas de manque évident dans ce run." />
            </div>

            <div className="mt-4 rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
              <span className="font-semibold">Prochaine action: </span>{card.nextAction}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

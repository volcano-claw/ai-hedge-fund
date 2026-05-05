import { useTabsContext } from '@/contexts/tabs-context';
import { cn } from '@/lib/utils';
import { flowService } from '@/services/flow-service';
import { researchBriefService, type ResearchBriefRecord } from '@/services/research-brief-service';
import { TabService } from '@/services/tab-service';
import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  FileText,
  FolderOpen,
  LockKeyhole,
  ShieldCheck,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface TabContentProps {
  className?: string;
}

type ResearchTemplate = {
  id: string;
  title: string;
  owner: string;
  tickers: string;
  brief: string;
  serverId?: number;
};

const STORAGE_KEY = 'volcano-fund-research-brief-v1';

const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    id: 'core-us-tech',
    title: 'US tech quality check',
    owner: 'Raphaël',
    tickers: 'MSFT,NVDA,AAPL,GOOGL,AMZN',
    brief: 'Comparer les grands dossiers tech US sur qualité fondamentale, momentum, valorisation et risques de concentration IA.',
  },
  {
    id: 'value-safety',
    title: 'Value + marge de sécurité',
    owner: 'Alix',
    tickers: 'BRK.B,JPM,JNJ,PG,KO',
    brief: 'Identifier les dossiers défensifs avec cash-flows robustes, bilan sain et décote raisonnable versus valeur intrinsèque.',
  },
  {
    id: 'macro-watch',
    title: 'Macro watchlist',
    owner: 'Raphaël + Alix',
    tickers: 'SPY,QQQ,TLT,GLD,USO',
    brief: 'Préparer une lecture macro multi-actifs: equity risk, duration, or, énergie, stress de marché et scénarios de couverture.',
  },
];

function loadBriefState() {
  if (typeof window === 'undefined') {
    return RESEARCH_TEMPLATES[0];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return RESEARCH_TEMPLATES[0];
    }

    return { ...RESEARCH_TEMPLATES[0], ...JSON.parse(raw) } as ResearchTemplate;
  } catch {
    return RESEARCH_TEMPLATES[0];
  }
}

function buildResearchFlowDraft(researchBrief: ResearchTemplate, normalizedTickers: string) {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  const startDate = threeMonthsAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  const safeSuffix = Date.now().toString(36);
  const tickers = normalizedTickers || researchBrief.tickers;
  const stockNodeId = `volcano_stock_input_${safeSuffix}`;
  const technicalNodeId = `technical_analyst_${safeSuffix}`;
  const fundamentalsNodeId = `fundamentals_analyst_${safeSuffix}`;
  const valuationNodeId = `valuation_analyst_${safeSuffix}`;
  const portfolioNodeId = `portfolio_manager_${safeSuffix}`;
  const stockInternalState = {
    tickers,
    runMode: 'single',
    initialCash: '100000',
    startDate,
    endDate,
  };

  const nodes = [
    {
      id: stockNodeId,
      type: 'stock-analyzer-node',
      position: { x: 0, y: 0 },
      data: {
        name: 'Stock Input',
        description: `Brief Volcano Fund · ${researchBrief.owner}`,
        status: 'Idle',
        internal_state: stockInternalState,
      },
    },
    {
      id: technicalNodeId,
      type: 'agent-node',
      position: { x: 420, y: -260 },
      data: {
        name: 'Technical Analyst',
        description: 'Momentum, trend and market structure check.',
        status: 'Idle',
      },
    },
    {
      id: fundamentalsNodeId,
      type: 'agent-node',
      position: { x: 420, y: 0 },
      data: {
        name: 'Fundamentals Analyst',
        description: 'Quality, financials and business durability check.',
        status: 'Idle',
      },
    },
    {
      id: valuationNodeId,
      type: 'agent-node',
      position: { x: 420, y: 260 },
      data: {
        name: 'Valuation Analyst',
        description: 'Valuation and margin-of-safety check.',
        status: 'Idle',
      },
    },
    {
      id: portfolioNodeId,
      type: 'portfolio-manager-node',
      position: { x: 850, y: 0 },
      data: {
        name: 'Portfolio Manager',
        description: 'Synthesizes analyst signals into a research decision draft.',
        status: 'Idle',
      },
    },
  ];

  const edges = [
    { id: `${stockNodeId}-${technicalNodeId}`, source: stockNodeId, target: technicalNodeId },
    { id: `${stockNodeId}-${fundamentalsNodeId}`, source: stockNodeId, target: fundamentalsNodeId },
    { id: `${stockNodeId}-${valuationNodeId}`, source: stockNodeId, target: valuationNodeId },
    { id: `${technicalNodeId}-${portfolioNodeId}`, source: technicalNodeId, target: portfolioNodeId },
    { id: `${fundamentalsNodeId}-${portfolioNodeId}`, source: fundamentalsNodeId, target: portfolioNodeId },
    { id: `${valuationNodeId}-${portfolioNodeId}`, source: valuationNodeId, target: portfolioNodeId },
  ];

  return {
    name: `Volcano brief · ${researchBrief.title}`,
    description: `Owner: ${researchBrief.owner}
Tickers: ${tickers}
Brief: ${researchBrief.brief}`,
    nodes,
    edges,
    viewport: { x: 80, y: 140, zoom: 0.75 },
    data: {
      source: 'volcano-fund-research-brief',
      researchBrief: {
        ...researchBrief,
        tickers,
      },
      nodeStates: {
        [stockNodeId]: stockInternalState,
      },
    },
    tags: ['volcano-fund', 'research-brief', researchBrief.owner.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
  };
}

function VolcanoFundWelcome({ className }: TabContentProps) {
  const { openTab } = useTabsContext();
  const [researchBrief, setResearchBrief] = useState<ResearchTemplate>(() => loadBriefState());
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [isSavingBrief, setIsSavingBrief] = useState(false);
  const [briefHistory, setBriefHistory] = useState<ResearchBriefRecord[]>([]);
  const [createdFlowMessage, setCreatedFlowMessage] = useState<string | null>(null);
  const [createFlowError, setCreateFlowError] = useState<string | null>(null);
  const [briefSyncMessage, setBriefSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(researchBrief));
  }, [researchBrief]);

  useEffect(() => {
    const loadBriefHistory = async () => {
      try {
        const briefs = await researchBriefService.listBriefHistory(6);
        setBriefHistory(briefs);
        if (briefs.length > 0) {
          const latest = briefs[0];
          setResearchBrief({
            id: latest.template_id || 'server-brief',
            title: latest.title,
            owner: latest.owner,
            tickers: latest.tickers,
            brief: latest.brief,
            serverId: latest.id,
          });
          setBriefSyncMessage(`Dernier brief serveur chargé #${latest.id}`);
        }
      } catch (error) {
        console.error('Failed to load Volcano Fund research briefs:', error);
        setBriefSyncMessage('Mode local: historique serveur indisponible');
      }
    };

    loadBriefHistory();
  }, []);

  const normalizedTickers = useMemo(() => (
    researchBrief.tickers
      .split(',')
      .map(ticker => ticker.trim().toUpperCase())
      .filter(Boolean)
      .join(',')
  ), [researchBrief.tickers]);

  const applyTemplate = (template: ResearchTemplate) => {
    setResearchBrief(template);
    setCreatedFlowMessage(null);
    setCreateFlowError(null);
    setBriefSyncMessage(null);
  };

  const briefPayload = (status = 'draft', flowId?: number) => ({
    title: researchBrief.title,
    owner: researchBrief.owner,
    tickers: normalizedTickers || researchBrief.tickers,
    brief: researchBrief.brief,
    template_id: researchBrief.id,
    status,
    flow_id: flowId ?? null,
    extra_metadata: {
      source: 'volcano-fund-landing',
      savedFrom: 'research-brief-panel',
    },
  });

  const refreshBriefHistory = async () => {
    const briefs = await researchBriefService.listBriefHistory(6);
    setBriefHistory(briefs);
  };

  const saveBriefDraft = async () => {
    setIsSavingBrief(true);
    setCreateFlowError(null);

    try {
      const savedBrief = researchBrief.serverId
        ? await researchBriefService.updateBrief(researchBrief.serverId, briefPayload('draft'))
        : await researchBriefService.createBrief(briefPayload('draft'));

      setResearchBrief({
        id: savedBrief.template_id || researchBrief.id,
        title: savedBrief.title,
        owner: savedBrief.owner,
        tickers: savedBrief.tickers,
        brief: savedBrief.brief,
        serverId: savedBrief.id,
      });
      setBriefSyncMessage(`Brief sauvegardé serveur #${savedBrief.id}`);
      await refreshBriefHistory();
    } catch (error) {
      console.error('Failed to save Volcano Fund research brief:', error);
      setCreateFlowError('Sauvegarde serveur impossible. Le brouillon local reste disponible.');
    } finally {
      setIsSavingBrief(false);
    }
  };

  const loadHistoryBrief = (brief: ResearchBriefRecord) => {
    setResearchBrief({
      id: brief.template_id || 'server-brief',
      title: brief.title,
      owner: brief.owner,
      tickers: brief.tickers,
      brief: brief.brief,
      serverId: brief.id,
    });
    setBriefSyncMessage(`Brief serveur chargé #${brief.id}`);
    setCreatedFlowMessage(null);
    setCreateFlowError(null);
  };


  const runStatusLabel = (brief: ResearchBriefRecord) => {
    if (!brief.flow_id) {
      return 'Aucun flow lié';
    }
    if (!brief.run_count) {
      return `Flow #${brief.flow_id} · aucun run`;
    }
    return `Flow #${brief.flow_id} · ${brief.run_count} run${brief.run_count > 1 ? 's' : ''} · ${brief.latest_run_status || 'status inconnu'}`;
  };

  const createFlowFromBrief = async () => {
    setIsCreatingFlow(true);
    setCreatedFlowMessage(null);
    setCreateFlowError(null);

    try {
      const savedBrief = researchBrief.serverId
        ? await researchBriefService.updateBrief(researchBrief.serverId, briefPayload('draft'))
        : await researchBriefService.createBrief(briefPayload('draft'));
      const flowDraft = buildResearchFlowDraft({
        id: savedBrief.template_id || researchBrief.id,
        title: savedBrief.title,
        owner: savedBrief.owner,
        tickers: savedBrief.tickers,
        brief: savedBrief.brief,
        serverId: savedBrief.id,
      }, normalizedTickers);
      const createdFlow = await flowService.createFlow(flowDraft);
      const linkedBrief = await researchBriefService.updateBrief(savedBrief.id, briefPayload('flow_created', createdFlow.id));
      setResearchBrief({
        id: linkedBrief.template_id || researchBrief.id,
        title: linkedBrief.title,
        owner: linkedBrief.owner,
        tickers: linkedBrief.tickers,
        brief: linkedBrief.brief,
        serverId: linkedBrief.id,
      });
      await refreshBriefHistory();
      const tabData = TabService.createFlowTab(createdFlow);
      openTab(tabData);
      window.localStorage.setItem('lastSelectedFlowId', createdFlow.id.toString());
      setBriefSyncMessage(`Brief serveur #${linkedBrief.id} lié au flow #${createdFlow.id}`);
      setCreatedFlowMessage(`Flow créé et ouvert: ${createdFlow.name}`);
    } catch (error) {
      console.error('Failed to create Volcano Fund research flow:', error);
      setCreateFlowError('Création du flow impossible. Vérifie le backend ou réessaie.');
    } finally {
      setIsCreatingFlow(false);
    }
  };

  return (
    <div className={cn(
      "h-full w-full overflow-auto bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.18),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(245,158,11,0.14),_transparent_30%),linear-gradient(135deg,_#050505_0%,_#111111_48%,_#1f1208_100%)] text-white",
      className
    )}>
      <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center px-8 py-12">
        <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-amber-200">
          <ShieldCheck size={14} />
          Accès privé · Raphaël & Alix
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/30 bg-gradient-to-br from-red-500 to-amber-400 text-2xl shadow-2xl shadow-red-950/40">
                V
              </div>
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.35em] text-orange-200/80">Volcano Fund</div>
                <div className="text-xs text-stone-400">AI investment research cockpit</div>
              </div>
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
              Transformer l’AI Hedge Fund en cockpit privé de recherche financière.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
              Une base propre, sécurisée et extensible pour analyser des signaux, comparer des agents d’investissement et préparer des décisions documentées — sans exécution de trading réelle.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-stone-100">Basic Auth active</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-stone-100">Docker healthy</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-stone-100">GitHub fork synchronisé</span>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-stone-400">Statut produit</div>
                <div className="mt-1 text-2xl font-semibold text-white">Base opérationnelle</div>
              </div>
              <LockKeyhole className="text-amber-300" size={28} />
            </div>

            <div className="space-y-3">
              {[
                ['Sécurité', 'Accès privé protégé au proxy'],
                ['Recherche', 'Agents + flows prêts à être personnalisés'],
                ['Runtime', 'Backend / UI surveillés par healthchecks'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-orange-200/70">{label}</div>
                  <div className="mt-1 text-sm text-stone-200">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/[0.06] p-3">
                <BrainCircuit className="mx-auto mb-2 text-orange-300" size={20} />
                <div className="text-xs text-stone-300">Agents</div>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-3">
                <BarChart3 className="mx-auto mb-2 text-orange-300" size={20} />
                <div className="text-xs text-stone-300">Signals</div>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-3">
                <TrendingUp className="mx-auto mb-2 text-orange-300" size={20} />
                <div className="text-xs text-stone-300">Research</div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-black/35 p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-orange-200">
                <ClipboardList size={16} />
                Brief de recherche
              </div>
              <p className="mt-1 text-sm text-stone-400">Prépare la question, la watchlist et le propriétaire avant d’ouvrir un flow.</p>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              Sauvegarde serveur + locale
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              {RESEARCH_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition hover:border-orange-300/50 hover:bg-white/[0.08]",
                    researchBrief.id === template.id ? "border-orange-300/50 bg-orange-300/10" : "border-white/10 bg-white/[0.04]"
                  )}
                >
                  <div className="text-sm font-semibold text-white">{template.title}</div>
                  <div className="mt-1 text-xs text-stone-400">Owner: {template.owner}</div>
                  <div className="mt-2 text-xs text-orange-200/80">{template.tickers}</div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <label className="block text-xs uppercase tracking-[0.22em] text-stone-400" htmlFor="volcano-brief-owner">Owner</label>
              <input
                id="volcano-brief-owner"
                value={researchBrief.owner}
                onChange={event => setResearchBrief({ ...researchBrief, owner: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-orange-400/30 focus:ring-2"
              />

              <label className="mt-4 block text-xs uppercase tracking-[0.22em] text-stone-400" htmlFor="volcano-brief-tickers">Tickers / watchlist</label>
              <input
                id="volcano-brief-tickers"
                value={researchBrief.tickers}
                onChange={event => setResearchBrief({ ...researchBrief, tickers: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-orange-400/30 focus:ring-2"
              />

              {briefSyncMessage ? (
                <div className="mt-3 rounded-xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs text-sky-100">{briefSyncMessage}</div>
              ) : null}

              <label className="mt-4 block text-xs uppercase tracking-[0.22em] text-stone-400" htmlFor="volcano-brief-text">Question de recherche</label>
              <textarea
                id="volcano-brief-text"
                value={researchBrief.brief}
                onChange={event => setResearchBrief({ ...researchBrief, brief: event.target.value })}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm leading-6 text-white outline-none ring-orange-400/30 focus:ring-2"
              />

              <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-300/10 p-3 text-sm text-orange-50">
                <div className="mb-1 flex items-center gap-2 font-semibold"><Sparkles size={15} />Run draft</div>
                <div className="text-stone-200">Analyser {normalizedTickers || 'la watchlist'} pour {researchBrief.owner || 'l’équipe'}: {researchBrief.brief}</div>
              </div>

              <button
                type="button"
                onClick={saveBriefDraft}
                disabled={isSavingBrief || !normalizedTickers || !researchBrief.brief.trim()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300/30 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-orange-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingBrief ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                Sauvegarder le brief serveur
              </button>

              <button
                type="button"
                onClick={createFlowFromBrief}
                disabled={isCreatingFlow || !normalizedTickers || !researchBrief.brief.trim()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-amber-400 px-4 py-3 text-sm font-semibold text-black transition hover:from-red-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingFlow ? <Loader2 className="animate-spin" size={16} /> : <FolderOpen size={16} />}
                Créer et ouvrir le flow
              </button>

              {createdFlowMessage ? (
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-100">{createdFlowMessage}</div>
              ) : null}
              {createFlowError ? (
                <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-100">{createFlowError}</div>
              ) : null}
            </div>
          </div>

          {briefHistory.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.22em] text-stone-400">Historique brief → flow → run</div>
              <div className="grid gap-3 md:grid-cols-3">
                {briefHistory.slice(0, 3).map(brief => (
                  <button
                    key={brief.id}
                    type="button"
                    onClick={() => loadHistoryBrief(brief)}
                    className="rounded-xl border border-white/10 bg-black/25 p-3 text-left transition hover:border-orange-300/50 hover:bg-white/[0.08]"
                  >
                    <div className="truncate text-sm font-semibold text-white">#{brief.id} · {brief.title}</div>
                    <div className="mt-1 text-xs text-stone-400">{brief.owner} · {brief.status}</div>
                    <div className="mt-2 truncate text-xs text-orange-200/80">{brief.tickers}</div>
                    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-stone-300">{runStatusLabel(brief)}</div>
                    {brief.flow_name ? (
                      <div className="mt-1 truncate text-xs text-stone-500">{brief.flow_name}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-10 flex items-center gap-2 text-xs text-stone-500">
          <FileText size={14} />
          <span>Crée un flow depuis le brief ou ouvre un flow existant depuis la barre latérale gauche. Usage recherche/éducation uniquement, pas de conseil financier.</span>
        </div>
      </div>
    </div>
  );
}

export function TabContent({ className }: TabContentProps) {
  const { tabs, activeTabId, openTab } = useTabsContext();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Restore content for tabs that don't have it (from localStorage restoration)
  useEffect(() => {
    if (activeTab && !activeTab.content) {
      try {
        const restoredTab = TabService.restoreTab({
          type: activeTab.type,
          title: activeTab.title,
          flow: activeTab.flow,
          metadata: activeTab.metadata,
        });
        
        // Update the tab with restored content
        openTab({
          id: activeTab.id,
          type: restoredTab.type,
          title: restoredTab.title,
          content: restoredTab.content,
          flow: restoredTab.flow,
          metadata: restoredTab.metadata,
        });
      } catch (error) {
        console.error('Failed to restore tab content:', error);
      }
    }
  }, [activeTab, openTab]);

  if (!activeTab) {
    return <VolcanoFundWelcome className={className} />;
  }

  // Show loading state if content is being restored
  if (!activeTab.content) {
    return (
      <div className={cn(
        "h-full w-full flex items-center justify-center bg-background text-muted-foreground",
        className
      )}>
        <div className="text-center">
          <FolderOpen size={32} className="mx-auto mb-3 text-muted-foreground/50" />
          <div className="text-lg font-medium mb-2">Loading {activeTab.title}...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full bg-background overflow-hidden", className)}>
      {activeTab.content}
    </div>
  );
} 
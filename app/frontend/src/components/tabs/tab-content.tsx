import { useTabsContext } from '@/contexts/tabs-context';
import { cn } from '@/lib/utils';
import { TabService } from '@/services/tab-service';
import { BarChart3, BrainCircuit, FileText, FolderOpen, LockKeyhole, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';

interface TabContentProps {
  className?: string;
}

function VolcanoFundWelcome({ className }: TabContentProps) {
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

        <div className="mt-10 flex items-center gap-2 text-xs text-stone-500">
          <FileText size={14} />
          <span>Ouvre un flow depuis la barre latérale gauche pour lancer l’espace de travail. Usage recherche/éducation uniquement, pas de conseil financier.</span>
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
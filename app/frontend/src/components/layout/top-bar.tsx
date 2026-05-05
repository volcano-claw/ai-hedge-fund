import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Flame, PanelBottom, PanelLeft, PanelRight, Settings } from 'lucide-react';

interface TopBarProps {
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
  isBottomCollapsed: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleBottom: () => void;
  onSettingsClick: () => void;
}

export function TopBar({
  isLeftCollapsed,
  isRightCollapsed,
  isBottomCollapsed,
  onToggleLeft,
  onToggleRight,
  onToggleBottom,
  onSettingsClick,
}: TopBarProps) {
  return (
    <div className="absolute top-0 right-0 z-40 flex items-center gap-3 py-1 px-2 bg-panel/90 backdrop-blur border-l border-b border-border/50 rounded-bl-xl">
      <div className="hidden items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300 sm:flex">
        <Flame size={15} />
        <span>Volcano Fund</span>
      </div>

      <div className="flex items-center gap-0">
        {/* Left Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleLeft}
          className={cn(
            "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-ramp-grey-700 transition-colors",
            !isLeftCollapsed && "text-foreground"
          )}
          aria-label="Afficher/masquer la barre latérale gauche"
          title="Afficher/masquer la barre latérale gauche (⌘B)"
        >
          <PanelLeft size={16} />
        </Button>

        {/* Bottom Panel Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleBottom}
          className={cn(
            "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-ramp-grey-700 transition-colors",
            !isBottomCollapsed && "text-foreground"
          )}
          aria-label="Afficher/masquer le panneau inférieur"
          title="Afficher/masquer le panneau inférieur (⌘J)"
        >
          <PanelBottom size={16} />
        </Button>

        {/* Right Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRight}
          className={cn(
            "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-ramp-grey-700 transition-colors",
            !isRightCollapsed && "text-foreground"
          )}
          aria-label="Afficher/masquer la barre latérale droite"
          title="Afficher/masquer la barre latérale droite (⌘I)"
        >
          <PanelRight size={16} />
        </Button>

        {/* Divider */}
        <div className="w-px h-5 bg-ramp-grey-700 mx-1" />

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-ramp-grey-700 transition-colors"
          aria-label="Ouvrir les paramètres"
          title="Ouvrir les paramètres (⌘,)"
        >
          <Settings size={16} />
        </Button>
      </div>
    </div>
  );
} 
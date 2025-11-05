import {Component, computed, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {WikipediaService} from './wikipedia-service.service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
  ],
  standalone: true
})
export class AppComponent {
  searchTerm = '';
  loading = signal(false);
  playerData: any = signal(null);
  error = signal('');

  // Computed signal per il totale reti
  totalGoals = computed(() => {
    const data = this.playerData();
    if (!data?.careerStats) { return 0; }
    return data.careerStats.reduce((total: any, stat: { goals: any; }) => total + stat.goals, 0);
  });

  constructor(
    private wikipediaService: WikipediaService) {
  }

  searchPlayer(): any {
    if (!this.searchTerm.trim()) {
      return; }

    this.loading.set(true);
    this.error.set('');
    this.playerData.set(null);

    this.wikipediaService.searchPlayer(this.searchTerm).subscribe({
      next: (summary) => {
        this.wikipediaService.getPlayerContent(summary.title).subscribe({
          next: (htmlContent: any) => {
            const stats = this.parsePlayerStats(htmlContent, summary);

            if (!stats.careerStats.length) {
              this.error.set('Statistiche presenze/reti non disponibili per questo calciatore');
            } else {
              this.playerData.set(stats);
            }
            this.loading.set(false);
          },
          error: (error: Error) => {
            this.error.set(error.message);
            this.loading.set(false);
          }
        });
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      }
    });
  }

  parsePlayerStats(html: string, summary: { title: any; extract: any; }): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const tables = Array.from(doc.querySelectorAll('table'));
    const careerStats: { season: string; team: string; appearances: number; goals: number; }[] = [];

    const normalize = (s: string | null | undefined) => (s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const pickGoalsIndex = (headers: string[]) => {
      // Preferisci colonne con "reti"/"gol" e indicazione di totale
      const candidates = headers
        .map((h, i) => ({ h, i }))
        .filter(x => x.h.includes('reti') || x.h.includes('gol') || x.h.includes('goal'));
      const withTotal = candidates.find(x => x.h.includes('tot')) || candidates.find(x => x.h.includes('totale'));
      return (withTotal?.i ?? candidates[0]?.i ?? -1);
    };

    const pickAppsIndex = (headers: string[]) => {
      // Preferisci colonne con "presenze" e indicazione di totale
      const candidates = headers
        .map((h, i) => ({ h, i }))
        .filter(x => x.h.includes('presenze'));
      const withTotal = candidates.find(x => x.h.includes('tot')) || candidates.find(x => x.h.includes('totale'));
      return (withTotal?.i ?? candidates[0]?.i ?? -1);
    };

    const isTargetTable = (table: Element) => {
      const caption = normalize(table.querySelector('caption')?.textContent || '');
      if (caption.includes('presenze') && (caption.includes('reti') || caption.includes('gol'))) {
        return true;
      }
      const headers = Array.from(table.querySelectorAll('th')).map(th => normalize(th.textContent));
      const hasCore = headers.some(h => h.includes('stagione') || h.includes('anno'))
        && headers.some(h => h.includes('squadra'))
        && headers.some(h => h.includes('presenze'))
        && headers.some(h => h.includes('reti') || h.includes('gol') || h.includes('goal'));
      return hasCore;
    };

    tables.filter(t => isTargetTable(t)).forEach(table => {
      const headerCells = Array.from(table.querySelectorAll('thead tr th'));
      const headerTexts = (headerCells.length ? headerCells : Array.from(table.querySelectorAll('tr:first-child th')))
        .map(th => normalize(th.textContent));

      const seasonIdx = headerTexts.findIndex(h => h.includes('stagione') || h.includes('anno') || h.includes('periodo'));
      const teamIdx = headerTexts.findIndex(h => h.includes('squadra') || h.includes('club'));
      const appsIdx = pickAppsIndex(headerTexts);
      const goalsIdx = pickGoalsIndex(headerTexts);

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (!cells.length) { return; }

        const textAt = (idx: number) => normalize(cells[idx]?.textContent || '');
        const seasonText = seasonIdx >= 0 ? textAt(seasonIdx) : textAt(0);
        const teamText = teamIdx >= 0 ? textAt(teamIdx) : textAt(1);
        const appsText = appsIdx >= 0 ? textAt(appsIdx) : '';
        const goalsText = goalsIdx >= 0 ? textAt(goalsIdx) : '';

        const toNumber = (s: string) => {
          const m = s.replace(/[^0-9]/g, '');
          const n = parseInt(m, 10);
          return isNaN(n) ? 0 : n;
        };

        const appearances = toNumber(appsText);
        const goals = toNumber(goalsText);

        if (seasonText && teamText && appearances > 0 && goals > 0) {
          careerStats.push({
            season: seasonText,
            team: teamText,
            appearances,
            goals
          });
        }
      });
    });

    return {
      name: summary.title,
      description: summary.extract,
      careerStats: careerStats.slice(0, 50)
    };
  }

  handleKeyPress(event: any): any {
    if (event.key === 'Enter') {
      this.searchPlayer();
    }
  }

}

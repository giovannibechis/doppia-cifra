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

  // Computed signal per il totale goal
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
              this.error.set('Statistiche sui goal non disponibili per questo calciatore');
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

    const tables = doc.querySelectorAll('table');
    const careerStats: { season: string; team: string; goals: number; competition: string; }[] = [];

    tables.forEach(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th =>
        th.textContent?.toLowerCase().trim()
      );

      const hasGoalStats = headers.some(h =>
        h?.includes('reti') || h?.includes('goal') || h?.includes('gol')
      ) && headers.some(h =>
        h?.includes('stagione') || h?.includes('anno') || h?.includes('periodo')
      );

      if (hasGoalStats) {
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          if (cells.length < 3) {
            return;
          }

          const seasonText = cells[0]?.textContent?.trim();
          const team = cells[1]?.textContent?.trim();

          const possibleGoals = cells.slice(2).map(cell => {
            const text = cell.textContent?.trim();
            const num = parseInt(text as string, 10);
            return isNaN(num) ? 0 : num;
          }).filter(num => num > 0);

          if (seasonText && team && possibleGoals.length > 0) {
            careerStats.push({
              season: seasonText,
              team,
              goals: Math.max(...possibleGoals),
              competition: 'Tutte le competizioni'
            });
          }
        });
      }
    });

    return {
      name: summary.title,
      description: summary.extract,
      careerStats: careerStats.slice(0, 20)
    };
  }

  handleKeyPress(event: any): any {
    if (event.key === 'Enter') {
      this.searchPlayer();
    }
  }

}

import { Injectable } from '@angular/core';
import {catchError, map, switchMap} from 'rxjs/operators';
import {Observable, of, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {

  constructor(
    private http: HttpClient) {
  }

  // Risolve il titolo corretto della pagina del calciatore gestendo disambiguazioni/redirect
  resolvePlayerTitle(playerName: string): Observable<string> {
    const directSummaryUrl = `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(playerName)}`;

    return this.http.get<any>(directSummaryUrl).pipe(
      map(summary => {
        // Se non è una pagina di disambiguazione, usiamo questo titolo
        if (summary && summary.type !== 'disambiguation' && summary.title) {
          return summary.title as string;
        }
        // Forziamo il fallback alla ricerca
        throw new Error('disambiguation');
      }),
      catchError(() => {
        // Fallback: ricerca per titolo (REST v1)
        const searchUrl = `https://it.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(playerName)}&limit=10`;
        return this.http.get<any>(searchUrl).pipe(
          map(res => {
            const pages: Array<{ title: string } | any> = res?.pages || [];
            if (!pages.length) {
              throw new Error('Calciatore non trovato');
            }
            // Preferisci risultati che contengono "(calciatore" nel titolo, altrimenti il primo
            const preferred = pages.find((p: any) => typeof p.title === 'string' && p.title.toLowerCase().includes('(calciatore'))
              || pages.find((p: any) => typeof p.title === 'string' && p.title.toLowerCase().includes('calciatore'))
              || pages[0];
            return preferred.title as string;
          })
        );
      })
    );
  }

  // Manteniamo un metodo compatibile che ritorna il summary, risolto dal titolo corretto
  searchPlayer(playerName: string): Observable<any> {
    return this.resolvePlayerTitle(playerName).pipe(
      switchMap((title: string) => {
        const summaryUrl = `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        return this.http.get(summaryUrl).pipe(
          catchError((error: { status: number; }) => {
            if (error.status === 404) {
              throw new Error('Calciatore non trovato');
            }
            throw new Error('Errore durante la ricerca');
          })
        );
      })
    );
  }

  getPlayerContent(title: string | number | boolean): Observable<any> {
    const contentUrl = `https://it.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;

    return this.http.get(contentUrl, { responseType: 'text' }).pipe(
      catchError(() => {
        throw new Error('Impossibile recuperare i dati della pagina');
      })
    );
  }
}

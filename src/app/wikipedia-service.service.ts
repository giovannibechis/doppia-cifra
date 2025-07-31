import { Injectable } from '@angular/core';
import {catchError} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WikipediaService {

  constructor(private http: HttpClient) {

  }

  searchPlayer(playerName: string): Observable<any> {
    const summaryUrl = `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(playerName)}`;

    return this.http.get(summaryUrl).pipe(
      catchError((error: { status: number; }) => {
        if (error.status === 404) {
          throw new Error('Calciatore non trovato');
        }
        throw new Error('Errore durante la ricerca');
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

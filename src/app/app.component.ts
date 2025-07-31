import {Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'doppia-cifra';
  res: any;

  constructor(
    private httpClient: HttpClient
  ) {
  }

  ngOnInit(): void {
    // this.fetchAsync();
    const search = `https://it.wikipedia.org/w/api.php?action=query&format=json&prop=links&list=search&srsearch=belotti&incategory=Calciatori_italiani_del_XX_secolo&origin=*`;
    this.httpClient.get(`${search}`)
      .subscribe({
          next: (res: any) => {
            console.log(res);
            this.res = res;
          }
      });
  }

}

import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'doppia-cifra';

  ngOnInit(): void {
    this.fetchAsync();
  }

  async  doFetch(): Promise<void> {

    const rsp = await fetch(
      'http://it.wikipedia.org/w/api.php?action=opensearch&limit=10&format=json&search=belotti'
    );
    return await rsp.json();
  }

  async fetchAsync(): Promise<void> {
    try {
      const result = await this.doFetch();
      console.log(result);
    } catch (err: any) {
      console.error(err.message);
    }
  }

}

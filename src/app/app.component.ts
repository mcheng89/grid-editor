import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  columns: any = [{
    dataField: "name",
    description: "Name",
    width: 250
  }, {
    dataField: "address",
    description: "Address"
  }];
  data: any = [];
  
  ngOnInit() {
    const colCnt = 100;
    for (let i=0; i<colCnt; i++) {
      this.columns.push({
        dataField: "col" + i,
        description: "Column " + i
      });
    }
    for (let i=0; i<100; i++) {
      const row = {
        name: "Hello" + i,
        address: "World" + i
      };
      for (let x=0; x<colCnt; x++) {
        row["col" + x] = "Value " + x;
      }
      this.data.push(row);
    }
  }

  onEditStart(event) {
    console.log(event);
    event.target.querySelector('input').focus();
  }
}

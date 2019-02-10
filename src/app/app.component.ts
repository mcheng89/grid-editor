import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  columns: any = [{
    dataField: "id",
    description: " ",
    width: 25,
    fixed: true
  }, {
    dataField: "name",
    description: "Name",
    width: 150,
  }, {
    dataField: "address",
    description: "Address",
    width: 250
  }];
  data: any = [];
  
  ngOnInit() {
    const colCnt = 30;
    for (let i=0; i<colCnt; i++) {
      this.columns.push({
        dataField: "col" + i,
        description: "Column " + i
      });
    }
    for (let i=0; i<100; i++) {
      const row = {
        id: i,
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

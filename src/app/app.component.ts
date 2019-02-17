import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  tabs: any[] = [{
    colCnt: 30,
    rowCnt: 100,
    columns: [],
    data: []
  }, {
    colCnt: 10,
    rowCnt: 50,
    columns: [],
    data: []
  }];
  currentTab = this.tabs[0];
  
  ngOnInit() {
    for (let i=0; i<this.tabs.length; i++) {
      const tab = this.tabs[i];

      tab.columns = [{
        dataField: "id",
        description: " ",
        width: 25,
        fixed: true
      }, {
        dataField: "name",
        description: "Name",
        width: 150,
        allowEditing: false
      }, {
        dataField: "address",
        description: "Address",
        width: 250,
        cssClass: "test",
      }];

      for (let i=0; i<tab.colCnt; i++) {
        tab.columns.push({
          dataField: "col" + i,
          description: "Column " + i
        });
      }

      for (let i=0; i<tab.rowCnt; i++) {
        const row = {
          id: i,
          name: "Hello" + i,
          address: "World" + i
        };
        for (let x=0; x<tab.colCnt; x++) {
          row["col" + x] = "Value " + x;
        }
        tab.data.push(row);
      }
    }
  }

  modifyData() {
    this.currentTab.data = this.currentTab.data.map(row => {
      for (let x=0; x<this.currentTab.colCnt; x++) {
        row["col" + x] += " Value ";
      }
      return row;
    })
  }

  toggleVisible() {
    this.currentTab.columns.forEach((col, idx) => {
      col.visible = idx % 2 || (col.visible === false ? true : false);
    });
    console.log(this.currentTab.columns);
  }

  onEditStart(event) {
    console.log(event);
    event.target.querySelector('input').focus();
  }

  onSelect(event) {
    console.log(event);
  }
}

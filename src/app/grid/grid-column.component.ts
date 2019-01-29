import { Component, Input, ContentChildren, QueryList, AfterViewInit } from '@angular/core';

import { GridTemplateDirective } from './grid-template.directive';

@Component({
  selector: 'grid-column',
  template: '',
})
export class GridColumnComponent implements AfterViewInit {
  @Input('dataField') dataField: string;
  @Input() description: string;
  @Input() data: any;
  
  @ContentChildren(GridTemplateDirective) templateRef: QueryList<GridTemplateDirective>;
  headerRef: any;
  editorRef: any;
  
  ngAfterViewInit() {
    this.headerRef = this.templateRef.find(tpl => {
      return tpl.letOf == 'header';
    }).templateRef;
    this.editorRef = this.templateRef.find(tpl => {
      return tpl.letOf == 'editor';
    }).templateRef;
  }
}

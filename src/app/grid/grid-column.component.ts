import { Component, Input, ContentChildren, QueryList, OnInit, AfterContentInit } from '@angular/core';

import { GridTemplateDirective } from './grid-template.directive';

@Component({
  selector: 'grid-column',
  template: '',
})
export class GridColumnComponent implements OnInit, AfterContentInit {
  @Input('dataField') dataField: string;
  @Input() description: string;
  @Input() width: number;
  @Input() fixed: boolean;
  @Input() allowEditing: boolean;
  @Input() cssCls: string;
  @Input() data: any;

  renderedWidth: number;
  
  @ContentChildren(GridTemplateDirective) templateRef: QueryList<GridTemplateDirective>;
  headerRef: any;
  editorRef: any;
  
  ngOnInit() {
    this.renderedWidth = this.width;
  }
  ngAfterContentInit() {
    this.headerRef = this.templateRef.find(tpl => {
      return tpl.letOf == 'header';
    }).templateRef;
    this.editorRef = this.templateRef.find(tpl => {
      return tpl.letOf == 'editor';
    }).templateRef;
  }
}

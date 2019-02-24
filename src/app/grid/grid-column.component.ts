import { Component, Input, ContentChildren, QueryList, OnInit, AfterContentInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';

import { GridTemplateDirective } from './grid-template.directive';
import { GridEditorService } from './grid-editor.service';

@Component({
  selector: 'grid-column',
  template: '',
})
export class GridColumnComponent implements OnInit, AfterContentInit, OnChanges, AfterViewInit {
  @Input('dataField') dataField: string;
  @Input() description: string;
  @Input() width: number;
  @Input() fixed: boolean;
  @Input() allowEditing: boolean;
  @Input() visible: boolean;
  @Input() cssCls: string;
  @Input() data: any;

  minWidth: number = 50;
  renderedWidth: number;
  
  @ContentChildren(GridTemplateDirective) templateRef: QueryList<GridTemplateDirective>;
  headerRef: any;
  editorRef: any;

  constructor(private gridSvc: GridEditorService) { }
  
  initialized: boolean = false;
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
  ngAfterViewInit() {
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized) {
      if (changes.visible) {
        this.gridSvc.columnVisibility.next();
      } else if (changes.allowEditing) {
        this.gridSvc.columnEditable.next();
      }
    }
  }
}

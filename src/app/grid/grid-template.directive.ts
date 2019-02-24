import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[geTemplate]'
})
export class GridTemplateDirective {
  @Input()
  set geTemplateOf(value: string) {
    this.letOf = value;
  }
  letOf: string;
  
  constructor(public templateRef: TemplateRef<any>) {}
}
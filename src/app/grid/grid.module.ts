import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { GridEditorComponent } from './grid-editor.component';
import { GridColumnComponent } from './grid-column.component';
import { GridSelectionComponent } from './grid-selection.component';
import { GridEditingComponent } from './grid-editing.component';
import { GridResizingComponent } from './grid-resizing.component';
import { GridTemplateDirective } from './grid-template.directive';

@NgModule({
  declarations: [
    GridEditorComponent,
    GridColumnComponent,
    GridSelectionComponent,
    GridEditingComponent,
    GridResizingComponent,
    GridTemplateDirective
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    GridEditorComponent,
    GridColumnComponent,
    GridTemplateDirective,
  ],
})
export class GridModule { }

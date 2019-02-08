import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { GridEditorComponent } from './grid/grid-editor.component';
import { GridColumnComponent } from './grid/grid-column.component';
import { GridSelectionComponent } from './grid/grid-selection.component';
import { GridTemplateDirective } from './grid/grid-template.directive';

@NgModule({
  declarations: [
    AppComponent,
    GridEditorComponent,
    GridColumnComponent,
    GridSelectionComponent,
    GridTemplateDirective
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

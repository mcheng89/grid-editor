import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { GridEditorComponent } from './grid/grid-editor.component';
import { GridColumnComponent } from './grid/grid-column.component';
import { GridTemplateDirective } from './grid/grid-template.directive';

@NgModule({
  declarations: [
    AppComponent,
    GridEditorComponent,
    GridColumnComponent,
    GridTemplateDirective
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

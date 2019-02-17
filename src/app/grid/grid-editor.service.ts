import { Injectable }    from '@angular/core';

import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable()
export class GridEditorService {
  columnVisibility: Subject<any> = new Subject<any>();
  onColumnVisibilityChanging(): Observable<any> {
    return this.columnVisibility.pipe(debounceTime(10));
  }
  columnVisibilityChanging() {
    this.columnVisibility.next();
  }
}

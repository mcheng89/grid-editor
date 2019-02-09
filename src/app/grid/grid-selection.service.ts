import { Injectable }    from '@angular/core';

import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class GridSelectionService {
  // prevent keyboard focus change when editing...
  focusChange: Subject<any> = new Subject<any>();
  onKeyboardFocusChanging(): Observable<any> {
    return this.focusChange.pipe(filter((event) => !event.cancel));
  }
  keyboardFocusChanging() {
    let cancelableEvent = {cancel: false};
    this.focusChange.next(cancelableEvent);
    return !cancelableEvent.cancel;
  }
  
  focusCell: Subject<any> = new Subject<any>();
  onFocusChange(source: any): Observable<any> {
    return this.focusCell.pipe(filter((event) => event.source != source));
  }
  setFocusCell(source: any, target: any) {
    this.focusCell.next({source: source, ...target});
  }
}

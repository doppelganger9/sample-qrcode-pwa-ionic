import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

/* Pages */
import { QRScanPage } from './pages/qrscan/qrscan';

/* Providers */

@NgModule({
  imports: [
    // makes the exported declarations of other modules available in the current module
    IonicModule,
  ],
  declarations: [
    // are to make directives (including components and pipes) from the current module
    // available to other directives in the current module.
    // Selectors of directives, components or pipes are only matched against the HTML
    // if they are declared or imported.
    QRScanPage,
  ],
  entryComponents: [
    // registers components for offline compilation so that they can be used with
    // ViewContainerRef.createComponent(). Components used in router configurations
    // are added implicitely.
    QRScanPage,
  ],
  exports: [
    // makes the components, directives, and pipes available in modules that add this
    // module to imports.  exports can also be used to re-export modules such as
    // CommonModule and FormsModule, which is often done in shared modules.
    QRScanPage,
  ],
  providers: [
    // are to make services and values known to DI. They are added to the root scope and
    // they are injected to other services or directives that have them as dependency.
  ]
})
export class QRScannerModule {}

export { QRScanPage };

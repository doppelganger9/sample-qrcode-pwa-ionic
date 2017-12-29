import { DOCUMENT } from '@angular/platform-browser';
import { Component, Inject, NgZone } from '@angular/core';
import {
  NavController,
  Platform,
  ToastController,
  Events
} from 'ionic-angular';

// ---- PWA browser lib without Ionic-Native and cordova platform browser ----
import * as UglyQRScannerLibraryGlobalObject from 'cordova-plugin-qrscanner/dist/cordova-plugin-qrscanner-lib.min';

export class QRScannerStatus {
  authorized: boolean;
  denied: boolean;
  restricted: boolean;
  prepared: boolean;
  scanning: boolean;
  previewing: boolean;
  showing: boolean;
  lightEnabled: boolean;
  canOpenSettings: boolean;
  canEnableLight: boolean;
  canChangeCamera: boolean;
  currentCamera: number;
}

/**
 * This Page demonstrates two things:
 *
 * - a hacky way to make transparent ALL THE THINGS! So that the video preview can show through.
 * - hacky way to import the library of the plug into be used in a PWA (ionic serve only) way.
 *   (see https://github.com/bitpay/cordova-plugin-qrscanner#electron-or-nwjs-usage-without-cordova-browser),
 *
 * Sadly, the latter does not work on mobile browsers :-(
 *
 */
@Component({
  selector: 'page-qrscan',
  templateUrl: 'qrscan.html'
})
export class QRScanPage {
  status: QRScannerStatus;

  scannedText: string;

  qrScanner?: any = UglyQRScannerLibraryGlobalObject;

  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    private toastCtrl: ToastController,
    private zone: NgZone,
    public events: Events,
    @Inject(DOCUMENT) private document // angular 2 DI Token to represent the browser's document entity. Not available if running in a worker !
  ) {
    console.log('QRScanPage#constructor');
    this.status = new QRScannerStatus();
  }

  ionViewDidLoad() {
    console.log('QRScanPage#ionViewDidLoad()');
  }

  ionViewDidEnter() {
    console.log('QRScanPage#ionViewDidEnter()');
    // For the best user experience, make sure the user is ready to give your app
    // camera access before you show the prompt. On iOS, you only get one chance.
    this.platform.ready().then(() => {
      console.log('QRScanPage#ionViewDidEnter()#platform.ready.then()');

      let currentStatus = Object.assign(new QRScannerStatus(), this.status);

      this.qrScanner.prepare((err, status) => {
        if (err) {
          // here we can handle errors and clean up any loose ends.
          let toast = this.toastCtrl.create({
            message: err._message,
            position: 'middle',
            showCloseButton: true,
            dismissOnPageChange: true
          });
          toast.onDidDismiss((data, role) => {
            console.log('toast dismissed', data, role);
          });
          toast.present();

          console.error(err);
          return;
        }
        console.log(
          'QRScanPage#ionViewDidEnter()#platform.ready.then()#QRScanner.prepare#callback'
        );
        this.status = status;
        if (status.showing && status.showing !== currentStatus.showing) {
          //showing switched ON while calling prepare() (thus, no need to call show() later on).
          this.setIonicAppTransparency(true, this.zone);
        }

        console.log('QRScanner is initialized. Status:', status);
        if (status.authorized) {
          // W00t, you have camera access and the scanner is initialized.
          // QRscanner.show() should feel very fast.
        } else if (status.denied) {
          // The video preview will remain black, and scanning is disabled. We can
          // try to ask the user to change their mind, but we'll have to send them
          // to their device settings with `QRScanner.openSettings()`.
        } else {
          // we didn't get permission, but we didn't get permanently denied. (On
          // Android, a denial isn't permanent unless the user checks the "Don't
          // ask again" box.) We can ask again at the next relevant opportunity.
        }

        this.zone.run(() => {
          //console.log('force refreshed the view to apply class changes bindings');
        });
      });
    });
  }

  ionViewWillLeave() {
    console.log('QRScanPage#ionViewWillLeave()');
    // turn off the lights, if ON.
    if (this.status.lightEnabled) {
      this.switchLights();
    }

    this.platform.ready().then(() => {
      this.qrScanner.destroy(status => {
        this.status = status;
        console.log(status);
        this.setIonicAppTransparency(false, this.zone);
      });
    });
  }

  showQRScanner(): void {
    console.log('QRScanPage#showQRScanner()');
    // Make the webview transparent so the video preview is visible behind it.
    this.platform.ready().then(() => {
      this.qrScanner.show(status => {
        console.log(status);
        this.status = status;
        this.setIonicAppTransparency(true, this.zone);
      });
    });
    // Be sure to make any opaque HTML elements transparent here to avoid
    // covering the video.
  }

  hideQRScanner(): void {
    console.log('QRScanPage#hideQRScanner()');
    this.platform.ready().then(() => {
      this.qrScanner.hide(status => {
        if (this.status.previewing) {
          this.qrScanner.pausePreview(status => {
            console.log(status);
            this.status = status;
            this.setIonicAppTransparency(false, this.zone);
          });
        } else {
          this.status = status;
          console.log(status);
          this.setIonicAppTransparency(false, this.zone);
        }
      });
    });
  }

  switchCamera(cameraType: number): void {
    console.log('QRScanPage#switchCamera()', cameraType);
    //var back = 0; // default camera on plugin initialization
    //var front = 1;
    this.platform.ready().then(() => {
      this.qrScanner.useCamera(+cameraType, (err, status) => {
        if (err) {
          console.log(
            'QRScanPage#switchCamera()#platform.ready.then()#QRScanner.useCamera#catch',
            err
          );
          console.error(err);
          return;
        }
        console.log(
          'QRScanPage#switchCamera()#platform.ready.then()#QRScanner.useCamera#then',
          status
        );
        if (status) {
          this.status = status;
        }
        this.zone.run(() => {
          //console.log('force refreshed the view to apply class changes bindings');
        });
      });
    });
  }

  openAppSettings(): void {
    console.log('QRScanPage#openAppSettings()');
    this.platform.ready().then(() => {
      this.qrScanner.getStatus(status => {
        this.status = status;
        if (!status.authorized && status.canOpenSettings) {
          if (
            confirm(
              'Would you like to enable QR code scanning? You can allow camera access in your settings.'
            )
          ) {
            this.qrScanner.openSettings();
          } else {
            console.log('QRScanPage#not confirmed');
          }
        } else {
          console.log('QRScanPage#status', status);
        }
        this.zone.run(() => {
          //console.log('force refreshed the view to apply class changes bindings');
        });
      });
    });
  }

  switchLights() {
    if (this.status.lightEnabled) {
      this.platform.ready().then(() => {
        this.qrScanner.disableLight((err, status) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(status);
          this.status = status;
          this.zone.run(() => {
            //console.log('force refreshed the view to apply class changes bindings');
          });
        });
      });
    } else {
      this.platform.ready().then(() => {
        this.qrScanner.enableLight((err, status) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(status);
          this.status = status;

          this.zone.run(() => {
            //console.log('force refreshed the view to apply class changes bindings');
          });
        });
      });
    }
  }

  resumePreview(): void {
    console.log('QRScanPage#resumePreview()');
    this.platform.ready().then(() => {
        this.qrScanner.resumePreview(status => {
          console.log(status);
          this.status = status;
          this.zone.run(() => {
            //console.log('force refreshed the view to apply class changes bindings');
          });
        });
    });
  }

  pausePreview(): void {
    console.log('QRScanPage#pausePreview()');
    this.platform.ready().then(() => {
        this.qrScanner.pausePreview(status => {
          console.log(status);
          this.status = status;
          this.zone.run(() => {
            //console.log('force refreshed the view to apply class changes bindings');
          });
        });
    });
  }

  scanQRCode(): void {
    console.log('QRScanPage#scanQRCode()');
    // Start a scan. Scanning will continue until something is detected or
    // `QRScanner.cancelScan()` is called.
    this.status.scanning = true;
    this.platform.ready().then(() => {
      this.qrScanner.scan((err, text) => {
        if (err) {
          console.error(err);
          let toast = this.toastCtrl.create({
            message: err.name,
            duration: 3000,
            position: 'middle'
          });
          toast.onDidDismiss((data, role) => {
            console.log('toast dismissed', data, role);
          });
          toast.present();
          // an error occurred, or the scan was canceled (error code `6`)
          return;
        }
        this.status.scanning = false;

        this.qrScanner.pausePreview(status => {
          console.log(status);
          this.status = status;
          this.zone.run(() => {
            //console.log('force refreshed the view to apply class changes bindings');
          });
          setTimeout(() => this.hideQRScanner(), 2000);
        });

        // The scan completed, display the contents of the QR code:
        console.log(text);
        this.scannedText = text;

        let toast = this.toastCtrl.create({
          message: text,
          duration: 3000,
          position: 'middle',
        });
        toast.onDidDismiss((data, role) => {
          console.log('toast dismissed', data, role);
        });
        toast.present();

        this.zone.run(() => {
          //console.log('force refreshed the view to apply class changes bindings');
        });
      });
    });
    // });
  }

  cancelScan(): void {
    console.log('QRScanPage#cancelScan()');
    // Start a scan. Scanning will continue until something is detected or
    // `QRScanner.cancelScan()` is called.
    this.platform.ready().then(() => {
      this.qrScanner.cancelScan(status => {
        console.log(status);
        this.status = status;

        this.zone.run(() => {
          //console.log('force refreshed the view to apply class changes bindings');
        });
      });
    });
  }

  private setIonicAppTransparency(enabled: boolean, zone: NgZone): void {
    console.log('QRScanPage#setIonicAppTransparency()', enabled);
    let qrScanTransparencyClass = 'qrscan-transparent';

    let ionAppEl = this.document.getElementsByTagName('ion-app')[0];
    let ionNavEl = this.document.getElementsByTagName('ion-nav')[0];
    //let ionContentEl = this.document.getElementsByTagName('ion-content')[0];
    let divNavDecorEl = this.document.getElementsByClassName('nav-decor')[0];

    ionAppEl && this.toggleClass(qrScanTransparencyClass, ionAppEl, enabled);
    ionNavEl && this.toggleClass(qrScanTransparencyClass, ionNavEl, enabled);
    //this.toggleClass(qrScanTransparencyClass, ionContentEl, enabled);
    divNavDecorEl &&
      this.toggleClass(qrScanTransparencyClass, divNavDecorEl, enabled);

    zone.run(() => {
      //console.log('force refreshed the view to apply class changes bindings');
    });
  }

  private toggleClass(className: string, element: any, enable: boolean): void {
    let elmClassAttr: string = element.hasAttribute('class')
      ? element.getAttribute('class')
      : '';
    var newClassAttr: string;
    console.log('QRScanPage#toggleClass()', className, element, enable);

    if (enable) {
      if (elmClassAttr.indexOf(className) < 0) {
        newClassAttr = (elmClassAttr + ' ' + className).trim();
        console.log(
          'QRScanPage#toggleClass() : add class',
          className,
          element,
          enable,
          elmClassAttr,
          newClassAttr
        );

        element.setAttribute('class', newClassAttr);
      } else {
        console.log(
          'QRScanPage#toggleClass() : did not add class, already there',
          className,
          element,
          enable,
          elmClassAttr,
          newClassAttr
        );
      }
    } else {
      if (elmClassAttr.indexOf(className) >= 0) {
        // has class : remove it.
        newClassAttr = elmClassAttr
          .split(className)
          .join(' ')
          .replace(/  +/g, ' ')
          .trim();
        console.log(
          'QRScanPage#toggleClass() : remove class',
          className,
          element,
          enable,
          elmClassAttr,
          newClassAttr
        );

        if (
          newClassAttr === '' ||
          newClassAttr == null ||
          newClassAttr == 'undefined'
        ) {
          console.log(
            'QRScanPage#toggleClass() : will remove class attr',
            className,
            element,
            enable
          );
          element.removeAttribute('class');
        } else {
          console.log(
            'QRScanPage#toggleClass() : new class attr',
            className,
            element,
            enable,
            newClassAttr
          );
          element.setAttribute('class', newClassAttr);
        }
      } else {
        console.log(
          'QRScanPage#toggleClass() : did not remove class, because it was not found',
          className,
          element,
          enable,
          elmClassAttr,
          newClassAttr
        );
      }
    }
  }
}

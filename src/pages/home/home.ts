import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { QRScanPage } from '../../qrmodule/qrscanner.module';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  constructor(public navCtrl: NavController) {}

  goToQRScan() {
    this.navCtrl.push(QRScanPage);
  }
}

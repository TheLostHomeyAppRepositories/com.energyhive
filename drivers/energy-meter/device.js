'use strict';

const { Device } = require('homey');

const { sleep, checkCapabilities, startInterval, clearIntervals } = require('../../lib/helpers');

const INTERVAL = 60000;

class EnergyMeterDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log(`${this.getName()} - onInit`);
    this.setUnavailable(`Initializing ${this.getName()}`).catch(this.error);

    checkCapabilities(this);
    startInterval(this, INTERVAL);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log(`${this.getName()} - onAdded`);
    this.log(`${this.getName()} - onAdded done`);
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log(`${this.getName()} - onSettings: ${JSON.stringify(changedKeys)}`);
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log(`${this.getName()} - onRenamed`);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log(`${this.getName()} - onDeleted`);
    clearIntervals(this);
  }

  /**
   * @description Main polling interval to perform periodic actions.
   */
  async onInterval() {
    this.log(`${this.getName()} - onInterval`);
    const now = new Date();
    const nowMinutes = now.getMinutes();

    // Purge rain history every five minutes
    // if (nowMinutes % 5 === 0) this.purgeRainHistory();

    // Trasmit data to APRS-IS every txInterval minutes for devices that transmit.
    // if (this.txInterval) {
    //   if (nowMinutes % this.txInterval === 0) {
    //    this.log(`${this.getName()} - onInterval - txInterval - ${this.txInterval} minutes`);
    //  }
    // }

    // Restart Interval if offset in seconds is more than 5 seconds
    if (now.getSeconds() >= 5) {
      this.log(`${this.getName()} - onInterval - restart interval`);
      clearIntervals(this);
      startInterval(this, INTERVAL);
    }
    this.log(`${this.getName()} - onInterval done`);
  }

}

module.exports = EnergyMeterDevice;

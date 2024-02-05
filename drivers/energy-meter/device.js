'use strict';

const { Device } = require('homey');

const { getTimestampInSeconds, checkCapabilities, startInterval, clearIntervals, sleep } = require('../../lib/helpers');
const Energyhive = require('../../lib/energyhive');

const INTERVAL = 60000;

class EnergyMeterDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log(`${this.getName()} - onInit`);
    this.setUnavailable(`Initializing ${this.getName()}`).catch(this.error);

    this.energyhive = new Energyhive({
      apikey: this.getApiKey(),
      deviceId: this.getSetting('deviceId'),
      logger: this.log,
    });

    checkCapabilities(this);

    // Get last saved meter_power value from store
    if (this.getCapabilityValue('meter_power') === null) {
      this.setCapabilityValue('meter_power', this.getStoreValue('meter_power'));
    }

    startInterval(this, INTERVAL);
    this.setAvailable();
  }

  getApiKey() {
    return this.getStoreValue('apikey');
  }

  getDeviceId() {
    const deviceData = this.getData();
    return deviceData.id;
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log(`${this.getName()} - onAdded`);
    this.setStoreValue('meter_power', 0);
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
   * @description call energyhive api to get values for the last minute (0-59 seconds of the minute) and sum them
   * @returns {number} sum of Wm for the last minute
   */

  async getLastMinutePowerkWh() {
    const end = (Math.floor(getTimestampInSeconds() / 60) * 60) - 1;
    const start = end - 59;

    await sleep(5000);
    this.log(`${this.getName()} - getPowerWm - ${this.getDeviceId()} start: ${start} - end: ${end}`);
    try {
      const kWh = (await this.energyhive.getHistorySummary(this.getApiKey(), this.getDeviceId(), start, end)) / 60000;
      this.log(`${this.getName()} - getPowerWm - ${kWh} kWh`);
      return kWh;
    } catch (error) {
      this.error(`${this.getName()} - getPowerWm Error - ${error}`);
      return 0;
    }
  }

  /**
   * @description update meter_power capability value by adding powerkWh value to the previous value
   * @param {number} powerkWh current power value in kWh
   */
  async updateMeterPower(powerkWh) {
    const meterPower = this.getCapabilityValue('meter_power');
    const newMeterPower = meterPower + powerkWh;
    this.log(`${this.getName()} - updateMeterPower - ${meterPower} + ${powerkWh} = ${newMeterPower}`);
    this.setCapabilityValue('meter_power', newMeterPower);
  }

  /**
   * @description Main polling interval to perform periodic actions.
   */
  async onInterval() {
    this.log(`${this.getName()} - onInterval`);
    const now = new Date();
    const nowMinutes = now.getMinutes();

    const lastMinutePowerkWh = await this.getLastMinutePowerkWh();
    this.updateMeterPower(lastMinutePowerkWh);

    // Restart Interval, if offset in seconds is more than 5 seconds
    if (now.getSeconds() >= 5) {
      this.log(`${this.getName()} - onInterval - restart interval`);
      clearIntervals(this);
      startInterval(this, INTERVAL);
    }
    this.log(`${this.getName()} - onInterval done`);
  }

}

module.exports = EnergyMeterDevice;

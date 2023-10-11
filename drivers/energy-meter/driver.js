'use strict';

const { Driver } = require('homey');
const Energyhive = require('../../lib/energyhive');

class EnergyMeterDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log(`${this.getDriverName()} - onInit`);
  }

  getDriverName() {
    return 'EnergyMeterDriver';
  }

  filterDeviceType = (device) => {
    return device.cid && (device.cid.includes('PWER'));
  }

  filterDevices = (result, apikey) => {
    this.log(`${this.getDriverName()} - filterDevices: ${JSON.stringify(result)}`);
    const filtered = result
      .filter((device) => this.filterDeviceType(device));
    if (filtered.length === 0) {
      throw new Error(this.homey.__('errors.no_devices'));
    }
    return filtered
      .map((device) => ({
        name: `${device.cid}_${device.sid}`,
        data: {
          id: device.sid,
        },
        store: {
          apikey,
        },
      }));
  }

  async onPair(session) {
    let apikey;
    let energyhive;

    this.log(`${this.getDriverName()} - onPair`);

    session.setHandler('apikey_input', async (data) => {
      this.log(`${this.getDriverName()} - onPair - apikey_input - data: ${JSON.stringify(data)}, apikey: ${data.apikey}`);
      apikey = data.apikey;
      energyhive = new Energyhive({
        apikey,
        logger: this.log,
      });
      await session.showView('list_devices');
    });

    session.setHandler('list_devices', async () => {
      let devices;
      this.log(`${this.getDriverName()} - onPair - list_devices`);
      try {
        devices = await energyhive.getAllDevices();
        this.log(`${this.getDriverName()} - onPair - getAllDevices: ${JSON.stringify(devices.data)}`);
      } catch (err) {
        this.log(`${this.getDriverName()} - onPair - getAllDevices failed: ${err}`);
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (!devices.data) {
        this.log(`${this.getDriverName()} - onPair - getAllDevices failed: no devices.`);
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (devices.data.length === 0) {
        this.log(`${this.getDriverName()} - onPair - getAllDevices failed: no devices.`);
        throw new Error(this.homey.__('errors.no_devices'));
      }
      this.log(`${this.getDriverName()} - onPair - done`);
      return this.filterDevices(devices.data, apikey);
    });
  }

  async onRepair(session, device) {
    let apikey;
    let energyhive;

    this.log(`${this.getDriverName()} - onRepair`);

    session.setHandler('apikey_input', async (data) => {
      apikey = data.apikey;
      energyhive = new Energyhive({
        apikey,
        logger: this.log,
      });

      let devices;
      try {
        devices = await energyhive.getAllDevices();
        this.log(`${this.getDriverName()} - onRepair - getAllDevices: ${JSON.stringify(devices.data)}`);
      } catch (err) {
        this.log(`${this.getDriverName()} - onRepair - getAllDevices failed: ${err}`);
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (!devices.data) {
        this.log(`${this.getDriverName()} - onReoair - getAllDevices failed: no devices.`);
        throw new Error(this.homey.__('errors.failed_to_retrieve_devices'));
      }
      if (devices.data.length === 0) {
        this.log(`${this.getDriverName()} - onRepair - getAllDevices failed: no devices.`);
        throw new Error(this.homey.__('errors.no_devices'));
      }
      await device.setStoreValue('apikey', apikey);
      await device.setAvailable();
      this.log(`${this.getDriverName()} - onRepair - done`);
      await session.done();
      return true;
    });
  }

}

module.exports = EnergyMeterDriver;

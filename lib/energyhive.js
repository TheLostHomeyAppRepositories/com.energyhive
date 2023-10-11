'use strict';

const http = require('http.min');

module.exports = class Energyhive {

  constructor(options) {
    if (options == null) {
      options = {};
    }
    this._apikey = options.apikey;
    this._deviceId = options.deviceId;
    this._logger = options.logger;
  }

  getUri() {
    return 'https://www.energyhive.com/mobile_proxy';
  }

  getDeviceId() {
    return this._deviceId;
  }

  getApiKey() {
    return this._apikey;
  }

  async getAllDevices() {
    return http({
      uri: `${this.getUri()}/getCurrentValuesSummary?token=${this.getApiKey()}`,
      json: true,
    });
  }

  async getAllDeviceInfo(apiKey) {
    return http({
      uri: `${this.getUri()}/getCurrentValuesSummary?token=${apiKey}`,
      json: true,
    });
  }

};

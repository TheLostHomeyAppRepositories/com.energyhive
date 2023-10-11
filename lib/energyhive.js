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

  getUrl() {
    return 'https://www.energyhive.com/mobile_proxy';
  }

  getDeviceId() {
    return this._deviceId;
  }

  getApiKey() {
    return this._apikey;
  }

  /**
   * @description Get the available devices from Energyhive API
   * @returns {Promise} Promise with the result
   */
  async getAllDevices() {
    return http({
      uri: `${this.getUrl()}/getCurrentValuesSummary?token=${this.getApiKey()}`,
      json: true,
    });
  }

  /**
   * @description Get the power data from Energyhive API for the last minute (0-59 seconds) filtered by sid
   * @param {string} apiKey Energyhive API key
   * @param {string} sid Energyhive device id
   * @param {string} start Start timestamp
   * @param {string} end End timestamp
   * @returns {Promise} Promise with the result
   * @sammpleapicall https://www.energyhive.com/mobile_proxy/getHV?token=energyhive_token&period=custom&fromTime=start&toTime=end&type=PWER&aggPeriod=hour&aggFunc=sum
   */
  async getCurrentValuesSummary(apiKey, sid, start, end) {
    return new Promise((resolve, reject) => {
      http({
        uri: `${this.getUrl()}/getCurrentValuesSummary?token=${apiKey}&period=custom&fromTime=${start}&toTime=${end}&type=PWER&aggPeriod=hour&aggFunc=sum`,
        json: true,
      }).then((result) => {
        if (result.response.statusCode === 200) {
          try {
            this._logger(`API: Energyhive.getCurrentValuesSummary: ${JSON.stringify(result.data)}`);
            const data = result.data.filter((item) => item.sid === sid);
            if (data != null && data.length > 0) {
              const power = data[0].data[0][Object.keys(data[0].data[0])[0]];
              resolve(power); // Resolve the Promise with the power value
            }
          } catch (error) {
            this._logger(`API: Energyhive.getCurrentValuesSummary: ${error}`);
            reject(error); // Reject the Promise with the error
          }
        } else {
          this._logger(`API: Energyhive.getCurrentValuesSummary: ${result.response.statusCode}`);
          reject(new Error(`HTTP get error - ${result.response.statusCode}`));
        }
      }).catch((error) => {
        this._logger(`API: Energyhive.getLastMinuteSummary: ${error}`);
        reject(error); // Reject the Promise with the error
      });
    });
  }

};

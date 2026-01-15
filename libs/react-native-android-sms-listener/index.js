/* vendored local copy - minimal JS bridge */
const { DeviceEventEmitter } = require('react-native');
const SMS_RECEIVED_EVENT = 'com.centaurwarchief.smslistener:smsReceived';

module.exports = {
  addListener(listener) {
    return DeviceEventEmitter.addListener(SMS_RECEIVED_EVENT, listener);
  }
};

import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import type { EmitterSubscription } from 'react-native';

// Import is optional — package only exists on Android native builds.
let RNAndroidSmsListener: any = null;
try {
  // require so bundler doesn't fail on web/ios
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RNAndroidSmsListener = require('react-native-android-sms-listener');
} catch (e) {
  RNAndroidSmsListener = null;
}

export default function SmsListener(): null {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!RNAndroidSmsListener) {
      console.warn('react-native-android-sms-listener not installed — SMS listening disabled');
      return;
    }

    let sub: EmitterSubscription | null = null;

    async function setup() {
      try {
        const receive = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;
        const read = PermissionsAndroid.PERMISSIONS.READ_SMS;

        const grantedReceive = await PermissionsAndroid.request(receive, {
          title: 'Receive SMS Permission',
          message: 'This app needs permission to receive SMS to detect incoming verification messages.',
          buttonPositive: 'OK',
        });

        const grantedRead = await PermissionsAndroid.request(read, {
          title: 'Read SMS Permission',
          message: 'This app needs permission to read SMS to detect incoming verification messages.',
          buttonPositive: 'OK',
        });

        if (grantedReceive === PermissionsAndroid.RESULTS.GRANTED) {
          // addListener returns an EmitterSubscription-like object
          sub = RNAndroidSmsListener.addListener((message: any) => {
            // message payload example: { originatingAddress, body, timestamp }
            console.log('[SMS Listener] incoming message:', message);
          });
          console.log('[SMS Listener] subscribed to incoming SMS');
        } else {
          console.warn('[SMS Listener] RECEIVE_SMS permission denied');
        }
        if (grantedRead !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('[SMS Listener] READ_SMS permission denied — body may not be available');
        }
      } catch (e) {
        console.warn('[SMS Listener] setup error', e);
      }
    }

    setup();

    return () => {
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
        // some versions return a function
        if (sub && typeof (sub as any) === 'function') (sub as any)();
        console.log('[SMS Listener] unsubscribed');
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return null;
}

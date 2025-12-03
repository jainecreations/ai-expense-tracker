import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import smsService from '@/lib/smsService';
import type { EmitterSubscription } from 'react-native';

// Import is optional — package only exists on Android native builds.
let RNAndroidSmsListener: any = null;
try {
  // require so bundler doesn't fail on web/ios
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-android-sms-listener');
  // some bundlers/transpilers expose an ES module default under .default
  RNAndroidSmsListener = mod && mod.__esModule ? mod.default : (mod?.default ?? mod);
} catch (e) {
  RNAndroidSmsListener = null;
}

// Helpful runtime debug: show whether the native listener module resolved.
try {
  // eslint-disable-next-line no-console
  console.log('[SMS Listener] native module present:', !!RNAndroidSmsListener);
  // Debug: print available keys and addListener type so we can diagnose interop issues
  // eslint-disable-next-line no-console
  console.log('[SMS Listener] native module keys:', RNAndroidSmsListener ? Object.keys(RNAndroidSmsListener) : null);
} catch (e) {
  // ignore during native build time
}

export default function SmsListener(): null {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!RNAndroidSmsListener) {
      console.warn('react-native-android-sms-listener not installed — SMS listening disabled');
      return;
    }

    let sub: EmitterSubscription | null = null;
    const SMART_SMS_KEY = 'settings:smartSmsCapture';

    async function setup() {
      try {
        // In development mode, enable the listener automatically to make testing easier.
        const enabled = __DEV__ ? true : (await AsyncStorage.getItem(SMART_SMS_KEY)) === '1';
        if (!enabled) {
          console.log('[SMS Listener] smart sms disabled by settings');
          return;
        }

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

  // Debug: log permission results so we can see why subscription may not occur
  // eslint-disable-next-line no-console
  console.log('[SMS Listener] permission results receive=', grantedReceive, ' read=', grantedRead);

  // Debug: confirm the native addListener function exists
  // eslint-disable-next-line no-console
  console.log('[SMS Listener] native addListener type=', typeof RNAndroidSmsListener?.addListener);

  if (grantedReceive === PermissionsAndroid.RESULTS.GRANTED) {
          // addListener returns an EmitterSubscription-like object
          sub = RNAndroidSmsListener.addListener(async (message: any) => {
            // message payload example: { originatingAddress, body, timestamp }
            try {
              console.log('[SMS Listener] incoming message:', message);

                  // Persistent de-duplication: maintain a small history of recently
                  // processed message keys in AsyncStorage and ignore repeats.
                  // This helps when native code or platform re-delivers past
                  // broadcasts (or when hot reloads cause multiple listeners).
                  const originating = message?.originatingAddress ?? '';
                  const body = message?.body ?? message?.messageBody ?? '';

                  // If timestamp exists and it's very old, ignore — many of the
                  // "junk" reports are from long-ago messages that somehow get
                  // re-emitted. TTL here is conservative (30 days).
                  const rawTs = message?.timestamp ?? message?.timeStamp ?? message?.date;
                  const ts = rawTs ? parseInt(String(rawTs), 10) : NaN;
                  const now = Date.now();
                  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
                  if (!isNaN(ts) && now - ts > THIRTY_DAYS) {
                    console.log('[SMS Listener] ignoring very old SMS (timestamp)', ts);
                    return;
                  }

                  const key = `${originating}|${body}`;
                  const LAST_KEYS = 'sms:lastProcessedKeys';
                  try {
                    const raw = await AsyncStorage.getItem(LAST_KEYS);
                    const arr = raw ? JSON.parse(raw) : [];
                    // If we've seen this exact originating+body recently, skip it.
                    if (Array.isArray(arr) && arr.indexOf(key) !== -1) {
                      console.log('[SMS Listener] duplicate SMS ignored (recent history)');
                      return;
                    }

                    // push and trim history
                    const MAX = 50;
                    arr.push(key);
                    while (arr.length > MAX) arr.shift();
                    await AsyncStorage.setItem(LAST_KEYS, JSON.stringify(arr));
                  } catch (e) {
                    console.warn('[SMS Listener] dedupe storage error', e);
                  }

                  await smsService.handleIncomingSms(message);
            } catch (e) {
              console.warn('[SMS Listener] handler error', e);
            }
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

    // Removed automatic dev injector: it was causing confusion by creating
    // a sample pending import on every reload. If you need a manual dev
    // test, call `smsService.handleIncomingSms(...)` from the console or a
    // temporary button in the UI.

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

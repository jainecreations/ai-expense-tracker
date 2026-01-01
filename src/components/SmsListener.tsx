import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid, DeviceEventEmitter } from 'react-native';
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
      // Note: continue — we still want to drain pending SMS persisted natively even if the optional
      // RN listener package isn't installed. Do not return here.
    }

    let sub: EmitterSubscription | null = null;
    let deviceSub: EmitterSubscription | null = null;
    const SMART_SMS_KEY = 'settings:smartSmsCapture';

    async function setup() {
      // Helper to handle inbound messages (shared by both listener sources)
      async function handleMessage(message: any) {
        try {
          console.log('[SMS Listener] incoming message (device):', message);

          const originating = message?.originatingAddress ?? message?.originating ?? '';
          const body = message?.body ?? message?.messageBody ?? '';
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
            if (Array.isArray(arr) && arr.indexOf(key) !== -1) {
              console.log('[SMS Listener] duplicate SMS ignored (recent history)');
              return;
            }
            const MAX = 50;
            arr.push(key);
            while (arr.length > MAX) arr.shift();
            await AsyncStorage.setItem(LAST_KEYS, JSON.stringify(arr));
          } catch (e) {
            console.warn('[SMS Listener] dedupe storage error', e);
          }

          await smsService.handleIncomingSms({ originatingAddress: originating, body, timestamp: ts });
        } catch (e) {
          console.warn('[SMS Listener] handler error (device)', e);
        }
      }

      try {
        // Drain any pending messages immediately on mount so they are available
        // even if the user hasn't enabled Smart SMS in settings yet. This helps
        // ensure messages received while the app was closed are not lost.
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { NativeModules } = require('react-native');
          const SmsEventModule = (NativeModules && (NativeModules.SmsEventModule || NativeModules.SmsEventEmitter)) || null;
          if (SmsEventModule && typeof SmsEventModule.readPending === 'function') {
            const pendingImmediate: any[] = await SmsEventModule.readPending();
            // eslint-disable-next-line no-console
            console.log('[SMS Listener] immediate readPending returned', pendingImmediate?.length ?? 0);
            if (Array.isArray(pendingImmediate) && pendingImmediate.length > 0) {
              for (const m of pendingImmediate) {
                try {
                  await handleMessage(m);
                } catch (e) {
                  console.warn('[SMS Listener] error handling immediate pending', e);
                }
              }
            }
          }
        } catch (e) {
          console.warn('[SMS Listener] immediate readPending error', e);
        }

        // In development mode, enable the listener automatically to make testing easier.
        const enabled = __DEV__ ? true : (await AsyncStorage.getItem(SMART_SMS_KEY)) === '1';
        if (!enabled) {
          console.log('[SMS Listener] smart sms disabled by settings');
          return;
        }

        // Drain any pending messages persisted by the native receiver on cold start.
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { NativeModules } = require('react-native');
          const SmsEventModule = (NativeModules && (NativeModules.SmsEventModule || NativeModules.SmsEventEmitter)) || null;
          if (SmsEventModule && typeof SmsEventModule.readPending === 'function') {
            const pending: any[] = await SmsEventModule.readPending();
            // eslint-disable-next-line no-console
            console.log('[SMS Listener] startup readPending returned', pending?.length ?? 0);
            if (Array.isArray(pending) && pending.length > 0) {
              for (const m of pending) {
                try {
                  await handleMessage(m);
                } catch (e) {
                  console.warn('[SMS Listener] error handling startup pending', e);
                }
              }
            }
          }
        } catch (e) {
          console.warn('[SMS Listener] startup readPending error', e);
        }

        // Confirm native module exposes an addListener function before proceeding.
        if (typeof RNAndroidSmsListener?.addListener !== 'function') {
          console.warn('[SMS Listener] native module addListener not available — SMS listening disabled');
          // do not return; we already drained pending above and can exit gracefully
          return;
        }

        // Request both permissions together so the user sees a single prompt on modern Android.
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
        ]);

        const grantedReceive = results[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
        const grantedRead = results[PermissionsAndroid.PERMISSIONS.READ_SMS];

        // Debug: log permission results so we can see why subscription may not occur
        // eslint-disable-next-line no-console
        console.log('[SMS Listener] permission results receive=', grantedReceive, ' read=', grantedRead);

        const LAST_KEYS = 'sms:lastProcessedKeys';
        const MAX = 50;

        // If the native side persisted SMS while the app was closed, read and process them now.
        try {
          // Lazily require NativeModules so bundlers for non-Android platforms don't break.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { NativeModules } = require('react-native');
          const SmsEventModule = (NativeModules && (NativeModules.SmsEventModule || NativeModules.SmsEventEmitter)) || null;
          if (SmsEventModule && typeof SmsEventModule.readPending === 'function') {
            // readPending() is expected to return a Promise resolving to an array of messages
            const pending: any[] = await SmsEventModule.readPending();
            // eslint-disable-next-line no-console
            console.log('[SMS Listener] native readPending returned', pending?.length ?? 0);

            if (Array.isArray(pending) && pending.length > 0) {
              for (const m of pending) {
                try {
                  const originating = m?.originatingAddress ?? m?.originating ?? '';
                  const body = m?.body ?? m?.messageBody ?? '';
                  const ts = m?.timestamp ?? Date.now();

                  // TTL check similar to live handler
                  const now = Date.now();
                  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
                  if (!isNaN(ts) && now - ts > THIRTY_DAYS) {
                    console.log('[SMS Listener] ignoring very old pending SMS (timestamp)', ts);
                    continue;
                  }

                  const key = `${originating}|${body}`;
                  try {
                    const raw = await AsyncStorage.getItem(LAST_KEYS);
                    const arr = raw ? JSON.parse(raw) : [];
                    if (Array.isArray(arr) && arr.indexOf(key) !== -1) {
                      console.log('[SMS Listener] pending SMS duplicate ignored (history)');
                      continue;
                    }
                    arr.push(key);
                    while (arr.length > MAX) arr.shift();
                    await AsyncStorage.setItem(LAST_KEYS, JSON.stringify(arr));
                  } catch (e) {
                    console.warn('[SMS Listener] dedupe storage error while draining pending', e);
                  }

                  await smsService.handleIncomingSms({ originatingAddress: originating, body, timestamp: ts });
                } catch (e) {
                  console.warn('[SMS Listener] error handling pending sms', e);
                }
              }
            }
          }
        } catch (e) {
          console.warn('[SMS Listener] readPending error', e);
        }

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

          // Also subscribe to the native emitter we added (SmsEventEmitter emits 'SMS_RECEIVED')
          try {
            deviceSub = DeviceEventEmitter.addListener('SMS_RECEIVED', (msg: any) => {
              handleMessage(msg);
            });
            console.log('[SMS Listener] subscribed to DeviceEventEmitter SMS_RECEIVED');
          } catch (e) {
            console.warn('[SMS Listener] DeviceEventEmitter subscribe failed', e);
          }
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
        if (deviceSub && typeof deviceSub.remove === 'function') deviceSub.remove();
        if (deviceSub && typeof (deviceSub as any) === 'function') (deviceSub as any)();
        console.log('[SMS Listener] unsubscribed');
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return null;
}

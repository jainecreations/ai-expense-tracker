package com.centaurwarchief.smslistener;

import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.os.Build;
import android.provider.Telephony;
import android.util.Log;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public class SmsListenerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String TAG = "SmsListenerModule";
    private BroadcastReceiver mReceiver;

    public SmsListenerModule(ReactApplicationContext context) {
        super(context);

        mReceiver = new SmsReceiver(context);

        getReactApplicationContext().addLifecycleEventListener(this);
        registerReceiverIfNecessary(mReceiver);
    }

    private void registerReceiverIfNecessary(BroadcastReceiver receiver) {
        ReactApplicationContext ctx = getReactApplicationContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            ctx.registerReceiver(
                receiver,
                new IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
            );

            return;
        }

        ctx.registerReceiver(
            receiver,
            new IntentFilter("android.provider.Telephony.SMS_RECEIVED")
        );
    }

    private void unregisterReceiver(BroadcastReceiver receiver) {
      try{
        getReactApplicationContext().unregisterReceiver(receiver);
      } catch( Exception e){
          Log.d(TAG, e.toString());
      }
    }

    @Override
    public void onHostResume() {
        registerReceiverIfNecessary(mReceiver);
    }

    @Override
    public void onHostPause() {
        unregisterReceiver(mReceiver);
    }

    @Override
    public void onHostDestroy() {
        unregisterReceiver(mReceiver);
    }

    @Override
    public String getName() {
        return "SmsListener";
    }
}

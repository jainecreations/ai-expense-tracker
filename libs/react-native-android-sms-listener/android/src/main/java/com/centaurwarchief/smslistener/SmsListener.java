package com.centaurwarchief.smslistener;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class SmsListener implements ReactPackage {

    public SmsListener() {
        // no-op constructor so autolinking can instantiate the package
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext context) {
        return Arrays.<NativeModule>asList(
            new SmsListenerModule(context)
        );
    }
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext context) {
        return Collections.emptyList();
    }
}

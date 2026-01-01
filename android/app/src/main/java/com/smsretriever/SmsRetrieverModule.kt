package com.smsretriever

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.facebook.react.bridge.ActivityEventListener

class SmsRetrieverModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  init {
    reactContext.addActivityEventListener(this)
    SmsEventEmitter.setContext(reactContext)
  }

  override fun getName(): String = "SmsRetriever"

  @ReactMethod
  fun startRetriever(promise: Promise) {
    val client = SmsRetriever.getClient(reactContext)
    val task = client.startSmsRetriever()

    task.addOnSuccessListener {
      promise.resolve("started")
    }

    task.addOnFailureListener { exception ->
      promise.reject("FAILED", exception)
    }
  }

  // Implementations must match the ActivityEventListener signatures exactly (non-nullable Activity
  // and non-nullable Intent parameter for onNewIntent) so Kotlin recognizes the overrides.
  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    // Not used, but required by interface
  }

  override fun onNewIntent(intent: Intent) {
    // Not used, but required by interface
  }

  // Ensure module exposes SmsEventModule to React
  override fun initialize() {
    // no-op
  }
}

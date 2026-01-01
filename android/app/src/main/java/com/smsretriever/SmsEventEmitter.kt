package com.smsretriever

import android.util.Log
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONArray

object SmsEventEmitter {
  private var context: ReactApplicationContext? = null

  fun setContext(reactContext: ReactApplicationContext) {
    context = reactContext
    Log.i("SmsEventEmitter", "setContext called")
  }

  // Emit a structured object to JS with body, originatingAddress and timestamp
  fun emit(body: String?, originatingAddress: String?, timestamp: Long?) {
    Log.i("SmsEventEmitter", "emit body=${body?.take(80)} originating=${originatingAddress} ts=${timestamp}")
    try {
      val map = WritableNativeMap()
      if (body != null) map.putString("body", body)
      if (originatingAddress != null) map.putString("originatingAddress", originatingAddress)
      map.putDouble("timestamp", timestamp?.toDouble() ?: System.currentTimeMillis().toDouble())

      context?.getJSModule(
        DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
      )?.emit("SMS_RECEIVED", map)
    } catch (e: Exception) {
      Log.w("SmsEventEmitter", "emit failed", e)
    }
  }
}

@ReactModule(name = "SmsEventModule")
class SmsEventModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  init {
    Log.i("SmsEventModule", "created")
  }

  override fun getName(): String = "SmsEventModule"

  @ReactMethod
  fun readPending(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences("sms_prefs", Context.MODE_PRIVATE)
      val raw = prefs.getString("pending_sms", "[]")
      val arr = JSONArray(raw)
      val out = WritableNativeArray()
      for (i in 0 until arr.length()) {
        val o = arr.getJSONObject(i)
        val m = WritableNativeMap()
        m.putString("body", o.optString("body"))
        m.putString("originatingAddress", o.optString("originatingAddress"))
        m.putDouble("timestamp", o.optLong("timestamp", 0).toDouble())
        out.pushMap(m)
      }
      // Clear pending after read
      prefs.edit().putString("pending_sms", "[]").apply()
      promise.resolve(out)
    } catch (e: Exception) {
      Log.w("SmsEventModule", "readPending failed", e)
      promise.reject("E_READ_PENDING", e)
    }
  }

  // Debug helper: return the raw JSON string stored in SharedPreferences for inspection
  @ReactMethod
  fun rawPending(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences("sms_prefs", Context.MODE_PRIVATE)
      val raw = prefs.getString("pending_sms", "[]")
      promise.resolve(raw)
    } catch (e: Exception) {
      Log.w("SmsEventModule", "rawPending failed", e)
      promise.reject("E_RAW_PENDING", e)
    }
  }
}

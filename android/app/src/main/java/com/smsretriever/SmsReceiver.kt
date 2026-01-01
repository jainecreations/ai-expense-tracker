package com.smsretriever

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.provider.Telephony
import android.telephony.SmsMessage
import org.json.JSONArray
import org.json.JSONObject
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context?, intent: Intent?) {
    Log.i("SmsReceiver", "onReceive action=${intent?.action}")

    try {
      // Handle regular SMS broadcast (when app is not running)
      if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
        val bundle = intent.extras ?: return
        val pdus = bundle.get("pdus") as? Array<*>
        val format = bundle.getString("format")
        if (pdus != null && pdus.isNotEmpty()) {
          val sb = StringBuilder()
          var originating: String? = null
          for (p in pdus) {
            val pdu = p as? ByteArray ?: continue
            val msg = if (format != null) SmsMessage.createFromPdu(pdu, format) else SmsMessage.createFromPdu(pdu)
            if (originating == null) originating = msg.originatingAddress
            sb.append(msg.messageBody)
          }
          val body = sb.toString()
          val ts = System.currentTimeMillis()
          Log.i("SmsReceiver", "SMS_RECEIVED parsed body=$body from=$originating")
          persistPending(context, body, originating, ts)
          // Emit structured object: body, originatingAddress, timestamp
          SmsEventEmitter.emit(body, originating, ts)
          return
        }
      }
    } catch (ex: Exception) {
      Log.w("SmsReceiver", "sms broadcast parse error", ex)
    }

    if (SmsRetriever.SMS_RETRIEVED_ACTION == intent?.action) {
      val extras = intent.extras ?: return
      val status = extras.get(SmsRetriever.EXTRA_STATUS) as Status

      if (status.statusCode == CommonStatusCodes.SUCCESS) {
        val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE)
        Log.i("SmsReceiver", "SmsRetriever SUCCESS, message=$message")
        // SmsRetriever delivers messages that include app hash. Persist and emit.
        val now = System.currentTimeMillis()
        persistPending(context, message, null, now)
        SmsEventEmitter.emit(message, null, now)
      } else {
        Log.i("SmsReceiver", "SmsRetriever status=${status.statusCode}")
      }
    } else {
      // Also log other actions for diagnosis
      Log.i("SmsReceiver", "ignored action=${intent?.action}")
    }
  }

  private fun persistPending(context: Context?, body: String?, originating: String?, ts: Long) {
    if (context == null || body == null) return
    try {
      val prefs = context.getSharedPreferences("sms_prefs", Context.MODE_PRIVATE)
      val raw = prefs.getString("pending_sms", "[]")
      val arr = JSONArray(raw)
      val obj = JSONObject()
      obj.put("body", body)
      if (originating != null) obj.put("originatingAddress", originating)
      obj.put("timestamp", ts)
      arr.put(obj)
      prefs.edit().putString("pending_sms", arr.toString()).apply()
      Log.i("SmsReceiver", "persisted pending sms, total=${arr.length()}")
    } catch (e: Exception) {
      Log.w("SmsReceiver", "persist pending sms failed", e)
    }
  }
}

package com.ilab.ilab_app

import android.content.ContentValues
import android.content.pm.PackageManager
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.ilab.ilab_app/file_saver"
    private val PERMISSION_REQUEST_CODE = 1001
    private var pendingResult: MethodChannel.Result? = null
    private var pendingFilename: String? = null
    private var pendingExtension: String? = null
    private var pendingBytes: ByteArray? = null
    private var pendingMimeType: String? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "saveFile" -> {
                    val filename = call.argument<String>("filename") ?: ""
                    val extension = call.argument<String>("extension") ?: ""
                    val bytes = call.argument<ByteArray>("bytes") ?: ByteArray(0)
                    val mimeType = call.argument<String>("mimeType") ?: "application/octet-stream"
                    saveFile(filename, extension, bytes, mimeType, result)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun saveFile(
        filename: String,
        extension: String,
        bytes: ByteArray,
        mimeType: String,
        result: MethodChannel.Result,
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveToMediaStore(filename, extension, bytes, mimeType, result)
        } else {
            val permission = android.Manifest.permission.WRITE_EXTERNAL_STORAGE
            if (ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED) {
                saveToPublicDirectory(filename, extension, bytes, result)
            } else {
                pendingResult = result
                pendingFilename = filename
                pendingExtension = extension
                pendingBytes = bytes
                pendingMimeType = mimeType
                requestPermissions(arrayOf(permission), PERMISSION_REQUEST_CODE)
            }
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                val filename = pendingFilename ?: return
                val extension = pendingExtension ?: return
                val bytes = pendingBytes ?: return
                val mimeType = pendingMimeType ?: "application/octet-stream"
                saveToPublicDirectory(filename, extension, bytes, pendingResult)
            } else {
                pendingResult?.error("PERMISSION_DENIED", "Storage permission denied", null)
            }
            pendingResult = null
            pendingFilename = null
            pendingExtension = null
            pendingBytes = null
            pendingMimeType = null
        }
    }

    private fun saveToMediaStore(
        filename: String,
        extension: String,
        bytes: ByteArray,
        mimeType: String,
        result: MethodChannel.Result,
    ) {
        try {
            val contentValues = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, "$filename.$extension")
                put(MediaStore.Downloads.MIME_TYPE, mimeType)
                put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
            val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                contentResolver.openOutputStream(uri)?.use { outputStream ->
                    outputStream.write(bytes)
                }
                result.success("Downloads/$filename.$extension")
            } else {
                result.error("SAVE_FAILED", "Failed to create MediaStore entry", null)
            }
        } catch (e: Exception) {
            result.error("SAVE_FAILED", e.message, e.toString())
        }
    }

    private fun saveToPublicDirectory(
        filename: String,
        extension: String,
        bytes: ByteArray,
        result: MethodChannel.Result?,
    ) {
        try {
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val file = File(downloadsDir, "$filename.$extension")
            file.writeBytes(bytes)
            result?.success(file.absolutePath)
        } catch (e: Exception) {
            result?.error("SAVE_FAILED", e.message, e.toString())
        }
    }
}

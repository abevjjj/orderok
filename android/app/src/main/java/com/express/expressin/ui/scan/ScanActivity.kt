package com.express.expressin.ui.scan

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.express.expressin.databinding.ActivityScanBinding
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ScanActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_RESULT = "scan_result"
        private const val TAG = "ScanActivity"
    }

    private lateinit var binding: ActivityScanBinding
    private lateinit var cameraExecutor: ExecutorService
    private var hasDelivered = false   // prevent multiple results

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScanBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cameraExecutor = Executors.newSingleThreadExecutor()

        binding.btnCancelScan.setOnClickListener { finish() }

        startCamera()
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()

                // Preview
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
                }

                // Image analysis for ML Kit
                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { analysis ->
                        analysis.setAnalyzer(cameraExecutor, BarcodeAnalyzer { rawValue ->
                            if (!hasDelivered) {
                                hasDelivered = true
                                runOnUiThread {
                                    val intent = Intent().putExtra(EXTRA_RESULT, rawValue)
                                    setResult(Activity.RESULT_OK, intent)
                                    finish()
                                }
                            }
                        })
                    }

                // Use back camera
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageAnalysis
                )

            } catch (e: Exception) {
                Log.e(TAG, "Camera bind failed", e)
                Toast.makeText(this, "相机启动失败：${e.message}", Toast.LENGTH_SHORT).show()
                finish()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}

// ── ML Kit Barcode Analyzer ───────────────────────────────────────────────────
@androidx.camera.core.ExperimentalGetImage
class BarcodeAnalyzer(private val onResult: (String) -> Unit) : ImageAnalysis.Analyzer {

    private val options = BarcodeScannerOptions.Builder()
        .setBarcodeFormats(
            Barcode.FORMAT_ALL_FORMATS   // support all 1D/2D formats
        )
        .build()
    private val scanner = BarcodeScanning.getClient(options)

    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) { imageProxy.close(); return }

        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                barcodes.firstOrNull()?.rawValue?.let { onResult(it) }
            }
            .addOnFailureListener { /* ignore */ }
            .addOnCompleteListener { imageProxy.close() }
    }
}

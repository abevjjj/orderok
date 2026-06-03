package com.express.expressin.ui.scan

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.express.expressin.databinding.FragmentRegisterBinding
import com.express.expressin.network.ApiClient
import com.google.android.material.datepicker.MaterialDatePicker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class RegisterFragment : Fragment() {

    private var _binding: FragmentRegisterBinding? = null
    private val binding get() = _binding!!
    private val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) launchScanner()
        else showCameraPermissionDenied()
    }

    private val scanLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val code = result.data?.getStringExtra(ScanActivity.EXTRA_RESULT) ?: return@registerForActivityResult
            binding.etTracking.setText(code)
            binding.tilTracking.error = null
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentRegisterBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val today = sdf.format(Date())
        binding.etShipDate.setText(today)
        binding.etArriveDate.setText(today)
        setupListeners()
    }

    private fun setupListeners() {
        binding.btnScan.setOnClickListener { requestCameraAndScan() }
        binding.etShipDate.setOnClickListener { showDatePicker("发货日期") { binding.etShipDate.setText(it) } }
        binding.etArriveDate.setOnClickListener { showDatePicker("到货日期") { binding.etArriveDate.setText(it) } }
        binding.btnSubmit.setOnClickListener { submitForm() }
        // 一键清除货品名称
        binding.btnClearGoods.setOnClickListener {
            binding.etGoodsDesc.setText("")
            binding.etGoodsDesc.requestFocus()
            binding.tilGoodsDesc.error = null
        }
    }

    private fun showDatePicker(title: String, onPicked: (String) -> Unit) {
        val picker = MaterialDatePicker.Builder.datePicker()
            .setTitleText(title)
            .setSelection(MaterialDatePicker.todayInUtcMilliseconds())
            .build()
        picker.addOnPositiveButtonClickListener { ms ->
            val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
            cal.timeInMillis = ms
            onPicked(sdf.format(cal.time))
        }
        picker.show(parentFragmentManager, "date_picker")
    }

    private fun requestCameraAndScan() {
        val ctx = requireContext()
        when {
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED -> launchScanner()

            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                AlertDialog.Builder(ctx)
                    .setTitle("需要相机权限")
                    .setMessage("扫描条形码/二维码需要使用相机，请授予相机权限")
                    .setPositiveButton("去授权") { _, _ ->
                        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    }
                    .setNegativeButton("取消", null)
                    .show()
            }
            else -> cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun showCameraPermissionDenied() {
        AlertDialog.Builder(requireContext())
            .setTitle("相机权限被拒绝")
            .setMessage("扫码功能需要相机权限。请前往系统设置手动开启，或手动输入快递单号。")
            .setPositiveButton("去设置") { _, _ ->
                startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", requireActivity().packageName, null)
                })
            }
            .setNegativeButton("手动输入", null)
            .show()
    }

    private fun launchScanner() {
        scanLauncher.launch(Intent(requireContext(), ScanActivity::class.java))
    }

    private fun submitForm() {
        val tracking   = binding.etTracking.text.toString().trim()
        val shipDate   = binding.etShipDate.text.toString().trim()
        val arriveDate = binding.etArriveDate.text.toString().trim()
        val goodsDesc  = binding.etGoodsDesc.text.toString().trim()

        var valid = true
        if (tracking.isEmpty())   { binding.tilTracking.error   = "请输入快递单号"; valid = false } else binding.tilTracking.error = null
        if (shipDate.isEmpty())   { binding.tilShipDate.error   = "请选择发货日期"; valid = false } else binding.tilShipDate.error = null
        if (arriveDate.isEmpty()) { binding.tilArriveDate.error = "请选择到货日期"; valid = false } else binding.tilArriveDate.error = null
        if (goodsDesc.isEmpty())  { binding.tilGoodsDesc.error  = "请填写货品说明"; valid = false } else binding.tilGoodsDesc.error = null
        if (!valid) return

        setFormEnabled(false)
        binding.progressSubmit.visibility = View.VISIBLE

        lifecycleScope.launch {
            val exists = withContext(Dispatchers.IO) { ApiClient.checkTracking(tracking) }
            if (exists) {
                setFormEnabled(true)
                binding.progressSubmit.visibility = View.GONE
                binding.tilTracking.error = "该快递单号已经存在"
                AlertDialog.Builder(requireContext())
                    .setTitle("⚠️ 单号已存在")
                    .setMessage("快递单号「$tracking」已经登记过，请确认是否重复。")
                    .setPositiveButton("确定", null)
                    .show()
                return@launch
            }
            val result = withContext(Dispatchers.IO) {
                ApiClient.createExpress(tracking, shipDate, arriveDate, goodsDesc)
            }
            binding.progressSubmit.visibility = View.GONE
            setFormEnabled(true)

            if (result.ok) {
                Toast.makeText(requireContext(), "✅ 登记成功！", Toast.LENGTH_SHORT).show()
                // 只清空快递单号，货品名称保留方便连续录入
                binding.etTracking.setText("")
                binding.tilTracking.error = null
                val today = sdf.format(Date())
                binding.etShipDate.setText(today)
                binding.etArriveDate.setText(today)
            } else {
                AlertDialog.Builder(requireContext())
                    .setTitle("保存失败")
                    .setMessage(result.error ?: "未知错误")
                    .setPositiveButton("确定", null)
                    .show()
            }
        }
    }

    private fun setFormEnabled(enabled: Boolean) {
        binding.btnSubmit.isEnabled  = enabled
        binding.btnScan.isEnabled    = enabled
        binding.etTracking.isEnabled = enabled
        binding.etShipDate.isEnabled = enabled
        binding.etArriveDate.isEnabled = enabled
        binding.etGoodsDesc.isEnabled  = enabled
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

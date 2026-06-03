package com.express.expressin.ui.scan

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.express.expressin.databinding.FragmentRecordsBinding
import com.express.expressin.network.ApiClient
import com.express.expressin.network.ExpressRecord
import com.express.expressin.ui.record.RecordAdapter
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RecordsFragment : Fragment() {

    private var _binding: FragmentRecordsBinding? = null
    private val binding get() = _binding!!
    private var currentStatus = "pending"

    private val adapter = RecordAdapter { record -> confirmDelete(record) }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentRecordsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerView.adapter = adapter

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                currentStatus = when (tab.position) { 0 -> "pending"; 1 -> "confirmed"; else -> "all" }
                loadRecords()
            }
            override fun onTabUnselected(tab: TabLayout.Tab) {}
            override fun onTabReselected(tab: TabLayout.Tab) {}
        })

        binding.swipeRefresh.setOnRefreshListener { loadRecords() }
        loadRecords()
    }

    fun loadRecords() {
        binding.swipeRefresh.isRefreshing = true
        binding.tvEmpty.visibility = View.GONE

        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) { ApiClient.listExpress(currentStatus) }
            if (_binding == null) return@launch
            binding.swipeRefresh.isRefreshing = false
            if (result.ok) {
                val list = result.data ?: emptyList()
                adapter.submitList(list)
                binding.tvEmpty.visibility = if (list.isEmpty()) View.VISIBLE else View.GONE
            } else {
                binding.tvEmpty.text = result.error ?: "加载失败"
                binding.tvEmpty.visibility = View.VISIBLE
            }
        }
    }

    private fun confirmDelete(record: ExpressRecord) {
        AlertDialog.Builder(requireContext())
            .setTitle("确认删除")
            .setMessage("删除单号：${record.tracking_no}？")
            .setPositiveButton("删除") { _, _ -> deleteRecord(record) }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun deleteRecord(record: ExpressRecord) {
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) { ApiClient.deleteExpress(record.id) }
            if (result.ok) loadRecords()
            else AlertDialog.Builder(requireContext())
                .setMessage(result.error ?: "删除失败")
                .setPositiveButton("确定", null).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

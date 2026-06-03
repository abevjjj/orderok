package com.express.expressin.ui.record

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.express.expressin.databinding.ActivityRecordListBinding
import com.express.expressin.network.ApiClient
import com.express.expressin.network.ExpressRecord
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RecordListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRecordListBinding
    private val adapter = RecordAdapter { record -> confirmDelete(record) }
    private var currentStatus = "pending"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRecordListBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "收快递记录"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
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

    private fun loadRecords() {
        binding.swipeRefresh.isRefreshing = true
        binding.tvEmpty.visibility = View.GONE
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) { ApiClient.listExpress(currentStatus) }
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
        AlertDialog.Builder(this)
            .setTitle("确认删除").setMessage("删除单号：${record.tracking_no}？")
            .setPositiveButton("删除") { _, _ -> deleteRecord(record) }
            .setNegativeButton("取消", null).show()
    }

    private fun deleteRecord(record: ExpressRecord) {
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) { ApiClient.deleteExpress(record.id) }
            if (result.ok) loadRecords()
            else AlertDialog.Builder(this@RecordListActivity)
                .setMessage(result.error ?: "删除失败").setPositiveButton("确定", null).show()
        }
    }

    override fun onSupportNavigateUp(): Boolean { onBackPressedDispatcher.onBackPressed(); return true }
}

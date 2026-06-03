package com.express.expressin.ui.record

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.express.expressin.databinding.ItemExpressRecordBinding
import com.express.expressin.network.ExpressRecord

class RecordAdapter(
    private val onDelete: (ExpressRecord) -> Unit
) : RecyclerView.Adapter<RecordAdapter.VH>() {

    private var list: List<ExpressRecord> = emptyList()

    fun submitList(newList: List<ExpressRecord>) {
        list = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemExpressRecordBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(b)
    }
    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(list[position])
    override fun getItemCount() = list.size

    inner class VH(private val b: ItemExpressRecordBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(r: ExpressRecord) {
            b.tvTrackingNo.text = r.tracking_no
            b.tvArriveDate.text = "到货：${r.arrive_date}"
            b.tvGoods.text      = r.goods_desc
            b.tvCreator.text    = "登记人：${r.creator_name}"
            b.tvCreatedAt.text  = r.created_at.take(10)
            b.btnDelete.setOnClickListener { onDelete(r) }
        }
    }
}

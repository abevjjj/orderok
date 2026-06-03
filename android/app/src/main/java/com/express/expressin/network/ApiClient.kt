package com.express.expressin.network

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

data class ExpressRecord(
    val id: Int = 0,
    val tracking_no: String = "",
    val ship_date: String = "",
    val arrive_date: String = "",
    val goods_desc: String = "",
    val creator_name: String = "",
    val created_at: String = ""
)

data class ApiResult<T>(
    val ok: Boolean = false,
    val error: String? = null,
    val data: T? = null
)

object ApiClient {
    private val gson = Gson()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    // Shared cookie jar to persist session across requests
    private val cookieJar = object : CookieJar {
        private val store = mutableListOf<Cookie>()
        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
            store.removeAll { c -> cookies.any { it.name == c.name } }
            store.addAll(cookies)
        }
        override fun loadForRequest(url: HttpUrl): List<Cookie> = store.toList()
    }

    private var client = buildClient()

    private fun buildClient() = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private var baseUrl = ""

    fun setBaseUrl(url: String) {
        baseUrl = url.trimEnd('/')
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    fun login(username: String, password: String): ApiResult<Map<String, Any>> {
        val body = gson.toJson(mapOf("username" to username, "password" to password))
            .toRequestBody(JSON)
        val req = Request.Builder().url("$baseUrl/api/login").post(body).build()
        return try {
            val resp = client.newCall(req).execute()
            val json = resp.body?.string() ?: "{}"
            val map = gson.fromJson<Map<String, Any>>(json, object : TypeToken<Map<String, Any>>() {}.type)
            if (resp.isSuccessful && map["ok"] == true) {
                ApiResult(ok = true, data = map)
            } else {
                ApiResult(ok = false, error = map["error"] as? String ?: "登录失败")
            }
        } catch (e: IOException) {
            ApiResult(ok = false, error = "网络错误：${e.message}")
        }
    }

    // ── Express check ─────────────────────────────────────────────────────
    fun checkTracking(trackingNo: String): Boolean {
        val encoded = java.net.URLEncoder.encode(trackingNo, "UTF-8")
        val req = Request.Builder().url("$baseUrl/api/express/check/$encoded").get().build()
        return try {
            val resp = client.newCall(req).execute()
            val json = resp.body?.string() ?: "{}"
            val map = gson.fromJson<Map<String, Any>>(json, object : TypeToken<Map<String, Any>>() {}.type)
            map["exists"] == true
        } catch (e: IOException) {
            false
        }
    }

    // ── Express create ────────────────────────────────────────────────────
    fun createExpress(
        trackingNo: String,
        shipDate: String,
        arriveDate: String,
        goodsDesc: String
    ): ApiResult<Map<String, Any>> {
        val body = gson.toJson(
            mapOf(
                "tracking_no" to trackingNo,
                "ship_date"   to shipDate,
                "arrive_date" to arriveDate,
                "goods_desc"  to goodsDesc
            )
        ).toRequestBody(JSON)
        val req = Request.Builder().url("$baseUrl/api/express").post(body).build()
        return try {
            val resp = client.newCall(req).execute()
            val json = resp.body?.string() ?: "{}"
            val map = gson.fromJson<Map<String, Any>>(json, object : TypeToken<Map<String, Any>>() {}.type)
            if (resp.isSuccessful && map["ok"] == true) {
                ApiResult(ok = true, data = map)
            } else {
                ApiResult(ok = false, error = map["error"] as? String ?: "保存失败")
            }
        } catch (e: IOException) {
            ApiResult(ok = false, error = "网络错误：${e.message}")
        }
    }

    // ── Express list ──────────────────────────────────────────────────────
    fun listExpress(confirmStatus: String = "pending"): ApiResult<List<ExpressRecord>> {
        val req = Request.Builder()
            .url("$baseUrl/api/express?confirm_status=$confirmStatus")
            .get().build()
        return try {
            val resp = client.newCall(req).execute()
            val json = resp.body?.string() ?: "[]"
            if (resp.isSuccessful) {
                val list = gson.fromJson<List<ExpressRecord>>(
                    json, object : TypeToken<List<ExpressRecord>>() {}.type
                )
                ApiResult(ok = true, data = list)
            } else {
                ApiResult(ok = false, error = "加载失败 ${resp.code}")
            }
        } catch (e: IOException) {
            ApiResult(ok = false, error = "网络错误：${e.message}")
        }
    }

    // ── Express delete ────────────────────────────────────────────────────
    fun deleteExpress(id: Int): ApiResult<Unit> {
        val req = Request.Builder().url("$baseUrl/api/express/$id").delete().build()
        return try {
            val resp = client.newCall(req).execute()
            val json = resp.body?.string() ?: "{}"
            val map = gson.fromJson<Map<String, Any>>(json, object : TypeToken<Map<String, Any>>() {}.type)
            if (resp.isSuccessful && map["ok"] == true) ApiResult(ok = true)
            else ApiResult(ok = false, error = map["error"] as? String ?: "删除失败")
        } catch (e: IOException) {
            ApiResult(ok = false, error = "网络错误：${e.message}")
        }
    }
}

package com.express.expressin.util

import android.content.Context
import android.content.SharedPreferences

object Prefs {
    private const val NAME = "express_prefs"
    private const val KEY_SERVER  = "server_url"
    private const val KEY_USER    = "username"
    private const val KEY_PASS    = "password"
    private const val KEY_DNAME   = "display_name"
    private const val KEY_LOGGED  = "is_logged_in"

    private fun sp(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(NAME, Context.MODE_PRIVATE)

    fun saveServer(ctx: Context, url: String, user: String, pass: String) {
        sp(ctx).edit()
            .putString(KEY_SERVER, url)
            .putString(KEY_USER,   user)
            .putString(KEY_PASS,   pass)
            .apply()
    }

    fun getServerUrl(ctx: Context)  = sp(ctx).getString(KEY_SERVER, "") ?: ""
    fun getUsername(ctx: Context)   = sp(ctx).getString(KEY_USER,   "") ?: ""
    fun getPassword(ctx: Context)   = sp(ctx).getString(KEY_PASS,   "") ?: ""

    fun setLoggedIn(ctx: Context, displayName: String) {
        sp(ctx).edit()
            .putBoolean(KEY_LOGGED, true)
            .putString(KEY_DNAME, displayName)
            .apply()
    }

    fun isLoggedIn(ctx: Context) = sp(ctx).getBoolean(KEY_LOGGED, false)
    fun getDisplayName(ctx: Context) = sp(ctx).getString(KEY_DNAME, "") ?: ""

    fun logout(ctx: Context) {
        sp(ctx).edit().putBoolean(KEY_LOGGED, false).apply()
    }
}

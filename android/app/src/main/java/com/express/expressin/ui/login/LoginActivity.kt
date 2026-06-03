package com.express.expressin.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.express.expressin.databinding.ActivityLoginBinding
import com.express.expressin.network.ApiClient
import com.express.expressin.ui.scan.MainActivity
import com.express.expressin.util.Prefs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Pre-fill saved credentials
        binding.etServer.setText(Prefs.getServerUrl(this))
        binding.etUsername.setText(Prefs.getUsername(this))
        binding.etPassword.setText(Prefs.getPassword(this))

        // If already logged in go straight to main
        if (Prefs.isLoggedIn(this) && Prefs.getServerUrl(this).isNotEmpty()) {
            ApiClient.setBaseUrl(Prefs.getServerUrl(this))
            goMain()
            return
        }

        binding.btnLogin.setOnClickListener { doLogin() }
    }

    private fun doLogin() {
        val server   = binding.etServer.text.toString().trim()
        val username = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString()

        if (server.isEmpty())   { binding.etServer.error   = "请输入服务器地址"; return }
        if (username.isEmpty()) { binding.etUsername.error = "请输入用户名";     return }
        if (password.isEmpty()) { binding.etPassword.error = "请输入密码";       return }

        binding.btnLogin.isEnabled = false
        binding.progressBar.visibility = View.VISIBLE
        binding.tvError.visibility = View.GONE

        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                ApiClient.setBaseUrl(server)
                ApiClient.login(username, password)
            }
            binding.progressBar.visibility = View.GONE
            binding.btnLogin.isEnabled = true

            if (result.ok) {
                Prefs.saveServer(this@LoginActivity, server, username, password)
                val displayName = result.data?.get("display_name") as? String ?: username
                Prefs.setLoggedIn(this@LoginActivity, displayName)
                goMain()
            } else {
                binding.tvError.text = result.error ?: "登录失败"
                binding.tvError.visibility = View.VISIBLE
            }
        }
    }

    private fun goMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}

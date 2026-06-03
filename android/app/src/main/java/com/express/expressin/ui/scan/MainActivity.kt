package com.express.expressin.ui.scan

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import com.express.expressin.R
import com.express.expressin.databinding.ActivityMainBinding
import com.express.expressin.ui.login.LoginActivity
import com.express.expressin.util.Prefs

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val registerFragment = RegisterFragment()
    private val recordsFragment  = RecordsFragment()

    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Status bar inset → push AppBar down
        ViewCompat.setOnApplyWindowInsetsListener(binding.appBarLayout) { view, insets ->
            val statusBar = insets.getInsets(WindowInsetsCompat.Type.statusBars())
            view.updatePadding(top = statusBar.top)
            insets
        }
        // Nav bar inset → push BottomNav up
        ViewCompat.setOnApplyWindowInsetsListener(binding.bottomNav) { view, insets ->
            val navBar = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
            view.updatePadding(bottom = navBar.bottom)
            insets
        }

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title    = "收快递登记"
        supportActionBar?.subtitle = "登录人：${Prefs.getDisplayName(this)}"

        // Add both fragments; show register, hide records
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .add(R.id.fragmentContainer, registerFragment, "register")
                .add(R.id.fragmentContainer, recordsFragment,  "records")
                .hide(recordsFragment)
                .commit()
        }

        binding.bottomNav.setOnItemSelectedListener { item: MenuItem ->
            when (item.itemId) {
                R.id.nav_register -> {
                    supportActionBar?.title = "收快递登记"
                    supportFragmentManager.beginTransaction()
                        .show(registerFragment)
                        .hide(recordsFragment)
                        .commit()
                    true
                }
                R.id.nav_records -> {
                    supportActionBar?.title = "收快递记录"
                    supportFragmentManager.beginTransaction()
                        .hide(registerFragment)
                        .show(recordsFragment)
                        .commitNow()          // commitNow: View is ready before we call loadRecords
                    recordsFragment.loadRecords()
                    true
                }
                else -> false
            }
        }
    }

    override fun onCreateOptionsMenu(menu: android.view.Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.menu_logout -> {
                Prefs.logout(this)
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}


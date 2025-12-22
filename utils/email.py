# utils/email.py
from flask_mail import Message
from extensions import mail

def kirim_email_verifikasi(email_user, kode_kehilangan):
    try:
        print("🔥 MENGIRIM EMAIL KE:", email_user)

        msg = Message(
            subject="Laporan Kehilangan Anda Telah Diverifikasi",
            recipients=[email_user]
        )

        msg.body = f"""
Halo,

Laporan kehilangan Anda dengan kode:

📌 {kode_kehilangan}

Telah berhasil diverifikasi oleh admin Lost & Found Bandara Internasional Juanda.

Silakan cek status laporan Anda secara berkala melalui website kami.

Terima kasih,
Lost & Found Bandara Internasional Juanda
"""

        mail.send(msg)
        print("✅ EMAIL BERHASIL TERKIRIM")

    except Exception as e:
        print("❌ GAGAL KIRIM EMAIL:", e)

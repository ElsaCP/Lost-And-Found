# routes/route.py
from flask import Blueprint, request, jsonify, render_template,redirect, url_for, session
from datetime import datetime
from werkzeug.utils import secure_filename
from models import fetch_public_penemuan, get_penemuan_by_kode, fetch_barang_publik_terbaru
from models import get_laporan_by_email, get_riwayat_klaim_by_email,tambah_riwayat_status, get_riwayat_status
from config import get_db_connection
from models import (fetch_public_penemuan, get_penemuan_by_kode,
                    get_laporan_by_email, get_riwayat_klaim_by_email,
                    tambah_riwayat_status, get_riwayat_status)
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import KeepTogether
from flask import send_file, request
from datetime import datetime, timedelta
from config import Config
from extensions import db, mail
from flask_mail import Message
from config import Config
from sqlalchemy import text
from utils.email import kirim_email_verifikasi
import os
import mysql.connector
import hmac
import hashlib


main = Blueprint('main', __name__)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="", 
        database="lostfound"
    )
SIGN_SECRET = Config.SIGN_SECRET

@main.route('/')
def home():
    return render_template('user/indexx.html')

def sign_payload(payload: str):
    return hmac.new(
        SIGN_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

@main.route("/api/statistik-bulanan")
def statistik_bulanan():
    query = text("""
        SELECT
            CONCAT(
                ELT(MONTH(tanggal),
                    'Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'
                ),
                ' ',
                YEAR(tanggal)
            ) AS bulan,
            YEAR(tanggal) AS tahun,
            MONTH(tanggal) AS urut_bulan,
            SUM(jenis = 'kehilangan') AS kehilangan,
            SUM(jenis = 'penemuan') AS penemuan,
            SUM(jenis = 'klaim') AS klaim
        FROM (
            SELECT tanggal_kehilangan AS tanggal, 'kehilangan' AS jenis FROM kehilangan
            UNION ALL
            SELECT tanggal_lapor AS tanggal, 'penemuan' AS jenis FROM penemuan
            UNION ALL
            SELECT tanggal_lapor AS tanggal, 'klaim' AS jenis FROM klaim_barang
            UNION ALL
            SELECT tanggal AS tanggal, jenis AS jenis FROM arsip
        ) AS semua_data
        GROUP BY tahun, urut_bulan
        ORDER BY tahun, urut_bulan
    """)

    rows = db.session.execute(query).mappings().all()
    return jsonify([dict(r) for r in rows])


def verify_payload(payload: str, signature: str):
    return hmac.compare_digest(sign_payload(payload), signature)

# Mapping bulan ke bahasa Indonesia
BULAN_ID = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
    5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
    9: "September", 10: "Oktober", 11: "November", 12: "Desember"
}

@main.route("/download/surat-pengambilan/<kode_laporan>")
def download_surat_pengambilan(kode_laporan):
    tipe = request.args.get("tipe")  # sendiri / wakil

    if tipe not in ["sendiri", "wakil"]:
        return "Tipe pengambilan tidak valid", 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT kode_laporan, kode_barang, nama_barang,
               tanggal_lapor, tgl_pilih_pengambilan
        FROM klaim_barang
        WHERE kode_laporan = %s
    """, (kode_laporan,))
    data = cursor.fetchone()

    if not data:
        cursor.close()
        db.close()
        return "Data tidak ditemukan", 404

    # =========================
    # TANGGAL KLAIM (DB)
    # =========================
    tanggal_db = data["tanggal_lapor"]
    tanggal_klaim = (
        datetime.strptime(tanggal_db, "%Y-%m-%d")
        if isinstance(tanggal_db, str)
        else datetime.combine(tanggal_db, datetime.min.time())
    )

    # =========================
    # KUNCI TANGGAL PERTAMA
    # =========================
    if data["tgl_pilih_pengambilan"] is None:
        # ⬅️ PERTAMA KALI USER KLIK
        tgl_pilih = datetime.today().date()

        cursor.execute("""
            UPDATE klaim_barang
            SET tgl_pilih_pengambilan = %s
            WHERE kode_laporan = %s
        """, (tgl_pilih, kode_laporan))
        db.commit()
    else:
        # ⬅️ KLIK ULANG → AMBIL DARI DB
        tgl_pilih = data["tgl_pilih_pengambilan"]

    cursor.close()
    db.close()

    # =========================
    # HITUNG TANGGAL MAKS
    # =========================
    tanggal_maks = datetime.combine(tgl_pilih, datetime.min.time()) + timedelta(days=7)

    # =========================
    # FORMAT TANGGAL
    # =========================
    tgl_klaim_str = f"{tanggal_klaim.day} {BULAN_ID[tanggal_klaim.month]} {tanggal_klaim.year}"
    tgl_maks_str = f"{tanggal_maks.day} {BULAN_ID[tanggal_maks.month]} {tanggal_maks.year}"

    # =========================
    # BUAT PDF
    # =========================
    filename = f"surat_{tipe}_{kode_laporan}.pdf"
    path = os.path.join("static", "temp", filename)
    os.makedirs("static/temp", exist_ok=True)

    buat_pdf_surat(path, data, tgl_klaim_str, tgl_maks_str, tipe)

    response = send_file(path, as_attachment=True)

    @response.call_on_close
    def cleanup():
        if os.path.exists(path):
            os.remove(path)

    return response

def buat_pdf_surat(path, data, tgl_klaim, tgl_maks, tipe):
    if tipe == "sendiri":
        pdf_pengambilan_sendiri(path, data, tgl_klaim, tgl_maks, tipe)
    else:
        pdf_pengambilan_wakil(path, data, tgl_klaim, tgl_maks)

def pdf_pengambilan_sendiri(path, data, tgl_klaim, tgl_maks, tipe):
    styles = getSampleStyleSheet()

    # ================= STYLES =================
    styles.add(ParagraphStyle(
        name="Judul",
        fontSize=10,
        alignment=TA_CENTER,
        leading=14,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name="Isi",
        fontSize=10,
        leading=14,          # ⬅️ antar baris lebih lega
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name="Kanan",
        fontSize=10,
        alignment=TA_RIGHT,
        leading=14
    ))

    styles.add(ParagraphStyle(
        name="NB",
        fontSize=9,
        leading=13,
        spaceBefore=6
    ))

    styles.add(ParagraphStyle(
        name="Materai",
        fontSize=8,
        leading=11,
        alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        name="TTD_Center",
        fontSize=10,
        alignment=TA_CENTER,
        leading=14
    ))

    # ================= DOCUMENT =================
    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    el = []

    # ================= HEADER =================
    el.append(Paragraph(
        "<b>PT ANGKASA PURA BANDARA INTERNASIONAL JUANDA</b>",
        styles["Judul"]
    ))
    el.append(Paragraph(
        "<b><u>SURAT PENGAMBILAN BARANG</u></b>",
        styles["Judul"]
    ))
    el.append(Spacer(1, 10))

    # ================= IDENTITAS =================
    el.append(Paragraph("Yang bertanda tangan di bawah ini:", styles["Isi"]))
    el.append(Spacer(1, 6))

    tabel_identitas = Table([
        ["Nama Lengkap", ":", "......................................................................................."],
        ["Tempat / Tanggal Lahir", ":", "......................................................................................."],
        ["NIK", ":", "......................................................................................."],
        ["No. Telepon", ":", "......................................................................................."],
        ["Alamat", ":", "......................................................................................."],
    ], colWidths=[6*cm, 0.5*cm, 8*cm])

    tabel_identitas.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))

    el.append(tabel_identitas)
    el.append(Spacer(1, 10))

    # ================= DATA BARANG =================
    el.append(Paragraph(
        "Dengan ini menyatakan bahwa saya adalah <b>pemilik sah barang temuan</b> dengan data sebagai berikut:",
        styles["Isi"]
    ))
    el.append(Spacer(1, 6))

    tabel_barang = Table([
        ["Nama Barang", ":", data["nama_barang"]],
        ["Kode Barang", ":", data["kode_barang"]],
        ["Kode Laporan", ":", data["kode_laporan"]],
        ["Tanggal Klaim", ":", tgl_klaim],
        ["Tanggal Maksimal Pengambilan", ":", tgl_maks],
    ], colWidths=[6*cm, 0.5*cm, 8*cm])

    tabel_barang.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))

    el.append(tabel_barang)
    el.append(Spacer(1, 10))

    # ================= PERNYATAAN =================
    el.append(Paragraph(
        "Saya bersedia mengambil barang tersebut <b>secara langsung</b> di unit "
        "<b>Lost & Found Bandara Internasional Juanda</b> serta menyatakan bahwa data "
        "yang saya berikan adalah <b>benar dan dapat dipertanggungjawabkan.</b>",
        styles["Isi"]
    ))

    el.append(Paragraph(
        "Apabila di kemudian hari terdapat permasalahan terkait kepemilikan barang, "
        "maka hal tersebut menjadi tanggung jawab saya sepenuhnya.",
        styles["Isi"]
    ))

    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "Demikian surat pernyataan ini dibuat dengan sebenar-benarnya untuk digunakan sebagaimana mestinya.",
        styles["Isi"]
    ))

    el.append(Spacer(1, 14))

    # ================= TANGGAL (KANAN) =================
    el.append(Paragraph(
        "Surabaya, ..............................................",
        styles["Kanan"]
    ))

    el.append(Spacer(1, 18))

    # ================= TTD KANAN + RUANG MATERAI =================
    ttd_table = Table([
        ["", Paragraph("Pemilik Barang", styles["TTD_Center"])],
        ["", Spacer(1, 40)],                       # ⬅️ ruang tanda tangan
        ["", Paragraph("Materai Rp10.000", styles["Materai"])],
        ["", Spacer(1, 45)],                       # ⬅️ ruang tempel materai
        ["", Paragraph("(___________________________)", styles["TTD_Center"])],
    ], colWidths=[8*cm, 8*cm])                     # ⬅️ kolom kanan tetap

    ttd_table.setStyle(TableStyle([
        ("ALIGN", (0,0), (0,0), "LEFT"),       # Materai di kiri
        ("ALIGN", (0,1), (0,1), "LEFT"),       # tanda "(" juga di kiri
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))

    el.append(ttd_table)
    el.append(Spacer(1, 10))

    # ================= NB =================
    el.append(Paragraph(
        "<b><i>NB:</i></b><br/>"
        "<i>• Wajib membawa fotokopi KTP pemilik barang.<br/>"
        "• Pengambilan maksimal 7 (tujuh) hari sejak tanggal pemilihan cara pengambilan.</i>",
        styles["NB"]
    ))

    # ================= BUILD =================
    doc.build(el)


def pdf_pengambilan_wakil(path, data, tgl_klaim, tgl_maks):
    styles = getSampleStyleSheet()

    # ================= STYLES (LEGA TAPI AMAN) =================
    styles.add(ParagraphStyle(
        name="Judul",
        fontSize=10,
        alignment=TA_CENTER,
        leading=13,      # ⬅️ agak lega
        spaceAfter=3
    ))

    styles.add(ParagraphStyle(
        name="Isi",
        fontSize=10,
        leading=13       # ⬅️ INI KUNCI: tidak mepet
    ))

    styles.add(ParagraphStyle(
        name="Kanan",
        fontSize=10,
        alignment=TA_RIGHT,
        leading=13
    ))

    styles.add(ParagraphStyle(
        name="Materai",
        fontSize=8,
        leading=10
    ))

    styles.add(ParagraphStyle(
        name="NB",
        fontSize=9,
        leading=12       # ⬅️ NB tetap nyaman dibaca
    ))

    # ================= DOCUMENT =================
    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    el = []

    # ================= HEADER =================
    el.append(Paragraph(
        "<b>PT ANGKASA PURA BANDARA INTERNASIONAL JUANDA</b>",
        styles["Judul"]
    ))
    el.append(Paragraph(
        "<b><u>SURAT KUASA PENGAMBILAN BARANG</u></b>",
        styles["Judul"]
    ))
    el.append(Spacer(1, 5))

    # ================= DATA PEMBERI KUASA =================
    el.append(Paragraph("Yang bertanda tangan di bawah ini:", styles["Isi"]))
    el.append(Spacer(1, 3))

    tabel_pemberi = Table([
        ["Nama Lengkap", ":", "................................................................."],
        ["Tempat / Tanggal Lahir", ":", "................................................................."],
        ["NIK", ":", "................................................................."],
        ["No. Telepon", ":", "................................................................."],
        ["Alamat", ":", "................................................................."],
    ], colWidths=[6*cm, 0.5*cm, 8*cm])

    tabel_pemberi.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))

    el.append(tabel_pemberi)
    el.append(Spacer(1, 5))

    # ================= DATA PENERIMA KUASA =================
    el.append(Paragraph("Dengan ini memberikan kuasa kepada:", styles["Isi"]))
    el.append(Spacer(1, 3))

    tabel_penerima = Table([
        ["Nama Lengkap", ":", "................................................................."],
        ["Tempat / Tanggal Lahir", ":", "................................................................."],
        ["NIK", ":", "................................................................."],
        ["No. Telepon", ":", "................................................................."],
        ["Alamat", ":", "................................................................."],
    ], colWidths=[6*cm, 0.5*cm, 8*cm])

    tabel_penerima.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))

    el.append(tabel_penerima)
    el.append(Spacer(1, 5))

    # ================= DATA BARANG =================
    el.append(Paragraph(
        "Dengan data barang Lost & Found Bandara Internasional Juanda sebagai berikut:",
        styles["Isi"]
    ))
    el.append(Spacer(1, 3))

    tabel_barang = Table([
        ["Nama Barang", ":", data["nama_barang"]],
        ["Kode Barang", ":", data["kode_barang"]],
        ["Kode Laporan", ":", data["kode_laporan"]],
        ["Tanggal Klaim", ":", tgl_klaim],
        ["Tanggal Maksimal Pengambilan", ":", tgl_maks],
    ], colWidths=[6*cm, 0.5*cm, 8*cm])

    tabel_barang.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))

    el.append(tabel_barang)
    el.append(Spacer(1, 5))

    # ================= PERNYATAAN =================
    el.append(Paragraph(
        "Dengan ini saya memberikan kuasa penuh kepada penerima kuasa untuk "
        "mengambil barang tersebut atas nama saya. Apabila barang tidak diambil "
        "sampai dengan tanggal maksimal pengambilan sebagaimana tercantum di atas, "
        "maka barang akan diproses sesuai dengan ketentuan yang berlaku.",
        styles["Isi"]
    ))
    el.append(Spacer(1, 5))

    # ================= TANGGAL =================
    el.append(Paragraph(
        "Surabaya, ...................................................",
        styles["Kanan"]
    ))
    el.append(Spacer(1, 5))

    # ================= TTD + NB (PASTI 1 HALAMAN) =================
    tabel_ttd = Table([
        ["Pemberi Kuasa", "", "Penerima Kuasa"],
        ["", "", ""],
        ["", "", ""],
        [Paragraph("Materai Rp10.000", styles["Materai"]), "", ""],
        ["", "", ""],
        ["", "", ""],
        ["(_________________________)", "", "(_________________________)"],
        ["", "", ""],
    ], colWidths=[6*cm, 2*cm, 6*cm])

    tabel_ttd.setStyle(TableStyle([
        ("ALIGN", (0,0), (-1,1), "CENTER"),
        ("ALIGN", (0,2), (0,2), "LEFT"),
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))

    bagian_akhir = KeepTogether([
        tabel_ttd,
        Spacer(1, 3),
        Table([[
            Paragraph(
                "<b><i>NB:</i></b><br/>"
                "<i>• Membawa fotokopi KTP pemberi dan penerima kuasa.<br/>"
                "• Surat ini berlaku maksimal 7 (tujuh) hari sejak tanggal diterbitkan.</i>",
                styles["NB"]
            )
        ]], colWidths=[16.5*cm], style=TableStyle([
            ("LEFTPADDING", (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (-1,-1), 0),
            ("TOPPADDING", (0,0), (-1,-1), 2),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
    ])

    el.append(bagian_akhir)

    # ================= BUILD =================
    doc.build(el)
    
@main.route('/login')
def login():
    return render_template('admin/index.html')

@main.route('/cari-Barang')
def cari_barang():
    return render_template('user/cari_barang.html')


@main.route('/api/penemuan')
def api_penemuan():
    q = request.args.get('q')
    kategori = request.args.get('kategori')
    dari = request.args.get('dari')
    hingga = request.args.get('hingga')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)

    items, total = fetch_public_penemuan(q, kategori, dari, hingga, page, per_page)
    return jsonify({
        "success": True,
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page
    })

@main.route("/api/barang-terbaru")
def barang_terbaru():
    from models import fetch_barang_publik_terbaru
    try:
        data = fetch_barang_publik_terbaru(limit=4)
        return jsonify(data)
    except Exception as e:
        print("Error mengambil data barang terbaru:", e)
        return jsonify([])

# Halaman form kehilangan
@main.route('/form-kehilangan')
def form_kehilangan():
    return render_template('user/form_kehilangan.html')

@main.route("/submit-kehilangan", methods=["POST"])
def submit_kehilangan():
    try:
        # === Ambil data dari form ===
        nama_pelapor = request.form.get("nama_pelapor")
        email = request.form.get("email")
        no_telp = request.form.get("no_telp")
        asal_negara = request.form.get("asal_negara")
        kota = request.form.get("kota")
        nama_barang = request.form.get("nama_barang")
        kategori = request.form.get("kategori")
        jenis_laporan = request.form.get("jenis_laporan") or "Kehilangan"
        deskripsi = request.form.get("deskripsi")
        tanggal_kehilangan = request.form.get("tanggal_kehilangan")
        terminal = request.form.get("terminal")
        tempat = request.form.get("tempat")
        lokasi_lain = request.form.get("lokasi_lain")

        if tempat == "Lainnya" and lokasi_lain:
            lokasi = f"{terminal} - {lokasi_lain}"
        else:
            lokasi = f"{terminal} - {tempat}"

        # === Simpan foto ===
        foto = request.files.get("foto")
        foto_filename = None
        if foto and foto.filename:
            foto_filename = datetime.now().strftime("%Y%m%d%H%M%S_") + foto.filename
            upload_path = os.path.join("static", "uploads", foto_filename)
            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            foto.save(upload_path)

        # === Format tanggal & waktu ===
        now = datetime.now()
        tanggal_submit = now.date()
        waktu_submit = now.strftime("%H:%M")
        update_terakhir = now

        # === Koneksi database ===
        db = get_db_connection()
        cursor = db.cursor()

        # === Generate kode kehilangan ===
        cursor.execute("SELECT kode_kehilangan FROM kehilangan ORDER BY id DESC LIMIT 1")
        last_record = cursor.fetchone()

        if last_record:
            last_number = int(last_record[0].split("LF-L")[-1]) + 1
        else:
            last_number = 1

        kode_kehilangan = f"LF-L{last_number:03d}"

        # === Simpan ke database ===
        cursor.execute("""
            INSERT INTO kehilangan (
                kode_kehilangan, nama_pelapor, email, no_telp, asal_negara, kota,
                nama_barang, kategori, jenis_laporan, deskripsi, lokasi,
                tanggal_kehilangan, tanggal_submit, waktu_submit, update_terakhir,
                catatan, status, foto
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            kode_kehilangan, nama_pelapor, email, no_telp, asal_negara, kota,
            nama_barang, kategori, jenis_laporan, deskripsi, lokasi,
            tanggal_kehilangan, tanggal_submit, waktu_submit, update_terakhir,
            "Menunggu verifikasi oleh admin", "Pending", foto_filename
        ))
        db.commit()

        # === Simpan riwayat status ===
        cursor.execute("""
            INSERT INTO riwayat_status (kode_kehilangan, status, catatan, waktu_update)
            VALUES (%s, %s, %s, NOW())
        """, (
            kode_kehilangan,
            "Pending",
            "Menunggu verifikasi oleh admin"
        ))
        db.commit()

        cursor.close()
        db.close()

        # =========================
        # 📧 KIRIM EMAIL
        # =========================
        try:
            # Email ke USER
            msg_user = Message(
                subject="Konfirmasi Laporan Kehilangan - Lost & Found Juanda",
                recipients=[email]
            )
            msg_user.body = f"""
Halo {nama_pelapor},

Laporan kehilangan Anda berhasil kami terima. Mohon tunggu untuk verifikasi oleh admin.

Kode Kehilangan : {kode_kehilangan}
Nama Barang  : {nama_barang}
Lokasi       : {lokasi}
Waktu Submit : {tanggal_submit} {waktu_submit}

Silakan simpan kode kehilangan ini untuk mengecek status laporan Anda.

Terima kasih,
Lost & Found Bandara Internasional Juanda
"""
            mail.send(msg_user)

            # Email ke ADMIN
            msg_admin = Message(
                subject=f"[LAPORAN BARU] {kode_kehilangan} - {nama_barang}",
                recipients=[Config.ADMIN_EMAIL]
            )
            msg_admin.body = f"""
📢 LAPORAN KEHILANGAN BARU

Kode Kehilangan : {kode_kehilangan}
Nama Pelapor: {nama_pelapor}
Email       : {email}
No Telp     : {no_telp}
Barang      : {nama_barang}
Kategori    : {kategori}
Lokasi      : {lokasi}
Tanggal     : {tanggal_submit} {waktu_submit}

Silakan login admin untuk melakukan verifikasi.
"""
            mail.send(msg_admin)

        except Exception as e:
            print("❌ Gagal kirim email:", e)

        # === Response sukses ===
        return jsonify({
            "success": True,
            "kode_kehilangan": kode_kehilangan,
            "lokasi": lokasi,
            "tanggal_submit": str(tanggal_submit),
            "waktu_submit": waktu_submit
        })

    except Exception as e:
        print("❌ ERROR SUBMIT KEHILANGAN:", e)
        return jsonify({"success": False, "message": str(e)})

@main.route('/riwayat-klaim')
def riwayat_klaim():
    return render_template('user/riwayat_klaim.html')

@main.route("/cek-riwayat", methods=["GET"])
def cek_riwayat():
    return render_template("user/cek_riwayat.html")


@main.route("/api/cek-riwayat-klaim", methods=["POST"])
def api_cek_riwayat_klaim():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"status": "error", "message": "Email kosong"}), 400

    from models import get_riwayat_klaim_by_email
    riwayat = get_riwayat_klaim_by_email(email)

    if not riwayat:
        return jsonify({"status": "not_found"}), 200

    return jsonify({
        "status": "success",
        "data": riwayat
    }), 200

@main.route("/hasil-riwayat-klaim")
def hasil_riwayat_klaim():
    return render_template("user/hasil_riwayat_klaim.html")


@main.route("/api/riwayat-klaim/<email>")
def api_riwayat_klaim(email):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    query = """
        SELECT
            k.kode_laporan,
            k.kode_barang,
            k.nama_barang,
            k.status AS status_klaim,
            k.catatan_admin,
            p.gambar_barang,
            p.lokasi,
            DATE_FORMAT(k.update_terakhir, '%d-%m-%Y %H:%i') AS update_terakhir
        FROM klaim_barang k
        LEFT JOIN penemuan p ON k.kode_barang = p.kode_barang
        WHERE k.email = %s
        ORDER BY k.id DESC
    """

    cursor.execute(query, (email,))
    data = cursor.fetchall()
    cursor.close()
    db.close()

    # Format gambar
    for item in data:
        if item.get("gambar_barang"):
            item["gambar_barang_url"] = f"/static/uploads/{item['gambar_barang']}"
        else:
            item["gambar_barang_url"] = "/static/image/no-image.png"

    return jsonify(data)

@main.route("/detail-klaim/<kode_laporan>")
def detail_klaim(kode_laporan):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            k.kode_laporan,
            k.kode_laporan_kehilangan,
            k.kode_barang,
            k.nama_barang,
            k.nama_pelapor,
            k.no_telp,
            k.email,
            k.deskripsi_khusus,
            k.foto_barang,
            k.tanggal_lapor,
            k.waktu_lapor,

            -- Status & catatan admin untuk detail laporan terkini
            k.status,
            k.catatan_admin,

            -- FORMAT TANGGAL TANPA GMT
            DATE_FORMAT(k.update_terakhir, '%d-%m-%Y %H:%i') AS update_terakhir,

            p.gambar_barang AS gambar_penemuan,
            p.lokasi,
            p.deskripsi
        FROM klaim_barang k
        LEFT JOIN penemuan p ON k.kode_barang = p.kode_barang
        WHERE k.kode_laporan = %s
    """, (kode_laporan,))

    data = cursor.fetchone()
    cursor.close()
    db.close()

    if not data:
        return render_template("user/not_found.html"), 404

    # Format foto
    if data.get("foto_barang"):
        data["foto_barang"] = f"/static/uploads/{data['foto_barang']}"
    if data.get("gambar_penemuan"):
        data["gambar_penemuan"] = f"/static/uploads/{data['gambar_penemuan']}"

    return render_template("user/detail_riwayat_klaim.html", data=data)

@main.route("/admin/update-status", methods=["POST"])
def admin_update_status():
    kode_laporan = request.form.get("kode_laporan")   # LF-Cxxx
    status = request.form.get("status")               # Pending / Ditolak / Disetujui
    catatan = request.form.get("catatan") or ""

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # =========================
    # 1️⃣ Ambil kode_barang dari klaim
    # =========================
    cursor.execute("""
        SELECT kode_barang
        FROM klaim_barang
        WHERE kode_laporan = %s
    """, (kode_laporan,))
    klaim = cursor.fetchone()

    if not klaim:
        cursor.close()
        db.close()
        return redirect("/admin")

    kode_barang = klaim["kode_barang"]

    # =========================
    # 2️⃣ Update status klaim
    # =========================
    cursor.execute("""
        UPDATE klaim_barang
        SET status = %s,
            catatan_admin = %s,
            update_terakhir = NOW()
        WHERE kode_laporan = %s
    """, (status, catatan, kode_laporan))

    # =========================
    # 3️⃣ UPDATE STATUS BARANG
    # =========================
    if status == "Ditolak":
        cursor.execute("""
            UPDATE penemuan
            SET status_barang = 'Tersedia',
                update_terakhir = NOW()
            WHERE kode_barang = %s
        """, (kode_barang,))

    elif status == "Disetujui":
        cursor.execute("""
            UPDATE penemuan
            SET status_barang = 'Diambil',
                update_terakhir = NOW()
            WHERE kode_barang = %s
        """, (kode_barang,))

    # =========================
    # 4️⃣ Simpan riwayat
    # =========================
    tambah_riwayat_status(kode_laporan, status, catatan)

    db.commit()
    cursor.close()
    db.close()

    return redirect("/admin/detail/" + kode_laporan)

@main.route("/api/riwayat-status/<kode_laporan>")
def api_riwayat_status(kode_laporan):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            status,
            catatan,
            DATE_FORMAT(waktu_update, '%d-%m-%Y %H:%i') AS waktu_update
        FROM riwayat_klaim_barang
        WHERE kode_laporan = %s
        ORDER BY id ASC
    """, (kode_laporan,))

    data = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(data)

@main.route('/detail-barang/<kode>')
def detail_barang(kode):
    barang = get_penemuan_by_kode(kode)
    if not barang:
        return render_template('user/not_found.html'), 404

    # 🔑 ambil dari query string
    kode_kehilangan = request.args.get("lost")

    # simpan ke session (opsional tapi bagus)
    if kode_kehilangan:
        session['kode_kehilangan'] = kode_kehilangan

    if barang.get('gambar_barang'):
        barang['gambar_barang'] = f"/static/uploads/{barang['gambar_barang']}"
    else:
        barang['gambar_barang'] = "/static/image/no-image.png"

    return render_template(
        'user/detail_barang.html',
        barang=barang,
        kode_kehilangan=kode_kehilangan
    )


@main.route('/form_klaim_barang')
def form_klaim_barang():
    kode = request.args.get('id')
    kode_kehilangan = request.args.get('lost')

    barang = None
    if kode:
        barang = get_penemuan_by_kode(kode)
        if not barang:
            return render_template('user/not_found.html'), 404

        if barang.get('gambar_barang'):
            barang['gambar_barang'] = f"/static/uploads/{barang['gambar_barang']}"
        else:
            barang['gambar_barang'] = "/static/image/no-image.png"

    return render_template(
        'user/form_klaim_barang.html',
        barang=barang,
        kode_kehilangan=kode_kehilangan
    )

@main.route("/submit-klaim", methods=["POST"])
def submit_klaim():
    try:
        db = get_db_connection()
        cursor = db.cursor()

        # =========================
        # 1️⃣ AMBIL DATA FORM
        # =========================
        nama = request.form.get("nama")
        telp = request.form.get("telp")
        email = request.form.get("email")
        deskripsi_khusus = request.form.get("deskripsiKhusus")
        kode_barang = request.form.get("kodeBarang")
        kode_laporan_kehilangan = request.form.get("kodeKehilangan")

        # =========================
        # 2️⃣ CEK STATUS BARANG
        # =========================
        cursor.execute("""
            SELECT status_barang, nama_barang
            FROM penemuan
            WHERE kode_barang = %s
            FOR UPDATE
        """, (kode_barang,))
        barang = cursor.fetchone()

        if not barang:
            cursor.close()
            db.close()
            return jsonify({
                "success": False,
                "message": "Barang tidak ditemukan."
            })

        status_barang, nama_barang = barang

        if status_barang != "Tersedia":
            cursor.close()
            db.close()
            return jsonify({
                "success": False,
                "message": "Barang sudah diklaim atau tidak tersedia."
            })

        # =========================
        # 3️⃣ HANDLE FILE UPLOAD
        # =========================
        identitas = request.files.get("fileIdentitas")
        bukti = request.files.get("fileLaporan")
        foto_barang = request.files.get("fotoBarang")

        upload_dir = os.path.join("static", "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        def simpan_file(file_obj):
            if not file_obj or file_obj.filename == "":
                return None
            filename = (
                datetime.now().strftime("%Y%m%d%H%M%S_")
                + secure_filename(file_obj.filename)
            )
            file_obj.save(os.path.join(upload_dir, filename))
            return filename

        nama_identitas = simpan_file(identitas)
        nama_bukti = simpan_file(bukti)
        nama_foto = simpan_file(foto_barang)

        # =========================
        # 4️⃣ GENERATE KODE LAPORAN
        # =========================
        cursor.execute("SELECT kode_laporan FROM klaim_barang ORDER BY id DESC LIMIT 1")
        last = cursor.fetchone()
        last_num = int(last[0].split("LF-C")[-1]) if last else 0
        kode_laporan = f"LF-C{last_num + 1:03d}"

        now = datetime.now()
        tanggal = now.date()
        waktu = now.strftime("%H:%M")

        # =========================
        # 5️⃣ INSERT KLAIM BARANG
        # =========================
        cursor.execute("""
            INSERT INTO klaim_barang (
                kode_laporan, kode_barang, kode_laporan_kehilangan, nama_barang,
                nama_pelapor, no_telp, email, deskripsi_khusus,
                identitas_diri, bukti_laporan, foto_barang,
                tanggal_lapor, waktu_lapor, status, catatan_admin
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'Pending','Menunggu verifikasi oleh admin')
        """, (
            kode_laporan, kode_barang, kode_laporan_kehilangan, nama_barang,
            nama, telp, email, deskripsi_khusus,
            nama_identitas, nama_bukti, nama_foto,
            tanggal, waktu
        ))

        # =========================
        # 6️⃣ KUNCI BARANG (PALING PENTING)
        # =========================
        cursor.execute("""
            UPDATE penemuan
            SET status_barang = 'Diklaim'
            WHERE kode_barang = %s
        """, (kode_barang,))

        db.commit()
        cursor.close()
        db.close()

        # =========================
        # 7️⃣ SIMPAN RIWAYAT STATUS
        # =========================
        tambah_riwayat_status(
            kode_laporan,
            "Pending",
            "Menunggu verifikasi oleh admin"
        )

        return jsonify({
            "success": True,
            "kode_laporan": kode_laporan
        })

    except Exception as e:
        print("Error klaim:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        })

# ==========================
# 🟦 CEK LAPORAN KEHILANGAN
# ==========================
@main.route('/cek-laporan')
def cek_laporan():
    return render_template('user/cek_laporan.html')


@main.route("/proses-cek-laporan", methods=["POST"])
def proses_cek_laporan():
    try:
        data = request.get_json()
        email = data.get("email")
        kode = data.get("kode_kehilangan")

        if not email or not kode:
            return jsonify({"success": False})

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM kehilangan
            WHERE email = %s
              AND kode_kehilangan = %s
        """, (email, kode))

        hasil = cursor.fetchone()

        cursor.close()
        db.close()

        if hasil:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False})

    except Exception as e:
        print("Error proses cek laporan:", e)
        return jsonify({"success": False})

# ==========================
# 🟩 HALAMAN HASIL CEK LAPORAN
# ==========================
@main.route('/hasil-cek')
def hasil_cek():
    kode = request.args.get("kode")
    if not kode:
        return redirect(url_for("main.cek_laporan"))

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM kehilangan
        WHERE kode_kehilangan = %s
        LIMIT 1
    """, (kode,))

    laporan = cursor.fetchone()
    cursor.close()
    db.close()

    if not laporan:
        return redirect(url_for("main.cek_laporan"))

    # ===== FORMAT TANGGAL + WAKTU =====
    tgl_str = laporan.get("tanggal_submit")
    waktu_str = laporan.get("waktu_submit")

    if tgl_str and waktu_str:
        try:
            gabung = datetime.strptime(
                f"{tgl_str} {waktu_str}", "%Y-%m-%d %H:%M"
            )
            laporan["tanggal_waktu_submit"] = gabung.strftime(
                "%d-%m-%Y, %H:%M"
            )
        except:
            laporan["tanggal_waktu_submit"] = f"{tgl_str}, {waktu_str}"
    else:
        laporan["tanggal_waktu_submit"] = "-"

    return render_template(
        "user/hasil_cek.html",
        laporan=laporan,
        kode=kode
    )

@main.route("/detail-cek/<kode_kehilangan>")
def detail_cek(kode_kehilangan):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # ====== AMBIL DATA LAPORAN KEHILANGAN ======
    cursor.execute("""
        SELECT *
        FROM kehilangan
        WHERE kode_kehilangan = %s
        LIMIT 1
    """, (kode_kehilangan,))
    laporan = cursor.fetchone()

    if not laporan:
        cursor.close()
        db.close()
        return render_template("user/not_found.html"), 404

    # ====== FORMAT FOTO ======
    if laporan.get("foto"):
        laporan["foto_url"] = f"/static/uploads/{laporan['foto']}"
    else:
        laporan["foto_url"] = "/static/image/no-image.png"

    # ====== FORMAT TANGGAL SUBMIT (dd/mm/yyyy) ======
    try:
        laporan["tanggal_submit_fmt"] = laporan["tanggal_submit"].strftime("%d %B %Y")
    except:
        laporan["tanggal_submit_fmt"] = laporan["tanggal_submit"]

    # ====== FORMAT WAKTU SUBMIT ======
    laporan["waktu_submit_fmt"] = laporan["waktu_submit"]

    # ====== FORMAT UPDATE TERAKHIR ======
    try:
        laporan["update_terakhir_fmt"] = datetime.strptime(
            laporan["update_terakhir"], "%Y-%m-%d %H:%M"
        ).strftime("%d-%m-%Y %H:%M")
    except:
        laporan["update_terakhir_fmt"] = laporan["update_terakhir"]

    # ====== AMBIL RIWAYAT STATUS ======
    cursor.execute("""
        SELECT status, catatan, waktu_update
        FROM riwayat_status
        WHERE kode_kehilangan = %s
        ORDER BY waktu_update DESC
    """, (kode_kehilangan,))
    riwayat = cursor.fetchall()

    # FORMAT TANGGAL RIWAYAT
    for r in riwayat:
        try:
            r["waktu_update_fmt"] = datetime.strptime(
                r["waktu_update"], "%Y-%m-%d %H:%M"
            ).strftime("%d-%m-%Y %H:%M")
        except:
            r["waktu_update_fmt"] = r["waktu_update"]

    cursor.close()
    db.close()

    return render_template(
        "user/detail_cek.html",
        laporan=laporan,
        riwayat=riwayat,
        status_laporan=laporan["status"]
    )
@main.route("/update-status/<kode_kehilangan>", methods=["POST"])
def update_status(kode_kehilangan):
    try:
        status_baru = request.form.get("status")
        catatan = request.form.get("catatan") or ""

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT status, email
            FROM kehilangan
            WHERE kode_kehilangan = %s
        """, (kode_kehilangan,))
        data = cursor.fetchone()

        if not data:
            return jsonify({"success": False, "message": "Data tidak ditemukan"})

        status_lama = data["status"]
        email_user = data["email"]

        if status_lama == status_baru:
            return jsonify({"success": False, "message": "Status tidak berubah"})

        cursor.execute("""
            UPDATE kehilangan
            SET status = %s,
                catatan = %s,
                update_terakhir = NOW()
            WHERE kode_kehilangan = %s
        """, (status_baru, catatan, kode_kehilangan))

        db.commit()
        cursor.close()
        db.close()

        # =========================
        # 📧 EMAIL VERIFIKASI
        # =========================
        if status_baru == "Verifikasi":
            print("🔥 STATUS VERIFIKASI TERDETEKSI")
            print("📧 EMAIL USER:", email_user)

            kirim_email_verifikasi(email_user, kode_kehilangan)

        return jsonify({"success": True})

    except Exception as e:
        print("❌ ERROR UPDATE STATUS:", e)
        return jsonify({"success": False})


@main.route("/api/rekomendasi/<kode_kehilangan>")
def rekomendasi(kode_kehilangan):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM kehilangan WHERE kode_kehilangan = %s", (kode_kehilangan,))
    lost = cursor.fetchone()

    if not lost:
        return jsonify([])

    nama_lost = lost["nama_barang"].lower()
    kategori = lost["kategori"]
    tanggal_hilang = lost["tanggal_kehilangan"]
    lokasi_lost = lost["lokasi"].lower()

    terminal = ""
    if "terminal 1" in lokasi_lost:
        terminal = "terminal 1"
    elif "terminal 2" in lokasi_lost:
        terminal = "terminal 2"
    elif "terminal 3" in lokasi_lost:
        terminal = "terminal 3"

    sql = """
        SELECT 
            kode_barang, 
            nama_barang, 
            kategori, 
            lokasi, 
            tanggal_lapor, 
            gambar_barang
        FROM penemuan
        WHERE kategori = %s
          AND LOWER(lokasi) LIKE %s
          AND (
                LOWER(nama_barang) LIKE %s OR
                LOWER(nama_barang) LIKE %s OR
                LOWER(nama_barang) LIKE %s
              )
          AND DATEDIFF(%s, tanggal_lapor) BETWEEN -30 AND 30
        ORDER BY tanggal_lapor DESC
        LIMIT 6
    """

    keyword1 = f"%{nama_lost}%"
    keyword2 = f"%{nama_lost.split()[0]}%" if len(nama_lost.split()) > 0 else f"%{nama_lost}%"
    keyword3 = f"%{nama_lost.replace(' ', '')}%"

    params = [
        kategori,
        f"%{terminal}%",
        keyword1, keyword2, keyword3,
        tanggal_hilang
    ]

    cursor.execute(sql, params)
    hasil = cursor.fetchall()

    for h in hasil:
        if h.get("tanggal_lapor"):
            try:
                h["tanggal_lapor"] = h["tanggal_lapor"].strftime("%d-%m-%Y")
            except:
                pass

        if h.get("gambar_barang"):
            h["gambar_barang_url"] = f"/static/uploads/{h['gambar_barang']}"
        else:
            h["gambar_barang_url"] = "/static/image/no-image.png"

    cursor.close()
    db.close()

    return jsonify(hasil)


@main.route("/api/rekomendasi_baru/<kode_kehilangan>")
def rekomendasi_baru(kode_kehilangan):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT nama_barang, kategori, tanggal_kehilangan FROM kehilangan WHERE kode_kehilangan = %s", 
                   (kode_kehilangan,))
    lost = cursor.fetchone()

    if not lost:
        return jsonify([])

    nama_lost = lost["nama_barang"].lower()
    kategori = lost["kategori"]
    tanggal_hilang = lost["tanggal_kehilangan"]

    keywords = [k for k in nama_lost.split() if len(k) >= 3]

    if len(keywords) == 0:
        keywords = [nama_lost]

    like_conditions = " OR ".join(["LOWER(nama_barang) LIKE %s" for _ in keywords])
    like_params = [f"%{k}%" for k in keywords]

    sql = f"""
        SELECT 
            kode_barang, 
            nama_barang, 
            kategori, 
            lokasi, 
            tanggal_lapor, 
            gambar_barang
        FROM penemuan
        WHERE kategori = %s
          AND ({like_conditions})
          AND DATEDIFF(%s, tanggal_lapor) BETWEEN -30 AND 30
        ORDER BY tanggal_lapor DESC
        LIMIT 6
    """

    params = [kategori] + like_params + [tanggal_hilang]
    cursor.execute(sql, params)
    hasil = cursor.fetchall()

    for h in hasil:
        if h.get("tanggal_lapor"):
            h["tanggal_lapor"] = h["tanggal_lapor"].strftime("%d-%m-%Y")

        h["gambar_barang_url"] = (
            f"/static/uploads/{h['gambar_barang']}"
            if h["gambar_barang"] else "/static/image/no-image.png"
        )

    cursor.close()
    db.close()

    return jsonify(hasil)


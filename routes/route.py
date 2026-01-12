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
from PIL import Image
import io
import os
import mysql.connector
import hmac
import hashlib

MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

ALLOWED_IMAGE_EXT = {"jpg", "jpeg", "png", "webp"}
ALLOWED_PDF_EXT = {"pdf"}


main = Blueprint('main', __name__)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="", 
        database="lostfound"
    )
SIGN_SECRET = Config.SIGN_SECRET

def compress_image(file_storage, output_path, ext):
    img = Image.open(file_storage)

    if img.mode in ("RGBA", "P"):
        if ext in ("jpg", "jpeg"):
            img = img.convert("RGB")
        else:
            img = img.convert("RGBA")

    max_width = 1920
    if img.width > max_width:
        ratio = max_width / float(img.width)
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.LANCZOS)

    buffer = io.BytesIO()

    if ext in ("jpg", "jpeg"):
        quality = 85
        while True:
            buffer.seek(0)
            buffer.truncate(0)

            img.save(
                buffer,
                format="JPEG",
                quality=quality,
                optimize=True
            )

            if buffer.tell() <= MAX_SIZE_BYTES or quality <= 30:
                break

            quality -= 5

    elif ext == "png":
        img.save(
            buffer,
            format="PNG",
            optimize=True,
            compress_level=9
        )

    if buffer.tell() > MAX_SIZE_BYTES:
        raise Exception("Gambar tidak dapat dikompres di bawah 5 MB")

    with open(output_path, "wb") as f:
        f.write(buffer.getvalue())

        
def simpan_foto_atau_pdf(file_obj):
    if not file_obj or not file_obj.filename:
        return None

    ext = file_obj.filename.rsplit(".", 1)[-1].lower()

    upload_dir = os.path.join("static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    filename = datetime.now().strftime("%Y%m%d%H%M%S_") + secure_filename(file_obj.filename)
    path = os.path.join(upload_dir, filename)

    file_obj.seek(0, os.SEEK_END)
    size_awal = file_obj.tell()
    file_obj.seek(0)

    if size_awal > 10 * 1024 * 1024:
        raise Exception("Ukuran file terlalu besar (maks 10 MB sebelum diproses)")

    if ext in ALLOWED_IMAGE_EXT:
        compress_image(file_obj, path, ext)

    elif ext in ALLOWED_PDF_EXT:
        if size_awal > MAX_SIZE_BYTES:
            raise Exception("Ukuran PDF maksimal 5 MB")
        file_obj.save(path)

    else:
        raise Exception("Format file harus JPG / JPEG / PNG / PDF")

    return filename

@main.route('/')
def home():
    return render_template('user/indexx.html')

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
def sign_payload(payload: str):
    return hmac.new(
        SIGN_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

BULAN_ID = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
    5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
    9: "September", 10: "Oktober", 11: "November", 12: "Desember"
}

@main.route("/download/surat-pengambilan/<kode_laporan>")
def download_surat_pengambilan(kode_laporan):
    tipe = request.args.get("tipe")  

    if tipe not in ["sendiri", "wakil"]:
        return "Tipe pengambilan tidak valid", 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT kode_laporan, kode_laporan_kehilangan, kode_barang, nama_barang,
               tanggal_lapor, tgl_pilih_pengambilan
        FROM klaim_barang
        WHERE kode_laporan = %s
    """, (kode_laporan,))
    data = cursor.fetchone()

    if not data:
        cursor.close()
        db.close()
        return "Data tidak ditemukan", 404

    tanggal_db = data["tanggal_lapor"]
    tanggal_klaim = (
        datetime.strptime(tanggal_db, "%Y-%m-%d")
        if isinstance(tanggal_db, str)
        else datetime.combine(tanggal_db, datetime.min.time())
    )

    if data["tgl_pilih_pengambilan"] is None:
        tgl_pilih = datetime.today().date()

        cursor.execute("""
            UPDATE klaim_barang
            SET tgl_pilih_pengambilan = %s
            WHERE kode_laporan = %s
        """, (tgl_pilih, kode_laporan))
        db.commit()
    else:
        tgl_pilih = data["tgl_pilih_pengambilan"]

    cursor.close()
    db.close()

    tanggal_maks = datetime.combine(tgl_pilih, datetime.min.time()) + timedelta(days=7)

    tgl_klaim_str = f"{tanggal_klaim.day} {BULAN_ID[tanggal_klaim.month]} {tanggal_klaim.year}"
    tgl_maks_str = f"{tanggal_maks.day} {BULAN_ID[tanggal_maks.month]} {tanggal_maks.year}"

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
        leading=14,        
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

    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    el = []

    el.append(Paragraph(
        "<b>PT ANGKASA PURA BANDARA INTERNASIONAL JUANDA</b>",
        styles["Judul"]
    ))
    el.append(Paragraph(
        "<b><u>SURAT PENGAMBILAN BARANG</u></b>",
        styles["Judul"]
    ))
    el.append(Spacer(1, 10))
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

    el.append(Paragraph(
        "Dengan ini menyatakan bahwa saya adalah <b>pemilik sah barang temuan</b> dengan data sebagai berikut:",
        styles["Isi"]
    ))
    el.append(Spacer(1, 6))

    tabel_barang = Table([
        ["Nama Barang", ":", data["nama_barang"]],
        ["Kode Barang", ":", data["kode_barang"]],
        ["Kode Klaim", ":", data["kode_laporan"]],
        ["Kode Kehilangan", ":", data["kode_laporan_kehilangan"]],
        ["Tanggal Klaim", ":", tgl_klaim],
        ["Tanggal Maksimal Pengambilan", ":", tgl_maks],
    ], colWidths=[6*cm, 0.5*cm, 8*cm])

    tabel_barang.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))

    el.append(tabel_barang)
    el.append(Spacer(1, 10))

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

    el.append(Paragraph(
        "Surabaya, ..............................................",
        styles["Kanan"]
    ))

    el.append(Spacer(1, 18))

    ttd_table = Table([
        ["", Paragraph("Pemilik Barang", styles["TTD_Center"])],
        ["", Spacer(1, 40)],                   
        ["", Paragraph("Materai Rp10.000", styles["Materai"])],
        ["", Spacer(1, 45)],                    
        ["", Paragraph("(___________________________)", styles["TTD_Center"])],
    ], colWidths=[8*cm, 8*cm])                 

    ttd_table.setStyle(TableStyle([
        ("ALIGN", (0,0), (0,0), "LEFT"),       
        ("ALIGN", (0,1), (0,1), "LEFT"),     
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))

    el.append(ttd_table)
    el.append(Spacer(1, 10))

    el.append(Paragraph(
        "<b><i>NB:</i></b><br/>"
        "<i>• Wajib membawa fotokopi KTP pemilik barang.<br/>"
        "• Pengambilan maksimal 7 (tujuh) hari sejak tanggal pemilihan cara pengambilan.</i>",
        styles["NB"]
    ))
    doc.build(el)


def pdf_pengambilan_wakil(path, data, tgl_klaim, tgl_maks):
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="Judul",
        fontSize=10,
        alignment=TA_CENTER,
        leading=13,     
        spaceAfter=3
    ))

    styles.add(ParagraphStyle(
        name="Isi",
        fontSize=10,
        leading=13      
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
        leading=12     
    ))

    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    el = []

    el.append(Paragraph(
        "<b>PT ANGKASA PURA BANDARA INTERNASIONAL JUANDA</b>",
        styles["Judul"]
    ))
    el.append(Paragraph(
        "<b><u>SURAT KUASA PENGAMBILAN BARANG</u></b>",
        styles["Judul"]
    ))
    el.append(Spacer(1, 5))

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

    el.append(Paragraph(
        "Dengan data barang Lost & Found Bandara Internasional Juanda sebagai berikut:",
        styles["Isi"]
    ))
    el.append(Spacer(1, 3))

    tabel_barang = Table([
        ["Nama Barang", ":", data["nama_barang"]],
        ["Kode Barang", ":", data["kode_barang"]],
        ["Kode Klaim", ":", data["kode_laporan"]],
        ["Tanggal Klaim", ":", tgl_klaim],
        ["Tanggal Maksimal Pengambilan", ":", tgl_maks],
    ], colWidths=[6*cm, 0.5*cm, 8*cm])

    tabel_barang.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))

    el.append(tabel_barang)
    el.append(Spacer(1, 5))

    el.append(Paragraph(
        "Dengan ini saya memberikan kuasa penuh kepada penerima kuasa untuk "
        "mengambil barang tersebut atas nama saya. Apabila barang tidak diambil "
        "sampai dengan tanggal maksimal pengambilan sebagaimana tercantum di atas, "
        "maka barang akan diproses sesuai dengan ketentuan yang berlaku.",
        styles["Isi"]
    ))
    el.append(Spacer(1, 5))

    el.append(Paragraph(
        "Surabaya, ...................................................",
        styles["Kanan"]
    ))
    el.append(Spacer(1, 5))

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
    doc.build(el)

import os
from werkzeug.utils import secure_filename

UPLOAD_SURAT = "static/uploads/surat"
os.makedirs(UPLOAD_SURAT, exist_ok=True)


@main.route("/upload-surat/<kode_laporan>", methods=["POST"])
def upload_surat_pengambilan(kode_laporan):
    if "surat" not in request.files:
        return redirect(f"/detail-klaim/{kode_laporan}")

    file = request.files["surat"]
    if file.filename == "":
        return redirect(f"/detail-klaim/{kode_laporan}")

    filename = secure_filename(file.filename)

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT status
        FROM klaim_barang
        WHERE kode_laporan = %s
    """, (kode_laporan,))
    klaim = cursor.fetchone()

    if not klaim or klaim["status"] == "Ditolak":
        cursor.close()
        db.close()
        return redirect(f"/detail-klaim/{kode_laporan}")

    path = os.path.join(UPLOAD_SURAT, filename)
    file.save(path)

    cursor.execute("""
        UPDATE klaim_barang
        SET surat_pengambilan = %s
        WHERE kode_laporan = %s
    """, (filename, kode_laporan))

    db.commit()
    cursor.close()
    db.close()

    return redirect(f"/detail-klaim/{kode_laporan}")
from flask import send_from_directory, abort

@main.route("/surat/<filename>")
def lihat_surat(filename):
    folder = os.path.join("static", "uploads", "surat")
    try:
        return send_from_directory(folder, filename)
    except FileNotFoundError:
        abort(404)

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

@main.route('/form-kehilangan')
def form_kehilangan():
    return render_template('user/form_kehilangan.html')

@main.route("/submit-kehilangan", methods=["POST"])
def submit_kehilangan():
    try:
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
        foto = request.files.get("foto")
        foto_filename = None

        if foto and foto.filename:
            try:
                foto_filename = simpan_foto_atau_pdf(foto)
            except Exception as e:
                return jsonify({
                    "success": False,
                    "message": str(e)
                }), 400

        now = datetime.now()
        tanggal_submit = now.date()
        waktu_submit = now.strftime("%H:%M")
        update_terakhir = now

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("SELECT kode_kehilangan FROM kehilangan ORDER BY id DESC LIMIT 1")
        last_record = cursor.fetchone()

        if last_record:
            last_number = int(last_record[0].split("LF-L")[-1]) + 1
        else:
            last_number = 1

        kode_kehilangan = f"LF-L{last_number:03d}"

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

        try:
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

@main.route("/api/cek-riwayat-klaim", methods=["POST"])
def api_cek_riwayat_klaim():
    data = request.get_json()

    kode_kehilangan = data.get("kode_kehilangan")
    kode_klaim = data.get("kode_klaim")

    if not kode_kehilangan or not kode_klaim:
        return jsonify({
            "status": "error",
            "message": "Kode kehilangan dan kode klaim wajib diisi"
        }), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT kode_laporan
        FROM klaim_barang
        WHERE kode_laporan = %s
          AND kode_laporan_kehilangan = %s
    """, (kode_klaim, kode_kehilangan))

    klaim = cursor.fetchone()
    cursor.close()
    db.close()

    if not klaim:
        return jsonify({"status": "not_found"}), 200

    return jsonify({
        "status": "success",
        "kode_klaim": klaim["kode_laporan"]
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
            k.surat_pengambilan,

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

    if data.get("foto_barang"):
        data["foto_barang"] = f"/static/uploads/{data['foto_barang']}"
    if data.get("gambar_penemuan"):
        data["gambar_penemuan"] = f"/static/uploads/{data['gambar_penemuan']}"

    return render_template("user/detail_riwayat_klaim.html", data=data)

@main.route("/admin/update-status", methods=["POST"])
def admin_update_status():
    kode_laporan = request.form.get("kode_laporan")  
    status = request.form.get("status")            
    catatan = request.form.get("catatan") or ""

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

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

    cursor.execute("""
        UPDATE klaim_barang
        SET status = %s,
            catatan_admin = %s,
            update_terakhir = NOW()
        WHERE kode_laporan = %s
    """, (status, catatan, kode_laporan))

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

    kode_kehilangan = request.args.get("lost")

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

        nama = request.form.get("nama")
        telp = request.form.get("telp")
        email = request.form.get("email")
        deskripsi_khusus = request.form.get("deskripsiKhusus")
        kode_barang = request.form.get("kodeBarang")
        kode_laporan_kehilangan = request.form.get("kodeKehilangan")

        cursor.execute("""
            SELECT status_barang, nama_barang
            FROM penemuan
            WHERE kode_barang = %s
            FOR UPDATE
        """, (kode_barang,))
        barang = cursor.fetchone()

        if not barang:
            return jsonify({"success": False, "message": "Barang tidak ditemukan."})

        status_barang, nama_barang = barang

        if status_barang != "Tersedia":
            return jsonify({
                "success": False,
                "message": "Barang sudah diklaim atau tidak tersedia."
            })

        identitas = request.files.get("fileIdentitas")
        bukti = request.files.get("fileLaporan")
        foto_barang = request.files.get("fotoBarang")

        nama_identitas = simpan_foto_atau_pdf(identitas)
        nama_bukti = simpan_foto_atau_pdf(bukti)
        nama_foto = simpan_foto_atau_pdf(foto_barang)

        cursor.execute("SELECT kode_laporan FROM klaim_barang ORDER BY id DESC LIMIT 1")
        last = cursor.fetchone()
        last_num = int(last[0].split("LF-C")[-1]) if last else 0
        kode_laporan = f"LF-C{last_num + 1:03d}"

        now = datetime.now()
        tanggal = now.date()
        waktu = now.strftime("%H:%M")

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

        cursor.execute("""
            UPDATE penemuan
            SET status_barang = 'Diklaim'
            WHERE kode_barang = %s
        """, (kode_barang,))

        cursor.execute("""
            UPDATE kehilangan
            SET status = %s,
                catatan = %s,
                update_terakhir = NOW()
            WHERE kode_kehilangan = %s
        """, (
            "Dalam Proses",
            "Barang sedang dalam proses klaim oleh pelapor",
            kode_laporan_kehilangan
        ))

        db.commit()
        cursor.close()
        db.close()

        tambah_riwayat_status(
            kode_laporan,
            "Pending",
            "Menunggu verifikasi oleh admin"
        )

        try:
            msg_user = Message(
                subject="Konfirmasi Klaim Barang - Lost & Found Juanda",
                recipients=[email]
            )
            msg_user.body = f"""
Halo {nama},

Pengajuan klaim barang Anda berhasil kami terima dan sedang menunggu verifikasi admin.

Kode Klaim      : {kode_laporan}
Kode Barang     : {kode_barang}
Kode Kehilangan : {kode_laporan_kehilangan}
Nama Barang     : {nama_barang}
Tanggal Klaim   : {tanggal} {waktu}

Silakan simpan kode klaim ini untuk mengecek status klaim Anda.

Terima kasih,
Lost & Found Bandara Internasional Juanda
"""
            mail.send(msg_user)
            msg_admin = Message(
                subject=f"[KLAIM BARU] {kode_laporan} - {nama_barang}",
                recipients=[Config.ADMIN_EMAIL]
            )
            msg_admin.body = f"""
📦 KLAIM BARANG BARU

Kode Klaim      : {kode_laporan}
Kode Barang     : {kode_barang}
Kode Kehilangan : {kode_laporan_kehilangan}
Nama Barang     : {nama_barang}
Tanggal Klaim   : {tanggal} {waktu}

Nama Pelapor : {nama}
Email        : {email}
No Telp      : {telp}

Status       : Pending
Catatan      : Menunggu verifikasi oleh admin

Silakan login admin untuk memproses klaim ini.
"""
            mail.send(msg_admin)

        except Exception as e:
            print("❌ Gagal kirim email klaim:", e)

        return jsonify({
            "success": True,
            "kode_laporan": kode_laporan
        })

    except Exception as e:
        print("❌ ERROR SUBMIT KLAIM:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        })

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

    if laporan.get("foto"):
        laporan["foto_url"] = f"/static/uploads/{laporan['foto']}"
    else:
        laporan["foto_url"] = "/static/image/no-image.png"

    try:
        laporan["tanggal_submit_fmt"] = laporan["tanggal_submit"].strftime("%d %B %Y")
    except:
        laporan["tanggal_submit_fmt"] = laporan["tanggal_submit"]

    laporan["waktu_submit_fmt"] = laporan["waktu_submit"]

    try:
        laporan["update_terakhir_fmt"] = datetime.strptime(
            laporan["update_terakhir"], "%Y-%m-%d %H:%M"
        ).strftime("%d-%m-%Y %H:%M")
    except:
        laporan["update_terakhir_fmt"] = laporan["update_terakhir"]

    cursor.execute("""
        SELECT status, catatan, waktu_update
        FROM riwayat_status
        WHERE kode_kehilangan = %s
        ORDER BY waktu_update DESC
    """, (kode_kehilangan,))
    riwayat = cursor.fetchall()

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
        cursor = db.cursor()

        cursor.execute("SELECT status FROM kehilangan WHERE kode_kehilangan=%s", (kode_kehilangan,))
        old_status = cursor.fetchone()

        if not old_status:
            return jsonify({"success": False, "message": "Data tidak ditemukan"})

        old_status = old_status[0]

        if old_status == status_baru:
            return jsonify({"success": False, "message": "Status sama, tidak diubah"})

        cursor.execute("""
            UPDATE kehilangan 
            SET status=%s,
                catatan=%s,
                update_terakhir=NOW()
            WHERE kode_kehilangan=%s
        """, (status_baru, catatan, kode_kehilangan))

        cursor.execute("""
            INSERT INTO riwayat_status (kode_kehilangan, status, catatan, waktu_update)
            VALUES (%s, %s, %s, ())
        """, (kode_kehilangan, status_baru, catatan))

        db.commit()
        cursor.close()
        db.close()

        return jsonify({"success": True, "message": "Status berhasil diperbarui"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@main.route("/api/rekomendasi/<kode_kehilangan>")
def rekomendasi(kode_kehilangan):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            p.kode_barang,
            p.nama_barang,
            p.kategori,
            p.lokasi,
            p.tanggal_lapor,
            p.gambar_barang
        FROM rekomendasi_penemuan r
        JOIN penemuan p ON r.kode_penemuan = p.kode_barang
        WHERE r.kode_kehilangan = %s
          AND p.status_barang = 'Tersedia'
    """, (kode_kehilangan,))

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

@main.route("/api/tutup-laporan/<kode_kehilangan>", methods=["POST"])
def tutup_laporan(kode_kehilangan):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE kehilangan
        SET status = 'Barang Tidak Ditemukan',
            catatan = 'Tidak ada barang yang sesuai. Laporan telah selesai',
            update_terakhir = NOW()
        WHERE kode_kehilangan = %s
    """, (kode_kehilangan,))

    db.commit()
    cursor.close()
    db.close()

    return jsonify({"success": True})


# routes/route.py
from flask import Blueprint, request, jsonify, render_template,redirect, url_for
from datetime import datetime
from werkzeug.utils import secure_filename
from models import fetch_public_penemuan, get_penemuan_by_kode, fetch_barang_publik_terbaru
from models import get_laporan_by_email
import os
import mysql.connector

main = Blueprint('main', __name__)

# --- Koneksi ke database MySQL ---
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # ubah sesuai MySQL kamu
        database="lostfound"
    )
# Halaman utama
@main.route('/')
def home():
    return render_template('user/indexx.html')

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

# --- Route untuk menerima data kehilangan ---
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
        tanggal_submit = now.strftime("%d/%m/%Y")
        waktu_submit = now.strftime("%H:%M")
        update_terakhir = now.strftime("%d/%m/%Y %H:%M")

        # === Koneksi database ===
        db = get_db_connection()
        cursor = db.cursor()

        # Ambil kode terakhir
        cursor.execute("SELECT kode_kehilangan FROM kehilangan ORDER BY id DESC LIMIT 1")
        last_record = cursor.fetchone()

        if last_record:
            last_code = last_record[0]  # contoh: LF-L00025
            last_number = int(last_code.split("LF-L")[-1])
            new_number = last_number + 1
        else:
            new_number = 1

        kode_kehilangan = f"LF-L{new_number:05d}"

        # === Simpan ke database ===
        query = """
            INSERT INTO kehilangan (
                kode_kehilangan, nama_pelapor, email, no_telp, asal_negara, kota,
                nama_barang, kategori, jenis_laporan, deskripsi, lokasi,
                tanggal_kehilangan, tanggal_submit, waktu_submit, update_terakhir,
                catatan, status, foto
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        values = (
            kode_kehilangan, nama_pelapor, email, no_telp, asal_negara, kota,
            nama_barang, kategori, jenis_laporan, deskripsi, lokasi,
            tanggal_kehilangan, tanggal_submit, waktu_submit, update_terakhir,
            "Menunggu verifikasi oleh admin", "Pending", foto_filename
        )

        cursor.execute(query, values)
        db.commit()

        # === Tutup koneksi ===
        cursor.close()
        db.close()

        # === Response sukses ===
        return jsonify({
            "success": True,
            "kode_kehilangan": kode_kehilangan,
            "lokasi": lokasi,
            "tanggal_submit": tanggal_submit,
            "waktu_submit": waktu_submit
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"success": False, "message": str(e)})

@main.route('/riwayat-klaim')
def riwayat_klaim():
    return render_template('user/riwayat_klaim.html', barang_id=id)

@main.route('/detail-barang/<kode>')
def detail_barang(kode):
    barang = get_penemuan_by_kode(kode)
    if not barang:
        return render_template('user/not_found.html'), 404

    # Ubah path gambar agar bisa tampil
    if barang.get('gambar_barang'):
        barang['gambar_barang'] = f"/static/uploads/{barang['gambar_barang']}"
    else:
        barang['gambar_barang'] = "/static/image/no-image.png"

    return render_template('user/detail_barang.html', barang=barang)

# Halaman form klaim barang (berdasarkan kode barang)
@main.route('/form_klaim_barang')
def form_klaim_barang():
    kode = request.args.get('id')  # ambil kode dari URL ?id=LF-F001
    barang = None

    if kode:
        from models import get_penemuan_by_kode
        barang = get_penemuan_by_kode(kode)

        # Jika tidak ditemukan
        if not barang:
            return render_template('user/not_found.html'), 404

        # Pastikan path gambar bisa ditampilkan
        if barang.get('gambar_barang'):
            barang['gambar_barang'] = f"/static/uploads/{barang['gambar_barang']}"
        else:
            barang['gambar_barang'] = "/static/image/no-image.png"

    # Render halaman form klaim dengan data barang
    return render_template('user/form_klaim_barang.html', barang=barang)

@main.route("/submit-klaim", methods=["POST"])
def submit_klaim():
    try:
        db = get_db_connection()
        cursor = db.cursor()

        # === Ambil data dari form ===
        nama = request.form.get("nama")
        telp = request.form.get("telp")
        email = request.form.get("email")
        deskripsi_khusus = request.form.get("deskripsiKhusus")
        kode_barang = request.form.get("kodeBarang")
        kode_laporan_kehilangan = request.form.get("kodeKehilangan")

        # === File upload ===
        identitas = request.files.get("fileIdentitas")
        bukti = request.files.get("fileLaporan")   # opsional
        foto_barang = request.files.get("fotoBarang")

        upload_dir = os.path.join("static", "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        def simpan_file(file_obj):
            if not file_obj or file_obj.filename == "":
                return None
            filename = datetime.now().strftime("%d%m%Y%H%M%S_") + secure_filename(file_obj.filename)
            path = os.path.join(upload_dir, filename)
            file_obj.save(path)
            return filename

        nama_identitas = simpan_file(identitas)
        nama_bukti = simpan_file(bukti)
        nama_foto = simpan_file(foto_barang)

        # === Generate kode klaim baru ===
        cursor.execute("SELECT kode_laporan FROM klaim_barang ORDER BY id DESC LIMIT 1")
        last = cursor.fetchone()

        if last and last[0]:
            last_num = int(last[0].split("LF-C")[-1])
        else:
            last_num = 0
        kode_laporan = f"LF-C{last_num + 1:05d}"

        now = datetime.now()
        tanggal = now.strftime("%d/%m/%Y")
        waktu = now.strftime("%H:%M")

        # === Simpan ke database ===
        query = """
            INSERT INTO klaim_barang (
                kode_laporan, kode_barang, kode_laporan_kehilangan, nama_barang,
                nama_pelapor, no_telp, email, deskripsi_khusus,
                identitas_diri, bukti_laporan, foto_barang,
                tanggal_lapor, waktu_lapor, status, catatan_admin
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        cursor.execute("""
            SELECT nama_barang FROM penemuan WHERE kode_barang=%s
        """, (kode_barang,))
        nama_barang_row = cursor.fetchone()
        nama_barang = nama_barang_row[0] if nama_barang_row else "Tidak diketahui"

        values = (
            kode_laporan, kode_barang, kode_laporan_kehilangan, nama_barang,
            nama, telp, email, deskripsi_khusus,
            nama_identitas, nama_bukti, nama_foto,
            tanggal, waktu, "Pending", "Menunggu verifikasi oleh admin."
        )

        cursor.execute(query, values)
        db.commit()
        cursor.close()
        db.close()

        return jsonify({"success": True, "kode_laporan": kode_laporan})

    except Exception as e:
        print("Error klaim:", e)
        return jsonify({"success": False, "message": str(e)})

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

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM kehilangan WHERE email = %s", (email,))
        hasil = cursor.fetchall()
        cursor.close()
        db.close()

        if hasil and len(hasil) > 0:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False})
    except Exception as e:
        print("Error proses cek laporan:", e)
        return jsonify({"success": False, "message": str(e)})

# ==========================
# 🟩 HALAMAN HASIL CEK LAPORAN
# ==========================
@main.route('/hasil-cek')
def hasil_cek():
    email = request.args.get("email")
    if not email:
        return redirect(url_for("main.cek_laporan"))

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM kehilangan 
        WHERE email = %s 
        ORDER BY tanggal_submit DESC, waktu_submit DESC 
        LIMIT 1
    """, (email,))
    laporan = cursor.fetchone()
    cursor.close()
    db.close()

    if laporan:
        tgl_str = laporan.get("tanggal_submit")
        waktu_str = laporan.get("waktu_submit")

        # Gabungkan tanggal + waktu menjadi datetime
        if tgl_str and waktu_str:
            try:
                gabung = datetime.strptime(f"{tgl_str} {waktu_str}", "%Y-%m-%d %H:%M:%S")
                laporan["tanggal_waktu_submit"] = gabung.strftime("%d/%m/%Y, %H:%M")
            except ValueError:
                try:
                    gabung = datetime.strptime(f"{tgl_str} {waktu_str}", "%d/%m/%Y %H:%M:%S")
                    laporan["tanggal_waktu_submit"] = gabung.strftime("%d/%m/%Y, %H:%M")
                except:
                    laporan["tanggal_waktu_submit"] = f"{tgl_str}, {waktu_str}"
        else:
            laporan["tanggal_waktu_submit"] = tgl_str or waktu_str or "-"

    return render_template("user/hasil_cek.html", email=email, laporan=laporan)

@main.route('/detail-cek/<kode>')
def detail_cek(kode):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM kehilangan WHERE kode_kehilangan = %s", (kode,))
    laporan = cursor.fetchone()
    cursor.close()
    db.close()

    if not laporan:
        return redirect(url_for('main.cek_laporan'))

    return render_template("user/detail_cek.html", laporan=laporan)

# routes/route.py
from flask import Blueprint, request, jsonify, render_template,  url_for
from datetime import datetime
from models import fetch_public_penemuan, get_penemuan_by_kode, fetch_barang_publik_terbaru
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
        nama = request.form.get("nama_pelapor")
        no_telp = request.form.get("no_telp")
        email = request.form.get("email")
        asal_negara = request.form.get("asal_negara")
        kota = request.form.get("kota")
        nama_barang = request.form.get("nama_barang")
        kategori = request.form.get("kategori")
        lokasi_kehilangan = request.form.get("lokasi_kehilangan")
        tanggal_kehilangan = request.form.get("tanggal_kehilangan")
        deskripsi = request.form.get("deskripsi")
        foto = request.files.get("foto_barang")

        # Simpan foto
        foto_filename = None
        if foto:
            foto_filename = datetime.now().strftime("%Y%m%d%H%M%S_") + foto.filename
            upload_path = os.path.join("static", "uploads", foto_filename)
            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            foto.save(upload_path)

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

        kode = f"LF-L{new_number:05d}"

        # Format tanggal dan waktu
        now = datetime.now()
        tanggal_submit = now.strftime("%d/%m/%Y")
        waktu_submit = now.strftime("%H:%M")

        # Simpan ke database
        query = """
            INSERT INTO kehilangan (
                kode_kehilangan, nama_pelapor, no_telp, email, asal_negara, kota,
                nama_barang, kategori, lokasi_kehilangan, tanggal_kehilangan,
                deskripsi, foto_barang, tanggal_submit, waktu_submit, status
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        values = (
            kode, nama, no_telp, email, asal_negara, kota,
            nama_barang, kategori, lokasi_kehilangan, tanggal_kehilangan,
            deskripsi, foto_filename, tanggal_submit, waktu_submit, "Pending"
        )

        cursor.execute(query, values)
        db.commit()
        cursor.close()
        db.close()

        return jsonify({
            "success": True,
            "kode_kehilangan": kode,
            "tanggal_submit": tanggal_submit,
            "waktu_submit": waktu_submit
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"success": False, "message": str(e)})

# Halaman cek laporan
@main.route('/cek-laporan')
def cek_laporan():
    return render_template('user/cek_laporan.html')

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

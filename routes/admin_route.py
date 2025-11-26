from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, flash 
import mysql.connector
from datetime import datetime
import os
import time
from werkzeug.utils import secure_filename
from flask import request
import re

admin_bp = Blueprint(
    'admin_bp',
    __name__,
    static_folder='../static_admin',
    static_url_path='/static_admin',
    template_folder='../templates/admin'
)

# ======================
# 🔗 KONEKSI DATABASE
# ======================
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',         
        password='',         
        database='lostfound'  # pastikan sesuai dengan database kamu
    )
    
@admin_bp.route('/login', methods=['GET', 'POST'])
def login_admin():
    if request.method == 'GET':
        return render_template('index.html')

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id, full_name, email, phone, role 
        FROM admin 
        WHERE email=%s AND password=%s
    """, (email, password))

    admin = cursor.fetchone()
    cursor.close()
    conn.close()

    if admin:
        session['admin_logged_in'] = True
        session['admin_email'] = admin['email']
        session['admin_id'] = admin['id']
        session['role'] = admin['role']   # 🔥 WAJIB!

        return jsonify({'success': True, 'role': admin['role']})
    else:
        return jsonify({'success': False, 'message': 'Email atau password salah!'})

# ======================
# 🔁 LUPA PASSWORD
# ======================
@admin_bp.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'GET':
        return render_template('forgot_password.html')

    data = request.get_json()
    email = data.get('email') if data else None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin WHERE email=%s", (email,))
    admin = cursor.fetchone()
    conn.close()

    if admin:
        return jsonify({'success': True, 'message': 'Link reset password telah dikirim ke email Anda!'})
    else:
        return jsonify({'success': False, 'message': 'Email tidak terdaftar!'})

# ======================
# 🏠 BERANDA
# ======================
@admin_bp.route('/beranda')
def beranda_admin():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    role = session.get('role', 'admin')
    return render_template('beranda.html', role=role)

# ======================
# 📋 DAFTAR KEHILANGAN
# ======================
@admin_bp.route('/kehilangan/daftar')
def daftar_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM kehilangan ORDER BY tanggal_submit DESC, waktu_submit DESC")
    kehilangan_list = cursor.fetchall()
    conn.close()

    return render_template(
        'daftar_kehilangan.html',
        kehilangan_list=kehilangan_list,
        role=session.get('role')
    )
    
# ======================
# 🔢 GENERATE KODE KEHILANGAN URUT 
# ======================
import re

def generate_kode_kehilangan(cursor):
    cursor.execute("SELECT kode_kehilangan FROM kehilangan ORDER BY id DESC LIMIT 1")
    result = cursor.fetchone()

    if not result or not result[0]:
        return "LF-L001"

    last_code = result[0]  # contoh: LF-L001

    match = re.search(r"LF-L(\d+)", last_code)
    if not match:
        return "LF-L001"

    number = int(match.group(1))
    new_number = number + 1

    return f"LF-L{new_number:03d}"

# ======================
# ➕ TAMBAH KEHILANGAN
# ======================
@admin_bp.route('/kehilangan/tambah', methods=['GET', 'POST'])
def tambah_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor()

    # ======================
    # GET — tampilkan halaman + kode otomatis
    # ======================
    if request.method == 'GET':
        kode_baru = generate_kode_kehilangan(cursor)

        cursor.close()
        conn.close()

        return render_template(
            'tambah_kehilangan.html',
            role=session.get('role'),
            kode_baru=kode_baru
        )

    # ======================
    # POST — proses data form
    # ======================
    kode_kehilangan = request.form.get('kode_kehilangan')  # ← Kode sudah otomatis
    nama_pelapor = request.form.get('nama_pelapor', '').strip()
    email = request.form.get('email', '').strip()
    no_telp = request.form.get('no_telp', '').strip()
    asal_negara = request.form.get('asal_negara', '').strip()
    kota = request.form.get('kota', '').strip()
    nama_barang = request.form.get('nama_barang', '').strip()
    kategori = request.form.get('kategori', '').strip()
    jenis_laporan = request.form.get('jenis_laporan', 'Kehilangan').strip()
    deskripsi = request.form.get('deskripsi', '').strip()
    lokasi = request.form.get('lokasi', '').strip()
    tanggal_kehilangan = request.form.get('tanggal_kehilangan')
    status = request.form.get('status', 'Verifikasi').strip()
    catatan = ''  # tidak digunakan tapi kolomnya ada

    # Validasi server: field wajib isi
    required = [
        nama_pelapor, email, no_telp, nama_barang,
        kategori, deskripsi, lokasi, tanggal_kehilangan
    ]
    if any((v is None or str(v).strip() == '') for v in required):
        cursor.close()
        conn.close()
        return "Error: Semua field wajib diisi (server-side).", 400

    # Handle upload foto
    foto = request.files.get('foto')
    foto_filename = None

    if foto and foto.filename:
        upload_folder = os.path.join('static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        foto_filename = foto.filename
        foto.save(os.path.join(upload_folder, foto_filename))

    # Waktu submit
    now = datetime.now()
    tanggal_submit = now.strftime("%Y-%m-%d")
    waktu_submit = now.strftime("%H:%M")
    update_terakhir = now.strftime("%Y-%m-%d %H:%M")

    # ======================
    # INSERT KE DATABASE
    # ======================
    try:
        cursor.execute("""
            INSERT INTO kehilangan (
                kode_kehilangan,
                nama_pelapor,
                email,
                no_telp,
                asal_negara,
                kota,
                nama_barang,
                kategori,
                jenis_laporan,
                deskripsi,
                lokasi,
                tanggal_kehilangan,
                tanggal_submit,
                waktu_submit,
                update_terakhir,
                catatan,
                status,
                foto
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            kode_kehilangan,
            nama_pelapor,
            email,
            no_telp,
            asal_negara,
            kota,
            nama_barang,
            kategori,
            jenis_laporan,
            deskripsi,
            lokasi,
            tanggal_kehilangan,
            tanggal_submit,
            waktu_submit,
            update_terakhir,
            catatan,
            status,
            foto_filename
        ))

        conn.commit()

    except Exception as ex:
        conn.rollback()
        cursor.close()
        conn.close()
        print("❌ Error INSERT kehilangan:", ex)
        return f"Terjadi kesalahan saat menyimpan: {ex}", 500

    cursor.close()
    conn.close()

    return redirect(url_for('admin_bp.daftar_kehilangan'))

# ======================
# 🔍 DETAIL KEHILANGAN
# ======================
@admin_bp.route('/kehilangan/detail')
def detail_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    # Ambil parameter ?kode=LF-L001
    kode_kehilangan = request.args.get('kode')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM kehilangan WHERE kode_kehilangan = %s", (kode_kehilangan,))
    laporan = cursor.fetchone()
    cursor.close()
    conn.close()

    if not laporan:
        return "Data tidak ditemukan", 404

    return render_template('detail_kehilangan.html', laporan=laporan, role=session.get('role'))

# ======================
# 🔄 API: Update Status Kehilangan
# ======================
@admin_bp.route('/api/kehilangan/update_status', methods=['POST'])
def update_status_kehilangan():
    data = request.get_json()
    kode = data.get('kode')
    status = data.get('status')

    if not kode or not status:
        return jsonify({'success': False, 'message': 'Data tidak lengkap!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    waktu_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Update status di tabel kehilangan
    cursor.execute("""
        UPDATE kehilangan 
        SET status = %s, update_terakhir = %s
        WHERE kode_kehilangan = %s
    """, (status, waktu_update, kode))
    conn.commit()

    # Jika status = Selesai → pindahkan ke arsip
    if status == "Selesai":
        pindahkan_ke_arsip(kode, "kehilangan")

    cursor.close()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Status berhasil diperbarui!',
        'update_terakhir': waktu_update
    })
    
    # ============================
    # 🗑 API DELETE - By Kode
    # ============================
@admin_bp.route('/api/kehilangan/delete', methods=['POST'])
def api_hapus_kehilangan():
    data = request.get_json()
    kode = data.get("kode")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM kehilangan WHERE kode_kehilangan = %s", (kode,))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        print("Error delete:", e)
        return jsonify({"success": False})
    finally:
        cursor.close()
        conn.close()

# ======================
# ✏️ EDIT KEHILANGAN
# ======================
@admin_bp.route('/kehilangan/edit', methods=['GET', 'POST'])
def edit_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode_kehilangan = request.args.get('kode')
    if not kode_kehilangan:
        return "Kode kehilangan tidak ditemukan", 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # === MODE GET ===
    if request.method == 'GET':
        cursor.execute("SELECT * FROM kehilangan WHERE kode_kehilangan=%s", (kode_kehilangan,))
        laporan = cursor.fetchone()

        # Pisahkan lokasi "Terminal 2 - Bagasi"
        lokasi_full = laporan.get('lokasi', '')

        if " - " in lokasi_full:
            terminal, tempat = lokasi_full.split(" - ", 1)
        else:
            terminal, tempat = lokasi_full, ""

        laporan['terminal'] = terminal
        laporan['tempat'] = tempat

        # TEMPAT FIX (dropdown)
        tempat_list = [
            "Check-in",
            "Boarding Room",
            "Kedatangan",
            "Ruang Tunggu",
            "Bagasi",
            "Drop Zone",
            "Toilet",
            "Musala",
            "Foodcourt",
            "Area Parkir"
        ]

        return render_template(
            'edit_kehilangan.html',
            laporan=laporan,
            tempat_list=tempat_list,
            role=session.get('role')
        )

    # === MODE POST ===
    elif request.method == 'POST':
        try:
            nama_pelapor = request.form['nama_pelapor']
            no_telp = request.form['no_telp']
            email = request.form['email']
            asal_negara = request.form['asal_negara']
            kota = request.form['kota']
            
            nama_barang = request.form['nama_barang']
            kategori = request.form['kategori']
            terminal = request.form['terminal']
            tempat = request.form['tempat']
            lokasi = f"{terminal} - {tempat}"
            deskripsi = request.form['deskripsi']
            catatan = request.form['catatan']
            status = request.form['status']
            status = request.form['status']

            update_terakhir = datetime.now().strftime("%Y-%m-%d %H:%M")
            
            cursor.execute("""
                UPDATE kehilangan
                SET nama_pelapor=%s,
                    no_telp=%s,
                    email=%s,
                    asal_negara=%s,
                    kota=%s,
                    nama_barang=%s,
                    kategori=%s,
                    lokasi=%s,
                    deskripsi=%s,
                    catatan=%s,
                    status=%s,
                    update_terakhir=%s
                WHERE kode_kehilangan=%s
            """, (
                nama_pelapor,
                no_telp,
                email,
                asal_negara,
                kota,
                nama_barang,
                kategori,
                lokasi,
                deskripsi,
                catatan,
                status,
                update_terakhir,
                kode_kehilangan
            ))

            conn.commit()
            cursor.close()
            conn.close()

            flash("Data kehilangan berhasil diperbarui!", "success")
            return redirect(url_for('admin_bp.daftar_kehilangan'))

        except Exception as e:
            conn.rollback()
            cursor.close()
            conn.close()
            print("❌ Error saat update kehilangan:", e)
            return f"Terjadi kesalahan: {e}", 500

# ======================
# 🗑️ ROUTE: Hapus Data Kehilangan
# ======================
@admin_bp.route('/kehilangan/hapus/<int:id>', methods=['GET'])
def hapus_kehilangan(id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Hapus data berdasarkan ID
        cursor.execute("DELETE FROM kehilangan WHERE id = %s", (id,))
        conn.commit()
        print(f"✅ Data kehilangan dengan ID {id} berhasil dihapus.")
    except Exception as e:
        print("❌ Error saat menghapus data:", e)
    finally:
        cursor.close()
        conn.close()

    # Kembali ke daftar kehilangan setelah hapus
    return redirect(url_for('admin_bp.daftar_kehilangan'))

# ======================
# 📦 PENEMUAN
# ======================
@admin_bp.route('/penemuan/daftar')
def daftar_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM penemuan ORDER BY tanggal_lapor DESC, update_terakhir DESC")
    penemuan_list = cursor.fetchall()
    conn.close()

    return render_template(
        'daftar_penemuan.html',
        penemuan_list=penemuan_list,
        role=session.get('role')
    )

@admin_bp.route('/penemuan/tambah', methods=['GET', 'POST'])
def tambah_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    if request.method == 'GET':
        kode_baru = generate_kode_penemuan(cursor)
        return render_template('tambah_penemuan.html', kode_baru=kode_baru)

    # ===== POST METHOD =====
    nama_pelapor = request.form.get('nama_pelapor', '').strip()
    no_telp = request.form.get('no_telp', '').strip()
    email = request.form.get('email', '').strip()
    nama_barang = request.form.get('nama_barang', '').strip()
    kategori = request.form.get('kategori', '').strip()
    lokasi = request.form.get('lokasi', '').strip()
    deskripsi = request.form.get('deskripsi', '').strip()
    tanggal_lapor = request.form.get('tanggal_lapor', '').strip()

    kode_barang = request.form.get('kode_barang')
    jenis_laporan = request.form.get('jenis_laporan', 'Penemuan')
    status = request.form.get('status', 'Pending')
    jenis_barang = request.form.get('jenis_barang', 'Publik')

    if not all([kode_barang, nama_pelapor, nama_barang, kategori, lokasi, tanggal_lapor]):
        conn.close()
        return "Data wajib tidak boleh kosong!", 400

    # ===== Upload foto =====
    foto = request.files.get('foto')
    foto_filename = None
    if foto and foto.filename:
        upload_folder = os.path.join('static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        foto_filename = f"{int(time.time())}_{foto.filename}"
        foto.save(os.path.join(upload_folder, foto_filename))

    try:
        cursor.execute("""
            INSERT INTO penemuan (
                kode_barang, nama_pelapor, no_telp, email, nama_barang,
                kategori, jenis_laporan, lokasi, deskripsi, tanggal_lapor,
                update_terakhir, status, gambar_barang, jenis_barang
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),%s,%s,%s)
        """, (
            kode_barang, nama_pelapor, no_telp, email, nama_barang,
            kategori, jenis_laporan, lokasi, deskripsi, tanggal_lapor,
            status, foto_filename, jenis_barang
        ))
        conn.commit()
        flash("Penemuan berhasil ditambahkan!", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Terjadi kesalahan: {e}", "danger")
        return redirect(request.url)
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('admin_bp.daftar_penemuan'))

# ================== DETAIL PENEMUAN ==================
@admin_bp.route('/penemuan/detail')
def detail_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode = request.args.get('kode')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM penemuan WHERE kode_barang=%s", (kode,))
    laporan = cursor.fetchone()
    conn.close()

    if not laporan:
        return "Data tidak ditemukan", 404

    return render_template('detail_penemuan.html', laporan=laporan, role=session.get('role'))

@admin_bp.route('/api/penemuan/update_status', methods=['POST'])
def update_status_penemuan():
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    kode = data.get('kode')              # kode_barang
    status_baru = data.get('status')

    # Validasi input
    if not kode or not status_baru:
        return jsonify({
            "success": False,
            "message": "Kode atau status tidak ada"
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(buffered=True)

        update_terakhir = datetime.now().strftime("%Y-%m-%d %H:%M")

        # ================================
        # UPDATE STATUS PENEMUAN
        # ================================
        cursor.execute("""
            UPDATE penemuan
            SET status = %s,
                update_terakhir = %s
            WHERE kode_barang = %s
        """, (status_baru, update_terakhir, kode))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Kode tidak ditemukan"}), 404

        # ================================
        # PINDAHKAN KE ARSIP OTOMATIS
        # ================================
        if status_baru == "Selesai":
            try:
                pindahkan_ke_arsip(kode, "penemuan")
            except Exception as e:
                print("❌ GAGAL MEMINDAHKAN KE ARSIP:", e)

        return jsonify({
            "success": True,
            "update_terakhir": update_terakhir
        })

    except Exception as e:
        print("❌ Error update_status_penemuan:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@admin_bp.route('/klaim/baru', methods=['GET', 'POST'])
def tambah_klaim_penemuan():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    if request.method == "GET":
        kode_barang = request.args.get("kode_barang")
        if not kode_barang:
            return "Kode barang tidak ditemukan", 400

        cursor.execute("SELECT * FROM penemuan WHERE kode_barang = %s", (kode_barang,))
        laporan = cursor.fetchone()

        if not laporan:
            cursor.close()
            conn.close()
            return "Data barang tidak ditemukan", 404

        cursor.close()
        conn.close()
        return render_template('tambah_klaim_penemuan.html', laporan=laporan)

    # ===== POST METHOD =====
    nama_pelapor = request.form.get("nama", "").strip()
    no_telp = request.form.get("telp", "").strip()
    email = request.form.get("email", "").strip()
    deskripsi_khusus = request.form.get("deskripsiKhusus", "").strip()
    kode_barang = request.form.get("kodeBarang", "").strip()
    kode_laporan_kehilangan = request.form.get("kodeLaporanKehilangan", "").strip() or None

    tanggal_lapor = datetime.now().strftime("%Y-%m-%d")
    waktu_lapor = datetime.now().strftime("%H:%M")

    # Ambil nama_barang dari tabel penemuan
    cursor.execute("SELECT nama_barang FROM penemuan WHERE kode_barang = %s", (kode_barang,))
    barang = cursor.fetchone()
    if not barang:
        flash("Nama barang tidak ditemukan di database.", "danger")
        cursor.close()
        conn.close()
        return redirect(request.url)
    nama_barang = barang['nama_barang']

    # Generate kode klaim otomatis
    kode_baru = generate_kode_klaim(cursor)

    # ===== Fungsi simpan file =====
    def allowed_file(filename):
        return filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))

    def simpan_file(file_obj, folder='static/uploads'):
        if file_obj and allowed_file(file_obj.filename):
            os.makedirs(folder, exist_ok=True)
            filename = f"{int(time.time())}_{file_obj.filename}"
            file_obj.save(os.path.join(folder, filename))
            return filename
        return None

    path_identitas = simpan_file(request.files.get("foto_identitas"))
    path_foto = simpan_file(request.files.get("foto_barang"))
    path_bukti = simpan_file(request.files.get("bukti_laporan"))

    if not (nama_pelapor and no_telp and email and deskripsi_khusus and kode_barang and path_identitas and path_foto):
        flash("Data belum lengkap atau file tidak valid.", "warning")
        cursor.close()
        conn.close()
        return redirect(request.url)

    try:
        cursor.execute("""
            INSERT INTO klaim_barang (
                kode_laporan, kode_barang, kode_laporan_kehilangan,
                nama_barang, nama_pelapor, no_telp, email,
                deskripsi_khusus, identitas_diri, bukti_laporan, foto_barang,
                tanggal_lapor, waktu_lapor
            ) 
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            kode_baru, kode_barang, kode_laporan_kehilangan,
            nama_barang, nama_pelapor, no_telp, email,
            deskripsi_khusus, path_identitas, path_bukti, path_foto,
            tanggal_lapor, waktu_lapor
        ))
        conn.commit()
        flash("Klaim berhasil dikirim!", "success")
    except Exception as e:
        conn.rollback()
        flash(f"Error insert ke database: {e}", "danger")
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('admin_bp.daftar_klaim_penemuan'))

# ================== EDIT PENEMUAN ====================
@admin_bp.route('/penemuan/edit', methods=['GET', 'POST'])
def edit_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode = request.args.get('kode')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # ========== GET (TAMPILKAN FORM EDIT) ==========
    if request.method == 'GET':
        cursor.execute("SELECT * FROM penemuan WHERE kode_barang=%s", (kode,))
        laporan = cursor.fetchone()
        conn.close()

        if not laporan:
            return "Data tidak ditemukan", 404

        return render_template(
            'edit_penemuan.html',
            laporan=laporan,
            role=session.get('role')
        )

    # ========== POST (UPDATE DATA) ==========
    nama_pelapor = request.form['nama_pelapor']
    no_telp = request.form['no_telp']
    email = request.form['email']
    nama_barang = request.form['nama_barang']
    kategori = request.form['kategori']
    lokasi = request.form['lokasi']
    deskripsi = request.form['deskripsi']
    status = request.form['status']

    # ⭐ Tambahan field baru
    jenis_barang = request.form['jenis_barang']

    update_terakhir = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE penemuan
        SET nama_pelapor=%s, no_telp=%s, email=%s,
            nama_barang=%s, kategori=%s, lokasi=%s,
            deskripsi=%s, status=%s, jenis_barang=%s,
            update_terakhir=%s
        WHERE kode_barang=%s
    """, (
        nama_pelapor, no_telp, email,
        nama_barang, kategori, lokasi,
        deskripsi, status, jenis_barang,
        update_terakhir, kode
    ))

    conn.commit()
    conn.close()

    return redirect(url_for('admin_bp.daftar_penemuan'))

# ================== HAPUS PENEMUAN ===================
@admin_bp.route('/penemuan/hapus', methods=['POST'])
def hapus_penemuan():
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    kode = data.get('kode')

    if not kode:
        return jsonify({"success": False, "message": "Kode tidak ditemukan"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Hapus foto jika ada
        cursor.execute("SELECT gambar_barang FROM penemuan WHERE kode_barang=%s", (kode,))
        result = cursor.fetchone()
        if result and result[0]:
            foto_path = os.path.join('static_admin', 'upload', result[0])
            if os.path.exists(foto_path):
                os.remove(foto_path)

        # Hapus dari database
        cursor.execute("DELETE FROM penemuan WHERE kode_barang=%s", (kode,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Kode tidak ditemukan"}), 404

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
        
@admin_bp.route("/api/penemuan/verify", methods=["POST"])
def verify_barang():
    try:
        data = request.get_json()
        kode = data.get("kode")

        if not kode:
            return jsonify({"success": False, "message": "Kode kosong"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            UPDATE penemuan
            SET status = 'Verifikasi',
                update_terakhir = NOW()
            WHERE kode_barang = %s
        """
        cursor.execute(query, (kode,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Kode tidak ditemukan"}), 404

        return jsonify({"success": True, "message": "Berhasil diverifikasi"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass
  
# ======================
# LIST KLAIM
# ======================
@admin_bp.route('/penemuan/klaim')
def daftar_klaim_penemuan():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            k.id,
            k.kode_laporan AS kode_klaim,
            k.kode_barang,
            k.nama_pelapor,
            p.nama_barang,
            k.status
        FROM klaim_barang k
        LEFT JOIN penemuan p ON k.kode_barang = p.kode_barang
        ORDER BY k.id DESC
    """)

    data_klaim = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template("admin/klaim_penemuan.html", data_klaim=data_klaim)

# ======================
# UPDATE STATUS KLAIM
# ======================
@admin_bp.route('/penemuan/klaim/update_status', methods=['POST'])
def update_status_klaim():
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    kode = data.get("kode_laporan")       # FIX → kode laporan klaim
    status_baru = data.get("status")      # FIX → status baru

    if not kode or not status_baru:
        return jsonify({"success": False, "message": "Data tidak lengkap"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Update status klaim
    cursor.execute("""
        UPDATE klaim_barang
        SET status = %s,
            update_terakhir = NOW()
        WHERE kode_laporan = %s
    """, (status_baru, kode))
    conn.commit()

    # 🔥 Jika status berubah jadi SELESAI → pindahkan ke arsip
    if status_baru == "Selesai":
        try:
            pindahkan_ke_arsip(kode, "klaim_barang")
        except Exception as e:
            print("❌ Error memindahkan klaim ke arsip:", str(e))

    cursor.close()
    conn.close()

    return jsonify({"success": True})

# ======================
# HALAMAN HTML DETAIL (TANPA JSON)
# ======================
@admin_bp.route('/penemuan/klaim/detail/<kode_klaim>')
def detail_klaim_penemuan(kode_klaim):
    return render_template("admin/detail_klaim_penemuan.html", kode_klaim=kode_klaim)


@admin_bp.route('/penemuan/klaim/api')
def detail_klaim_penemuan_api():
    kode = request.args.get("kode")
    if not kode:
        return jsonify({"success": False, "message": "Kode kosong"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            k.*,
            k.kode_laporan_kehilangan,
            p.nama_barang,
            p.kategori,
            p.lokasi,
            p.gambar_barang AS foto_barang
        FROM klaim_barang k
        LEFT JOIN penemuan p ON k.kode_barang = p.kode_barang
        WHERE k.kode_laporan = %s
        LIMIT 1
    """, (kode,))
    
    data = cursor.fetchone()
    cursor.close()
    conn.close()

    if not data:
        return jsonify({"success": False, "message": "Data tidak ditemukan"}), 404
    
    if data["update_terakhir"]:
        data["update_terakhir"] = data["update_terakhir"].strftime("%Y-%m-%d %H:%M")

    return jsonify({"success": True, "data": data})

# ======================
# UPDATE KLAIM
# ======================
@admin_bp.route('/penemuan/klaim/update', methods=['POST'])
def update_klaim_penemuan():
    data = request.get_json()
    kode = data["kode_laporan"]
    status = data["status"]
    catatan = data["catatan_admin"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE klaim_barang
        SET status = %s,
            catatan_admin = %s,
            update_terakhir = NOW()
        WHERE kode_laporan = %s
    """, (status, catatan, kode))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True})

# ======================
# 📁 ARSIP 
# ======================
@admin_bp.route('/arsip')
def arsip():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="lostfound"
    )
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM arsip ORDER BY tanggal_arsip DESC")
    data_arsip = cur.fetchall()

    cur.close()
    db.close()

    return render_template('arsip.html', role=session.get('role'), data_arsip=data_arsip)

def pindahkan_ke_arsip(kode, jenis_tabel):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    # ============================
    # Ambil data sesuai tabel asal
    # ============================
    if jenis_tabel.lower() == "kehilangan":
        cur.execute("SELECT * FROM kehilangan WHERE kode_kehilangan=%s", (kode,))
    elif jenis_tabel.lower() == "penemuan":
        cur.execute("SELECT * FROM penemuan WHERE kode_barang=%s", (kode,))
    else:  # klaim barang
        cur.execute("SELECT * FROM klaim_barang WHERE kode_laporan=%s", (kode,))

    data = cur.fetchone()
    if not data:
        cur.close()
        db.close()
        return False

    # ============================
    # Tentukan tanggal utama
    # ============================
    if jenis_tabel.lower() == "kehilangan":
        tanggal = data.get("tanggal_kehilangan")
    else:  # penemuan atau klaim barang
        tanggal = data.get("tanggal_lapor")
 
    # Ambil waktu sekarang tanpa detik
    tanggal_arsip = datetime.now().replace(second=0, microsecond=0)

    cur.execute("""
        INSERT INTO arsip 
        (kode, nama_barang, jenis, kategori, lokasi, tanggal, foto, 
        nama_pelapor, no_telp, email, status, tanggal_arsip)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        kode,
        data.get("nama_barang"),
        jenis_tabel,
        data.get("kategori"),
        data.get("lokasi") or data.get("lokasi_kehilangan"),
        tanggal,
        data.get("foto"),
        data.get("nama_pelapor") or data.get("nama") or '-',
        data.get("no_telp") or data.get("telp") or '-',
        data.get("email") or '-',
        data.get("status") or 'Selesai',
        tanggal_arsip  # simpan tanpa detik
    ))

    # ============================
    # Hapus dari tabel asal
    # ============================
    if jenis_tabel.lower() == "kehilangan":
        cur.execute("DELETE FROM kehilangan WHERE kode_kehilangan=%s", (kode,))
    elif jenis_tabel.lower() == "penemuan":
        cur.execute("DELETE FROM penemuan WHERE kode_barang=%s", (kode,))
    else:
        cur.execute("DELETE FROM klaim_barang WHERE kode_laporan=%s", (kode,))

    db.commit()
    cur.close()
    db.close()

    return True

@admin_bp.route('/arsip/detail')
def detail_arsip():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode = request.args.get('kode')
    if not kode:
        return redirect(url_for('admin_bp.arsip'))

    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="lostfound"
    )
    cur = db.cursor(dictionary=True)

    # Ambil data arsip dulu
    cur.execute("SELECT * FROM arsip WHERE kode=%s", (kode,))
    arsip_data = cur.fetchone()

    if not arsip_data:
        flash("Data arsip tidak ditemukan.", "danger")
        cur.close()
        db.close()
        return redirect(url_for('admin_bp.arsip'))

    jenis_laporan = arsip_data.get("jenis")
    data = None

    # Ambil detail lengkap dari tabel asal
    if jenis_laporan.lower() == "kehilangan":
        cur.execute("SELECT * FROM kehilangan WHERE kode_kehilangan=%s", (kode,))
        data = cur.fetchone()
    elif jenis_laporan.lower() == "penemuan":
        cur.execute("SELECT * FROM penemuan WHERE kode_barang=%s", (kode,))
        data = cur.fetchone()
    elif jenis_laporan.lower() == "klaim barang":
        cur.execute("SELECT * FROM klaim_barang WHERE kode_laporan=%s", (kode,))
        data = cur.fetchone()

    # Jika data asli sudah tidak ada (misal dihapus), fallback ke arsip
    if not data:
        data = arsip_data

    cur.close()
    db.close()

    return render_template(
        'detail_arsip.html',
        data=data,
        jenis_laporan=jenis_laporan
    )
    

def generate_kode_kehilangan(cursor):
    cursor.execute("SELECT kode_kehilangan FROM kehilangan")
    main_codes = [row[0] for row in cursor.fetchall() if row[0]]
    cursor.execute("SELECT kode FROM arsip WHERE jenis='kehilangan'")
    archive_codes = [row[0] for row in cursor.fetchall() if row[0]]
    all_codes = main_codes + archive_codes
    if not all_codes:
        return "LF-L001"
    max_num = max(int(re.search(r"LF-L(\d+)", code).group(1)) for code in all_codes if re.search(r"LF-L(\d+)", code))
    return f"LF-L{max_num+1:03d}"


def generate_kode_penemuan(cursor):
    # Ambil dari tabel penemuan
    cursor.execute("SELECT kode_barang FROM penemuan")
    main_codes = [row['kode_barang'] for row in cursor.fetchall() if row['kode_barang']]

    # Ambil dari tabel arsip (jenis penemuan)
    cursor.execute("SELECT kode FROM arsip WHERE jenis='penemuan'")
    archive_codes = [row['kode'] for row in cursor.fetchall() if row['kode']]

    all_codes = main_codes + archive_codes
    if not all_codes:
        return "LF-F001"

    max_num = max(int(re.search(r"LF-F(\d+)", code).group(1)) 
                  for code in all_codes if re.search(r"LF-F(\d+)", code))
    return f"LF-F{max_num+1:03d}"

def generate_kode_klaim(cursor):
    import re

    # Ambil kode dari tabel klaim_barang
    cursor.execute("SELECT kode_laporan FROM klaim_barang")
    main_codes = [row['kode_laporan'] for row in cursor.fetchall() if row['kode_laporan']]

    # Ambil kode dari arsip untuk klaim
    cursor.execute("SELECT kode FROM arsip WHERE jenis IN ('klaim', 'klaim barang')")
    archive_codes = [row['kode'] for row in cursor.fetchall() if row['kode']]

    all_codes = main_codes + archive_codes

    # Ambil semua nomor valid
    numbers = [int(re.search(r"LF-C(\d+)", code).group(1))
               for code in all_codes if re.search(r"LF-C(\d+)", code)]

    if not numbers:
        return "LF-C001"  # default kalau belum ada kode sama sekali

    max_num = max(numbers)
    return f"LF-C{max_num + 1:03d}"

# ============================
# 🔐 PENGATURAN PROFILE ADMIN
# ============================
@admin_bp.route('/pengaturan')
def pengaturan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    admin_id = session.get('admin_id')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM admin WHERE id = %s", (admin_id,))
    admin_data = cursor.fetchone()
    cursor.close()
    conn.close()

    return render_template(
        'pengaturan.html',
        admin=admin_data,
        role=session.get('role')   # 🔥 penting
    )


@admin_bp.route('/pengaturan/update', methods=['POST'])
def update_profile():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    admin_id = session.get('admin_id')
    full_name = request.form['full_name']
    email = request.form['email']
    phone = request.form['phone']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE admin 
        SET full_name=%s, email=%s, phone=%s 
        WHERE id=%s
    """, (full_name, email, phone, admin_id))

    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for('admin_bp.pengaturan', updated=1))

@admin_bp.route('/pengaturan/upload-photo', methods=['POST'])
def upload_photo():
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Silahkan login terlebih dahulu"}), 401

    file = request.files.get('photo')
    if not file:
        return jsonify({"status": "error", "message": "File tidak ditemukan"}), 400

    filename = secure_filename(file.filename)
    # pastikan folder static_admin/upload ada
    upload_folder = os.path.join(current_app.root_path, 'static_admin', 'upload')
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, filename))

    # simpan nama file di DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE admin SET photo=%s WHERE id=%s", (filename, session['admin_id']))
    conn.commit()
    cursor.close()
    conn.close()

    # kembalikan response JSON agar JS bisa menampilkan notif
    return jsonify({"status": "success", "message": "Foto profil diperbarui!", "filename": filename})

# ============================
# 🔐 SUPER ADMIN CHECK
# ============================
def is_super_admin():
    return session.get('role') == 'super_admin'


# ============================
# 📌 KELOLA ADMIN (Super Admin Only)
# ============================
@admin_bp.route('/kelola_admin')
def kelola_admin():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    if not is_super_admin():
        return "Anda tidak memiliki akses!", 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM admin ORDER BY id DESC")
    admins = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template(
        'kelola_admin.html',
        admins=admins,
        role=session.get('role')   # 🔥 penting untuk sidebar
    )


# ============================
# ➕ TAMBAH ADMIN
# ============================
@admin_bp.route('/kelola_admin/tambah', methods=['GET', 'POST'])
def tambah_admin():
    if not is_super_admin():
        return "Anda tidak memiliki akses!", 403

    if request.method == 'GET':
        return render_template('tambah_admin.html', role=session.get('role'))

    full_name = request.form['full_name']
    email = request.form['email']
    phone = request.form.get('phone')
    password = request.form['password']
    role_ = request.form['role']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO admin (full_name, email, phone, password, role)
        VALUES (%s, %s, %s, %s, %s)
    """, (full_name, email, phone, password, role_))
    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for('admin_bp.kelola_admin'))


# ============================
# ✏ EDIT ADMIN
# ============================
@admin_bp.route('/kelola_admin/edit/<int:id>', methods=['GET', 'POST'])
def edit_admin(id):
    if not is_super_admin():
        return "Anda tidak memiliki akses!", 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request.method == 'GET':
        cursor.execute("SELECT * FROM admin WHERE id=%s", (id,))
        admin_data = cursor.fetchone()
        cursor.close()
        conn.close()

        return render_template(
            'edit_admin.html',
            admin=admin_data,
            role=session.get('role')
        )

    full_name = request.form['full_name']
    email = request.form['email']
    phone = request.form.get('phone')
    role_ = request.form['role']

    cursor.execute("""
        UPDATE admin SET full_name=%s, email=%s, phone=%s, role=%s
        WHERE id=%s
    """, (full_name, email, phone, role_, id))

    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for('admin_bp.kelola_admin'))


# ============================
# 🗑 DELETE ADMIN
# ============================
@admin_bp.route('/kelola_admin/delete/<int:id>')
def delete_admin(id):
    if not is_super_admin():
        return "Anda tidak memiliki akses!", 403

    if id == session.get('admin_id'):
        return "Tidak bisa menghapus diri sendiri!", 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM admin WHERE id=%s", (id,))
    conn.commit()
    cursor.close()
    conn.close()

    return redirect(url_for('admin_bp.kelola_admin'))

@admin_bp.route('/pengaturan/ganti-password', methods=['GET', 'POST'])
def ganti_password():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    if request.method == 'POST':
        admin_id = session.get('admin_id')
        old_pw = request.form.get('old_password')
        new_pw = request.form.get('new_password')
        confirm_pw = request.form.get('confirm_password')

        if new_pw != confirm_pw:
            return jsonify({"status": "error", "message": "Konfirmasi password tidak cocok!"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT password FROM admin WHERE id=%s", (admin_id,))
        data = cursor.fetchone()

        if not data or data['password'] != old_pw:
            cursor.close()
            conn.close()
            return jsonify({"status": "error", "message": "Password lama salah!"}), 400

        cursor.execute("UPDATE admin SET password=%s WHERE id=%s", (new_pw, admin_id))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": "Password berhasil diperbarui!"})

    # Jika GET, render halaman form
    return render_template('admin/ganti_password.html')

# ======================
# 🚪 LOGOUT
# ======================
@admin_bp.route('/logout')
def logout_admin():
    session.clear()
    return redirect(url_for('admin_bp.login_admin'))

from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, flash 
import mysql.connector
from datetime import datetime
import os

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

# ======================
# 🔐 LOGIN ADMIN & SUPER ADMIN
# ======================
@admin_bp.route('/login', methods=['GET', 'POST'])
def login_admin():
    if request.method == 'GET':
        return render_template('index.html')

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM admin WHERE email=%s AND password=%s", (email, password))
    admin = cursor.fetchone()
    conn.close()

    if admin:
        session['admin_logged_in'] = True
        session['admin_email'] = email
        session['role'] = admin['role']
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
        upload_folder = os.path.join('static_admin', 'upload')
        os.makedirs(upload_folder, exist_ok=True)
        foto_filename = foto.filename
        foto.save(os.path.join(upload_folder, foto_filename))

    # Waktu submit
    now = datetime.now()
    tanggal_submit = now.strftime("%Y-%m-%d")
    waktu_submit = now.strftime("%H:%M:%S")
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

    # Cegah input kosong
    if not kode or not status:
        return jsonify({'success': False, 'message': 'Data tidak lengkap!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Update hanya kolom status dan update_terakhir
    waktu_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        UPDATE kehilangan 
        SET status = %s, update_terakhir = %s
        WHERE kode_kehilangan = %s
    """, (status, waktu_update, kode))
    conn.commit()

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

# ============ SATU ROUTE TAMBAH PENEMUAN ============
@admin_bp.route('/penemuan/tambah', methods=['GET', 'POST'])
def tambah_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    if request.method == 'GET':
        return render_template('tambah_penemuan.html', role=session.get('role'))

    # Ambil data dari form
    nama_pelapor = request.form['nama_pelapor']
    no_telp = request.form['no_telp']
    email = request.form['email']
    nama_barang = request.form['nama_barang']
    kategori = request.form['kategori']
    lokasi = request.form['lokasi']
    deskripsi = request.form['deskripsi']
    tanggal_lapor = request.form['tanggal_lapor']
    jenis_barang = request.form['jenis_barang']

    # Upload foto
    foto = request.files.get('foto')
    foto_filename = None
    if foto and foto.filename:
        upload_folder = os.path.join('static_admin', 'upload')
        os.makedirs(upload_folder, exist_ok=True)
        foto_filename = foto.filename
        foto.save(os.path.join(upload_folder, foto_filename))

    # Simpan ke DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO penemuan (
            nama_pelapor, no_telp, email, nama_barang,
            kategori, lokasi, deskripsi, tanggal_lapor,
            jenis_barang, gambar_barang
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        nama_pelapor, no_telp, email, nama_barang,
        kategori, lokasi, deskripsi, tanggal_lapor,
        jenis_barang, foto_filename
    ))
    conn.commit()
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

# ================== EDIT PENEMUAN ====================
@admin_bp.route('/penemuan/edit', methods=['GET', 'POST'])
def edit_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode = request.args.get('kode')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request.method == 'GET':
        cursor.execute("SELECT * FROM penemuan WHERE kode_barang=%s", (kode,))
        laporan = cursor.fetchone()
        conn.close()
        if not laporan:
            return "Data tidak ditemukan", 404
        return render_template('edit_penemuan.html', laporan=laporan, role=session.get('role'))

    # POST
    nama_pelapor = request.form['nama_pelapor']
    no_telp = request.form['no_telp']
    email = request.form['email']
    nama_barang = request.form['nama_barang']
    kategori = request.form['kategori']
    lokasi = request.form['lokasi']
    deskripsi = request.form['deskripsi']
    status = request.form['status']
    update_terakhir = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE penemuan
        SET nama_pelapor=%s, no_telp=%s, email=%s,
            nama_barang=%s, kategori=%s, lokasi=%s,
            deskripsi=%s, status=%s, update_terakhir=%s
        WHERE kode_barang=%s
    """, (
        nama_pelapor, no_telp, email,
        nama_barang, kategori, lokasi,
        deskripsi, status, update_terakhir,
        kode
    ))
    conn.commit()
    conn.close()

    return redirect(url_for('admin_bp.daftar_penemuan'))

# ================== KLAIM PENEMUAN ===================
@admin_bp.route('/penemuan/klaim')
def klaim_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT kode_barang AS kode, nama_barang, status
        FROM penemuan
        WHERE status IN ('Pending', 'Verifikasi')
        ORDER BY tanggal_lapor DESC
    """)
    barang_klaim = cursor.fetchall()
    conn.close()

    return render_template('klaim_penemuan.html', barang_klaim=barang_klaim, role=session.get('role'))

# ======================
# 📁 ARSIP & PENGATURAN
# ======================
@admin_bp.route('/arsip')
def arsip():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('arsip.html', role=session.get('role'))

@admin_bp.route('/arsip/detail')
def detail_arsip():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    kode = request.args.get('kode')
    return render_template('detail_arsip.html', kode=kode, role=session.get('role'))

@admin_bp.route('/pengaturan')
def pengaturan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('pengaturan.html', role=session.get('role'))

@admin_bp.route('/pengaturan/ganti-password')
def ganti_password():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('ganti_password.html', role=session.get('role'))

# ======================
# 🚪 LOGOUT
# ======================
@admin_bp.route('/logout')
def logout_admin():
    session.clear()
    return redirect(url_for('admin_bp.login_admin'))

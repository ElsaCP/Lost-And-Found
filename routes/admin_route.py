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
# ➕ TAMBAH KEHILANGAN
# ======================
@admin_bp.route('/kehilangan/tambah', methods=['GET', 'POST'])
def tambah_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    if request.method == 'GET':
        return render_template('tambah_kehilangan.html', role=session.get('role'))

    nama_pelapor = request.form['nama_pelapor']
    email = request.form['email']
    no_telp = request.form['no_telp']
    nama_barang = request.form['nama_barang']
    kategori = request.form['kategori']
    jenis_laporan = 'Kehilangan'
    deskripsi = request.form['deskripsi']
    lokasi = request.form['lokasi']
    tanggal_lapor = datetime.now().date()
    status = 'Pending'
    foto = request.files.get('foto')

    foto_filename = None
    if foto:
        foto_filename = foto.filename
        foto.save(os.path.join('static_admin/upload', foto_filename))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO kehilangan 
        (kode, nama_pelapor, email, no_telp, nama_barang, kategori, jenis_laporan, deskripsi, lokasi, tanggal_submit, tanggal_lapor, update_terakhir, status, foto)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        f"LF-{int(datetime.now().timestamp())}", nama_pelapor, email, no_telp,
        nama_barang, kategori, jenis_laporan, deskripsi, lokasi,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),  # 🕓 Tanggal Submit User
        tanggal_lapor, tanggal_lapor, status, foto_filename
    ))
    conn.commit()
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
        WHERE kode = %s
    """, (status, waktu_update, kode))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Status berhasil diperbarui!',
        'update_terakhir': waktu_update
    })

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
        cursor.close()
        conn.close()

        if not laporan:
            return "Data tidak ditemukan", 404

        # ---- Format tanggal_submit agar tampil di halaman edit ----
        from datetime import datetime
        tanggal_submit = laporan.get('tanggal_submit')

        if tanggal_submit:
            try:
                if isinstance(tanggal_submit, str):
                    try:
                        dt_submit = datetime.strptime(tanggal_submit, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        dt_submit = datetime.strptime(tanggal_submit, "%Y-%m-%d %H:%M")
                else:
                    dt_submit = tanggal_submit

                laporan['tanggal_submit_formatted'] = dt_submit.strftime("%d/%m/%Y %H:%M")
            except Exception as e:
                print("❌ Gagal format tanggal_submit:", e)
                laporan['tanggal_submit_formatted'] = "-"
        else:
            laporan['tanggal_submit_formatted'] = "-"

        return render_template('edit_kehilangan.html', laporan=laporan, role=session.get('role'))

    # === MODE POST ===
    elif request.method == 'POST':
        try:
            nama_pelapor = request.form['nama_pelapor']
            no_telp = request.form['no_telp']
            nama_barang = request.form['nama_barang']
            deskripsi = request.form['deskripsi']
            terminal = request.form['terminal']
            tempat = request.form['tempat']
            lokasi_lain = request.form.get('lokasi_lain', '')
            lokasi = request.form['lokasi']
            update_terakhir = request.form['update_terakhir']

            cursor.execute("""
                UPDATE kehilangan
                SET nama_pelapor=%s,
                    no_telp=%s,
                    nama_barang=%s,
                    deskripsi=%s,
                    terminal=%s,
                    tempat=%s,
                    lokasi_lain=%s,
                    lokasi=%s,
                    update_terakhir=%s
                WHERE kode_kehilangan=%s
            """, (nama_pelapor, no_telp, nama_barang, deskripsi,
                  terminal, tempat, lokasi_lain, lokasi, update_terakhir, kode_kehilangan))

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
    return render_template('daftar_penemuan.html', role=session.get('role'))

@admin_bp.route('/penemuan/tambah')
def tambah_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('tambah_penemuan.html', role=session.get('role'))

@admin_bp.route('/penemuan/detail')
def detail_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('detail_penemuan.html', role=session.get('role'))

@admin_bp.route('/penemuan/edit')
def edit_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('edit_penemuan.html', role=session.get('role'))

@admin_bp.route('/penemuan/klaim')
def klaim_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('klaim_penemuan.html', role=session.get('role'))

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

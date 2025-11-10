from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session

admin_bp = Blueprint(
    'admin_bp',
    __name__,
    static_folder='../static_admin',
    static_url_path='/static_admin',
    template_folder='../templates/admin'
)

# ======================
# ROUTE: HALAMAN LOGIN
# ======================
@admin_bp.route('/login', methods=['GET', 'POST'])
def login_admin():
    if request.method == 'GET':
        return render_template('index.html')

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    valid_email = 'admin@gmail.com'
    valid_password = 'admin123'

    if email == valid_email and password == valid_password:
        session['admin_logged_in'] = True
        session['admin_email'] = email
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Email atau password salah!'})

# ======================
# ROUTE: LUPA PASSWORD
# ======================
@admin_bp.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'GET':
        return render_template('forgot_password.html')

    # Ambil data JSON dari fetch()
    data = request.get_json()
    email = data.get('email') if data else None

    registered_email = 'admin@gmail.com'

    if email == registered_email:
        return jsonify({
            'success': True,
            'message': 'Link reset password telah dikirim ke email Anda!'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Email tidak terdaftar!'
        })


# ======================
# ROUTE: BERANDA ADMIN
# ======================
@admin_bp.route('/beranda')
def beranda_admin():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('beranda.html')

# ======================
# ROUTE: DAFTAR KEHILANGAN
# ======================
@admin_bp.route('/kehilangan/daftar')
def daftar_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('daftar_kehilangan.html')

@admin_bp.route('/kehilangan/tambah')
def tambah_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('tambah_kehilangan.html')

@admin_bp.route('/kehilangan/detail')
def detail_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('detail_kehilangan.html')

@admin_bp.route('/kehilangan/edit')
def edit_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('edit_kehilangan.html')

# ======================
# ROUTE: PENEMUAN
# ======================
@admin_bp.route('/penemuan/daftar')
def daftar_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('daftar_penemuan.html')

@admin_bp.route('/penemuan/tambah')
def tambah_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('tambah_penemuan.html')

@admin_bp.route('/penemuan/klaim')
def klaim_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('klaim_penemuan.html')

# ======================
# ROUTE: SIMPAN PENEMUAN
# ======================
@admin_bp.route('/penemuan/simpan', methods=['POST'])
def simpan_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    # Ambil data dari form
    nama_barang = request.form.get('nama_barang')
    lokasi = request.form.get('lokasi')
    tanggal = request.form.get('tanggal')
    deskripsi = request.form.get('deskripsi')
    foto = request.files.get('foto')

    # Kamu bisa tambah logika penyimpanan ke database di sini
    # Contoh sederhana (sementara print ke console):
    print(f"Nama barang: {nama_barang}")
    print(f"Lokasi: {lokasi}")
    print(f"Tanggal: {tanggal}")
    print(f"Deskripsi: {deskripsi}")
    print(f"Foto: {foto.filename if foto else 'tidak ada'}")

    # Setelah tersimpan, arahkan balik ke daftar_penemuan
    return redirect(url_for('admin_bp.daftar_penemuan'))


# ======================
# ROUTE: ARSIP & PENGATURAN
# ======================
@admin_bp.route('/arsip')
def arsip():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('arsip.html')

from flask import request

@admin_bp.route('/arsip/detail')
def detail_arsip():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode = request.args.get('kode')  # ambil kode dari URL query (?kode=LF-L001)
    return render_template('detail_arsip.html', kode=kode)

@admin_bp.route('/pengaturan')
def pengaturan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('pengaturan.html')

@admin_bp.route('/pengaturan/ganti-password')
def ganti_password():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('ganti_password.html')



# ======================
# ROUTE: LOGOUT ADMIN
# ======================
@admin_bp.route('/logout')
def logout_admin():
    session.pop('admin_logged_in', None)
    session.pop('admin_email', None)
    return redirect(url_for('admin_bp.login_admin'))

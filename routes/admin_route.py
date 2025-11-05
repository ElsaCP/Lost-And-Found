from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session

# Inisialisasi Blueprint admin
admin_bp = Blueprint(
    'admin_bp',
    __name__,
    static_folder='../static_admin',      # folder static admin
    static_url_path='/static_admin',      # URL untuk akses file statis
    template_folder='../templates/admin'  # template untuk halaman admin
)


# ======================
# ROUTE: HALAMAN LOGIN
# ======================
@admin_bp.route('/login', methods=['GET', 'POST'])
def login_admin():
    if request.method == 'GET':
        # tampilkan halaman login
        return render_template('indexx.html')

    # === HANDLE POST REQUEST dari fetch (JS) ===
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Dummy akun login (sementara)
    valid_email = 'admin@gmail.com'
    valid_password = 'admin123'

    # Validasi data
    if email == valid_email and password == valid_password:
        # simpan session login
        session['admin_logged_in'] = True
        session['admin_email'] = email
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Email atau password salah!'})


# ======================
# ROUTE: BERANDA ADMIN
# ======================
@admin_bp.route('/beranda')
def beranda_admin():
    # cek apakah sudah login
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))
    return render_template('beranda.html')


# ======================
# ROUTE: LOGOUT ADMIN
# ======================
@admin_bp.route('/logout')
def logout_admin():
    session.pop('admin_logged_in', None)
    session.pop('admin_email', None)
    return redirect(url_for('admin_bp.login_admin'))

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
# ROUTE: LOGOUT ADMIN
# ======================
@admin_bp.route('/logout')
def logout_admin():
    session.pop('admin_logged_in', None)
    session.pop('admin_email', None)
    return redirect(url_for('admin_bp.login_admin'))

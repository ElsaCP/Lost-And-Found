# routes/admin_route.py
from flask import Blueprint, render_template

admin_bp = Blueprint(
    'admin_bp',
    __name__,
    static_folder='../static_admin',      # folder static admin
    static_url_path='/static_admin',      # URL untuk akses file statis
    template_folder='../templates/admin'  # template untuk halaman admin
)

@admin_bp.route('/login')
def login_admin():
    return render_template('indexx.html')  # sesuaikan nama file html admin

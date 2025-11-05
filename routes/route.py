# routes/route.py
from flask import Blueprint, render_template

# Inisialisasi blueprint
main = Blueprint('main', __name__)

# Halaman utama
@main.route('/')
def home():
    return render_template('user/indexx.html')

# Halaman cari barang
@main.route('/cari-Barang')
def caribarang():
    return render_template('user/cari_barang.html')

<<<<<<< HEAD
# Halaman form kehilangan
@main.route('/form-kehilangan')
def form_kehilangan():
    return render_template('user/form_kehilangan.html')
=======
@main.route('/')
def login():
    return render_template('admin/index.html')
>>>>>>> 860350ab458620531736395f0668595d74d02456

# Halaman cek laporan
@main.route('/cek-laporan')
def cek_laporan():
    return render_template('user/cek_laporan.html')

# Halaman detail barang (parameter id)
@main.route('/detail-barang/<id>')
def detail_barang(id):
    return render_template('user/detail_barang.html', barang_id=id)
# routes/route.py
from flask import Blueprint, render_template

# Inisialisasi blueprint
main = Blueprint('main', __name__)

@main.route('/')
def home():
    return render_template('user/indexx.html')

@main.route('/cari-Barang')
def caribarang():
    return render_template('user/cari_barang.html')




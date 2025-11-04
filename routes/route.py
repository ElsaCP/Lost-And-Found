# routes/route.py
from flask import Blueprint, render_template

# Inisialisasi blueprint
main = Blueprint('main', __name__)

@main.route('/')
def home():
    return render_template('indexx.html')

@main.route('/cari-Barang')
def caribarang():
    return render_template('cari_barang.html')

@main.route('/list-barang')
def listbarang():
    return render_template('indexx.html#listBarang')




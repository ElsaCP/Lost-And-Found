from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, flash, current_app
import mysql.connector
from datetime import datetime, timedelta
import os
import time
from werkzeug.utils import secure_filename
from flask import request
import re
from dateutil.relativedelta import relativedelta
from flask import send_file
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from openpyxl import Workbook
from flask_mail import Message
from extensions import mail
import io


admin_bp = Blueprint(
    'admin_bp',
    __name__,
    static_folder='../static_admin',
    static_url_path='/static_admin',
    template_folder='../templates/admin'
)

def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',         
        password='',         
        database='lostfound'  
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
        session['role'] = admin['role']  

        return jsonify({'success': True, 'role': admin['role']})
    else:
        return jsonify({'success': False, 'message': 'Email atau password salah!'})

@admin_bp.route('/beranda', endpoint='beranda_admin')
def beranda_admin():
    auto_arsip_laporan()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        (
            SELECT 
                id,
                kode_kehilangan AS kode,
                nama_barang,
                nama_pelapor,
                no_telp,
                email,
                lokasi,
                tanggal_kehilangan AS tanggal,
                status,
                update_terakhir,
                'kehilangan' AS jenis_laporan
            FROM kehilangan
        )

        UNION ALL

        (
            SELECT 
                id,
                kode_barang AS kode,
                nama_barang,
                nama_pelapor,
                no_telp,
                email,
                lokasi,
                tanggal_lapor AS tanggal,
                status,
                update_terakhir,
                'penemuan' AS jenis_laporan
            FROM penemuan
        )

        UNION ALL

        (
            SELECT 
                id,
                kode_laporan AS kode,
                nama_barang,
                nama_pelapor,
                no_telp,
                email,
                NULL AS lokasi,
                tanggal_lapor AS tanggal,
                status,
                update_terakhir,
                'klaim' AS jenis_laporan
            FROM klaim_barang
        )

        ORDER BY update_terakhir DESC
    """

    cursor.execute(query)
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template("admin/beranda.html", data=data)

def format_bulan_indonesia(bulan_str):
    bulan_map = {
        "01": "Januari", "02": "Februari", "03": "Maret",
        "04": "April", "05": "Mei", "06": "Juni",
        "07": "Juli", "08": "Agustus", "09": "September",
        "10": "Oktober", "11": "November", "12": "Desember"
    }

    tahun, bulan = bulan_str.split("-")
    return f"{bulan_map.get(bulan, bulan)} {tahun}"

@admin_bp.route('/export/pdf')
def export_pdf():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    bulan = request.args.get('bulan')  # format: YYYY-MM
    if not bulan:
        return "Bulan tidak valid", 400

    # 🔧 FORMAT BULAN UNTUK JUDUL & FILE
    bulan_label = format_bulan_indonesia(bulan)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        (
            SELECT 
                kode_kehilangan AS kode,
                nama_barang,
                'kehilangan' AS jenis,
                status,
                DATE_FORMAT(tanggal_kehilangan, '%d-%m-%Y') AS tanggal
            FROM kehilangan
            WHERE DATE_FORMAT(tanggal_kehilangan, '%Y-%m') = %s
        )
        UNION ALL
        (
            SELECT 
                kode_barang AS kode,
                nama_barang,
                'penemuan' AS jenis,
                status,
                DATE_FORMAT(tanggal_lapor, '%d-%m-%Y') AS tanggal
            FROM penemuan
            WHERE DATE_FORMAT(tanggal_lapor, '%Y-%m') = %s
        )
        UNION ALL
        (
            SELECT 
                kode_laporan AS kode,
                nama_barang,
                'klaim' AS jenis,
                status,
                DATE_FORMAT(tanggal_lapor, '%d-%m-%Y') AS tanggal
            FROM klaim_barang
            WHERE DATE_FORMAT(tanggal_lapor, '%Y-%m') = %s
        )
        ORDER BY tanggal ASC
    """

    cursor.execute(query, (bulan, bulan, bulan))
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()

    # 🔧 JUDUL PDF (SUDAH RAPI)
    elements = [
        Paragraph(f"<b>Rekapan Laporan Bulan {bulan_label}</b>", styles['Title'])
    ]

    table_data = [["Kode", "Nama Barang", "Jenis", "Status", "Tanggal"]]

    for d in data:
        table_data.append([
            d['kode'],
            d['nama_barang'],
            d['jenis'],
            d['status'],
            d['tanggal']
        ])

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))

    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        # 🔧 NAMA FILE PDF
        download_name=f"rekap_laporan_{bulan_label.replace(' ', '_').lower()}.pdf",
        mimetype="application/pdf"
    )

@admin_bp.route('/export/excel')
def export_excel():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    bulan = request.args.get('bulan')
    if not bulan:
        return "Bulan tidak valid", 400

    bulan_label = format_bulan_indonesia(bulan)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        (
            SELECT 
                kode_kehilangan AS kode,
                nama_barang,
                'kehilangan' AS jenis,
                status,
                tanggal_kehilangan AS tanggal
            FROM kehilangan
            WHERE DATE_FORMAT(tanggal_kehilangan, '%Y-%m') = %s
        )
        UNION ALL
        (
            SELECT 
                kode_barang AS kode,
                nama_barang,
                'penemuan' AS jenis,
                status,
                tanggal_lapor AS tanggal
            FROM penemuan
            WHERE DATE_FORMAT(tanggal_lapor, '%Y-%m') = %s
        )
        UNION ALL
        (
            SELECT 
                kode_laporan AS kode,
                nama_barang,
                'klaim' AS jenis,
                status,
                tanggal_lapor AS tanggal
            FROM klaim_barang
            WHERE DATE_FORMAT(tanggal_lapor, '%Y-%m') = %s
        )
        ORDER BY tanggal ASC
    """

    cursor.execute(query, (bulan, bulan, bulan))
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    wb = Workbook()
    ws = wb.active
    ws.title = "Rekap Laporan"

    ws.append(["Kode", "Nama Barang", "Jenis", "Status", "Tanggal"])

    for d in data:
        ws.append([
            d['kode'],
            d['nama_barang'],
            d['jenis'],
            d['status'],
            d['tanggal']
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name=f"rekap_laporan_{bulan_label.replace(' ', '_').lower()}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    
@admin_bp.route('/kehilangan/export/pdf')
def export_kehilangan_pdf():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    bulan = request.args.get('bulan')
    if not bulan:
        return "Bulan tidak valid", 400

    bulan_label = format_bulan_indonesia(bulan)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            kode_kehilangan AS kode,
            nama_barang,
            status,
            DATE_FORMAT(tanggal_submit, '%d-%m-%Y') AS tanggal
        FROM kehilangan
        WHERE DATE_FORMAT(tanggal_submit, '%Y-%m') = %s
        ORDER BY tanggal_submit ASC
    """, (bulan,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()

    # ✅ JUDUL FIX
    elements = [
        Paragraph(
            f"<b>Laporan Kehilangan Bulan {bulan_label}</b>",
            styles['Title']
        )
    ]

    # ✅ TAMBAH KOLOM JENIS LAPORAN
    table_data = [["Kode", "Nama Barang", "Jenis Laporan", "Status", "Tanggal"]]

    for d in data:
        table_data.append([
            d['kode'],
            d['nama_barang'],
            "Kehilangan",          # ⬅️ jenis laporan
            d['status'],
            d['tanggal']
        ])

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))

    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        # ✅ NAMA FILE FIX
        download_name=f"laporan_kehilangan_{bulan_label.replace(' ', '_').lower()}.pdf",
        mimetype="application/pdf"
    )

@admin_bp.route('/kehilangan/export/excel')
def export_kehilangan_excel():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    bulan = request.args.get('bulan')
    if not bulan:
        return "Bulan tidak valid", 400

    bulan_label = format_bulan_indonesia(bulan)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            kode_kehilangan AS kode,
            nama_barang,
            status,
            tanggal_submit AS tanggal
        FROM kehilangan
        WHERE DATE_FORMAT(tanggal_submit, '%Y-%m') = %s
        ORDER BY tanggal_submit ASC
    """, (bulan,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    wb = Workbook()
    ws = wb.active
    ws.title = "Laporan Kehilangan"

    # ✅ HEADER EXCEL
    ws.append(["Kode", "Nama Barang", "Jenis Laporan", "Status", "Tanggal"])

    for d in data:
        ws.append([
            d['kode'],
            d['nama_barang'],
            "Kehilangan",      # ⬅️ jenis laporan
            d['status'],
            d['tanggal']
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        # ✅ NAMA FILE FIX
        download_name=f"laporan_kehilangan_{bulan_label.replace(' ', '_').lower()}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@admin_bp.route('/penemuan/export/pdf')
def export_penemuan_pdf():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    bulan = request.args.get('bulan')
    if not bulan:
        return "Bulan tidak valid", 400

    bulan_label = format_bulan_indonesia(bulan)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            kode_barang AS kode,
            nama_barang,
            status,
            DATE_FORMAT(tanggal_lapor, '%d-%m-%Y') AS tanggal
        FROM penemuan
        WHERE DATE_FORMAT(tanggal_lapor, '%Y-%m') = %s
        ORDER BY tanggal_lapor ASC
    """, (bulan,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()

    elements = [
        Paragraph(
            f"<b>Laporan Penemuan Bulan {bulan_label}</b>",
            styles['Title']
        )
    ]

    # ✅ KOLOM JENIS LAPORAN
    table_data = [["Kode", "Nama Barang", "Jenis Laporan", "Status", "Tanggal"]]

    for d in data:
        table_data.append([
            d['kode'],
            d['nama_barang'],
            "Penemuan",
            d['status'],
            d['tanggal']
        ])

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))

    elements.append(table)
    doc.build(elements)

    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"laporan_penemuan_{bulan_label.replace(' ', '_').lower()}.pdf",
        mimetype="application/pdf"
    )

@admin_bp.route('/penemuan/export/excel')
def export_penemuan_excel():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    bulan = request.args.get('bulan')
    if not bulan:
        return "Bulan tidak valid", 400

    bulan_label = format_bulan_indonesia(bulan)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            kode_barang AS kode,
            nama_barang,
            status,
            tanggal_lapor AS tanggal
        FROM penemuan
        WHERE DATE_FORMAT(tanggal_lapor, '%Y-%m') = %s
        ORDER BY tanggal_lapor ASC
    """, (bulan,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()

    wb = Workbook()
    ws = wb.active
    ws.title = "Laporan Penemuan"

    ws.append(["Kode", "Nama Barang", "Jenis Laporan", "Status", "Tanggal"])

    for d in data:
        ws.append([
            d['kode'],
            d['nama_barang'],
            "Penemuan",
            d['status'],
            d['tanggal']
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name=f"laporan_penemuan_{bulan_label.replace(' ', '_').lower()}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@admin_bp.route('/beranda/hapus', methods=['POST'])
def hapus_laporan():
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    kode = data.get('kode')
    jenis = data.get('jenis')

    if not kode or not jenis:
        return jsonify({"success": False, "message": "Data tidak lengkap"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if jenis == "kehilangan":
            cursor.execute("DELETE FROM kehilangan WHERE kode_kehilangan=%s", (kode,))
        elif jenis == "penemuan":
            # Hapus foto terkait jika ada
            cursor.execute("SELECT gambar_barang FROM penemuan WHERE kode_barang=%s", (kode,))
            result = cursor.fetchone()
            if result and result[0]:
                foto_path = os.path.join('static_admin', 'upload', result[0])
                if os.path.exists(foto_path):
                    os.remove(foto_path)
            cursor.execute("DELETE FROM penemuan WHERE kode_barang=%s", (kode,))
        elif jenis == "klaim":
            cursor.execute("DELETE FROM klaim_barang WHERE kode_laporan=%s", (kode,))
        else:
            return jsonify({"success": False, "message": "Jenis laporan tidak dikenal"}), 400

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Kode tidak ditemukan"}), 404

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@admin_bp.route('/kehilangan/daftar')
def daftar_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM kehilangan
        WHERE is_arsip = 0
        ORDER BY tanggal_submit DESC, waktu_submit DESC
    """)
    kehilangan_list = cursor.fetchall()
    conn.close()

    return render_template(
        'daftar_kehilangan.html',
        kehilangan_list=kehilangan_list,
        role=session.get('role')
    )

@admin_bp.route('/kehilangan/tambah', methods=['GET', 'POST'])
def tambah_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    if request.method == 'GET':
        kode_baru = generate_kode_kehilangan(cursor)

        cursor.close()
        conn.close()

        return render_template(
            'tambah_kehilangan.html',
            role=session.get('role'),
            kode_baru=kode_baru
        )

    kode_kehilangan = request.form.get('kode_kehilangan')
    nama_pelapor = request.form.get('nama_pelapor', '').strip()
    email = request.form.get('email', '').strip()
    no_telp = request.form.get('no_telp', '').strip()
    asal_negara = request.form.get('asal_negara', '').strip()
    kota = request.form.get('kota', '').strip()
    nama_barang = request.form.get('nama_barang', '').strip()
    kategori = request.form.get('kategori', '').strip()
    jenis_laporan = request.form.get('jenis_laporan', 'Kehilangan').strip()
    deskripsi = request.form.get('deskripsi', '').strip()
    catatan_admin = request.form.get('catatan_admin', '').strip()
    lokasi = request.form.get('lokasi', '').strip()
    tanggal_kehilangan = request.form.get('tanggal_kehilangan')
    status = request.form.get('status', 'Verifikasi').strip()

    required = [
        nama_pelapor, email, no_telp,
        nama_barang, kategori, deskripsi,
        lokasi, tanggal_kehilangan
    ]

    if any(not v for v in required):
        cursor.close()
        conn.close()
        return "Error: Semua field wajib diisi.", 400

    foto = request.files.get('foto')
    foto_filename = None

    if foto and foto.filename:
        upload_folder = os.path.join('static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        foto_filename = foto.filename
        foto.save(os.path.join(upload_folder, foto_filename))

    now = datetime.now()
    tanggal_submit = now.strftime("%Y-%m-%d")
    waktu_submit = now.strftime("%H:%M")
    update_terakhir = now.strftime("%Y-%m-%d %H:%M")

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
            catatan_admin,
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

@admin_bp.route('/kehilangan/detail')
def detail_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode_kehilangan = request.args.get('kode')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # =========================
    # Ambil data kehilangan
    # =========================
    cursor.execute(
        "SELECT * FROM kehilangan WHERE kode_kehilangan = %s AND is_arsip = 0",
        (kode_kehilangan,)
    )
    laporan = cursor.fetchone()

    if not laporan:
        cursor.close()
        conn.close()
        return "Data tidak ditemukan", 404

    # =========================
    # Filter H-1, H, H+1
    # =========================
    tanggal = laporan['tanggal_kehilangan']
    h_min_1 = tanggal - timedelta(days=1)
    h_plus_1 = tanggal + timedelta(days=1)

    # =========================
    # Ambil penemuan SERUPA
    # =========================
    cursor.execute("""
        SELECT 
            id,
            kode_barang,
            nama_barang,
            gambar_barang,
            tanggal_lapor
        FROM penemuan
        WHERE tanggal_lapor BETWEEN %s AND %s
        AND status_barang = 'Tersedia'
        ORDER BY tanggal_lapor ASC
    """, (h_min_1, h_plus_1))
    foto_penemuan = cursor.fetchall()

    # =========================
    # Ambil rekomendasi yang sudah ada
    # =========================
    cursor.execute("""
        SELECT kode_penemuan
        FROM rekomendasi_penemuan
        WHERE kode_kehilangan = %s
    """, (kode_kehilangan,))
    rekomendasi_ada = [row['kode_penemuan'] for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return render_template(
        'detail_kehilangan.html',
        laporan=laporan,
        foto_penemuan=foto_penemuan,
        rekomendasi_ada=rekomendasi_ada
    )

@admin_bp.route('/rekomendasi/simpan', methods=['POST'])
def simpan_rekomendasi():
    data = request.get_json()

    kode_kehilangan = data.get('kode_kehilangan')
    kode_penemuan_list = data.get('kode_penemuan_list')

    if not kode_kehilangan or not kode_penemuan_list:
        return jsonify({
            "success": False,
            "message": "Data tidak lengkap"
        }), 400

    admin = session.get('admin_nama', 'admin')

    conn = get_db_connection()
    cursor = conn.cursor()

    for kode_penemuan in kode_penemuan_list:
        cursor.execute("""
            INSERT INTO rekomendasi_penemuan
            (kode_kehilangan, kode_penemuan, dipilih_oleh)
            VALUES (%s, %s, %s)
        """, (kode_kehilangan, kode_penemuan, admin))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Rekomendasi berhasil disimpan"
    })
    
@admin_bp.route('/rekomendasi/list')
def list_rekomendasi():
    kode_kehilangan = request.args.get('kode_kehilangan')
    if not kode_kehilangan:
        return jsonify({"success": False, "rekomendasi": []})

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT kode_penemuan
        FROM rekomendasi_penemuan
        WHERE kode_kehilangan = %s
    """, (kode_kehilangan,))
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    rekomendasi_list = [row['kode_penemuan'] for row in data]
    return jsonify({"success": True, "rekomendasi": rekomendasi_list})

def kirim_email_verifikasi(email_user, nama_pelapor, kode_kehilangan):
    try:
        print("🔥 STATUS VERIFIKASI TERDETEKSI")
        print("📧 EMAIL USER:", email_user)

        msg = Message(
            subject="Laporan Kehilangan Anda Telah Diverifikasi",
            recipients=[email_user]
        )

        msg.body = f"""
Halo {nama_pelapor},

Laporan kehilangan Anda dengan kode:
{kode_kehilangan}

Telah berhasil DIVERIFIKASI oleh petugas Lost & Found
Bandara Internasional Juanda.

Silakan pantau status laporan Anda secara berkala melalui website.

Terima kasih,
Admin Lost & Found Juanda
"""
        mail.send(msg)
        print("✅ EMAIL VERIFIKASI TERKIRIM KE:", email_user)

    except Exception as e:
        print("❌ GAGAL KIRIM EMAIL:", e)

# ======================
# 🔄 API: Update Status Kehilangan
# ======================
@admin_bp.route('/api/kehilangan/update_status', methods=['POST'])
def update_status_kehilangan():
    data = request.get_json()

    kode = data.get('kode')
    status_baru = data.get('status')
    catatan = data.get('catatan', '')  # ✅ CATATAN ADMIN

    if not kode or not status_baru:
        return jsonify({'success': False, 'message': 'Data tidak lengkap!'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 1️⃣ Ambil data lama
    cursor.execute("""
        SELECT status, email, nama_pelapor
        FROM kehilangan
        WHERE kode_kehilangan = %s
    """, (kode,))
    lama = cursor.fetchone()

    if not lama:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Data tidak ditemukan'}), 404

    status_lama = lama['status']
    email_user = lama['email']
    nama_pelapor = lama['nama_pelapor']

    waktu_update = datetime.now().strftime("%Y-%m-%d %H:%M")

    # 2️⃣ UPDATE STATUS + CATATAN
    cursor.execute("""
        UPDATE kehilangan
        SET status = %s,
            catatan = %s,
            update_terakhir = %s
        WHERE kode_kehilangan = %s
    """, (status_baru, catatan, waktu_update, kode))

    # 3️⃣ SIMPAN RIWAYAT STATUS (hanya jika berbeda)
    cursor.execute("""
        SELECT status, catatan
        FROM riwayat_status
        WHERE kode_kehilangan = %s
        ORDER BY waktu_update DESC
        LIMIT 1
    """, (kode,))
    last = cursor.fetchone()

    if not last or last['status'] != status_baru or last['catatan'] != catatan:
        cursor.execute("""
            INSERT INTO riwayat_status
            (kode_kehilangan, status, catatan, waktu_update)
            VALUES (%s, %s, %s, %s)
        """, (kode, status_baru, catatan, waktu_update))

    conn.commit()

    # 4️⃣ PINDAHKAN KE ARSIP JIKA SELESAI
    if status_baru == "Selesai":
        pindahkan_ke_arsip(kode, "kehilangan")

    cursor.close()
    conn.close()

    # 5️⃣ KIRIM EMAIL JIKA BARU VERIFIKASI
    if status_baru == "Verifikasi" and status_lama != "Verifikasi":
        kirim_email_verifikasi(email_user, nama_pelapor, kode)

    return jsonify({
        'success': True,
        'message': 'Status dan catatan berhasil diperbarui!',
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

@admin_bp.route('/kehilangan/edit', methods=['GET', 'POST'])
def edit_kehilangan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode_kehilangan = request.args.get('kode')
    from_page = request.args.get('from', '')   # ⬅⬅ AMBIL ASAL HALAMAN SELALU

    if not kode_kehilangan:
        return "Kode kehilangan tidak ditemukan", 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request.method == 'GET':
        cursor.execute("SELECT * FROM kehilangan WHERE kode_kehilangan=%s", (kode_kehilangan,))
        laporan = cursor.fetchone()

        lokasi_full = laporan.get('lokasi', '')

        if " - " in lokasi_full:
            terminal, tempat = lokasi_full.split(" - ", 1)
        else:
            terminal, tempat = lokasi_full, ""

        laporan['terminal'] = terminal
        laporan['tempat'] = tempat

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
            from_page=from_page,         
            role=session.get('role')
        )

    elif request.method == 'POST':
        try:
            from_page = (
                request.args.get('from') or 
                request.form.get('from') or 
                ""
            )

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
                nama_pelapor, no_telp, email, asal_negara, kota,
                nama_barang, kategori, lokasi, deskripsi, catatan,
                status, update_terakhir, kode_kehilangan
            ))

            conn.commit()
            cursor.close()
            conn.close()
            
            if from_page == "beranda":
                return redirect(url_for('admin_bp.beranda_admin'))

            elif from_page == "detail":
                return redirect(url_for('admin_bp.detail_kehilangan', kode=kode_kehilangan))

            else:
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


@admin_bp.route('/penemuan/daftar')
def daftar_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM penemuan
        WHERE is_arsip = 0
        ORDER BY tanggal_lapor DESC, update_terakhir DESC
    """)
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

    # =========================
    # GET
    # =========================
    if request.method == 'GET':
        kode_baru = generate_kode_penemuan(cursor)
        return render_template('tambah_penemuan.html', kode_baru=kode_baru)

    # =========================
    # POST
    # =========================
    nama_pelapor   = request.form.get('nama_pelapor', '').strip()
    no_telp        = request.form.get('no_telp', '').strip()
    email          = request.form.get('email', '').strip()
    nama_barang    = request.form.get('nama_barang', '').strip()
    kategori       = request.form.get('kategori', '').strip()
    lokasi         = request.form.get('lokasi', '').strip()
    deskripsi      = request.form.get('deskripsi', '').strip()
    tanggal_lapor  = request.form.get('tanggal_lapor', '').strip()

    kode_barang    = request.form.get('kode_barang')
    jenis_laporan  = request.form.get('jenis_laporan', 'Penemuan')
    status         = request.form.get('status', 'Verifikasi')
    status_barang  = request.form.get('status_barang', 'Tersedia')
    jenis_barang   = request.form.get('jenis_barang', 'Publik')

    # =========================
    # VALIDASI WAJIB
    # =========================
    if not all([kode_barang, nama_pelapor, nama_barang, kategori, lokasi, tanggal_lapor]):
        cursor.close()
        conn.close()
        return "Data wajib tidak boleh kosong!", 400

    # =========================
    # UPLOAD FOTO
    # =========================
    foto = request.files.get('foto')
    foto_filename = None

    if foto and foto.filename:
        upload_folder = os.path.join('static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        foto_filename = f"{int(time.time())}_{foto.filename}"
        foto.save(os.path.join(upload_folder, foto_filename))

    # =========================
    # INSERT DATABASE
    # =========================
    try:
        cursor.execute("""
            INSERT INTO penemuan (
                kode_barang, nama_pelapor, no_telp, email, nama_barang,
                kategori, jenis_laporan, lokasi, deskripsi, tanggal_lapor,
                update_terakhir, status, status_barang, gambar_barang, jenis_barang
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),%s,%s,%s,%s)
        """, (
            kode_barang, nama_pelapor, no_telp, email, nama_barang,
            kategori, jenis_laporan, lokasi, deskripsi, tanggal_lapor,
            status, status_barang, foto_filename, jenis_barang
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

@admin_bp.route('/penemuan/detail')
def detail_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode = request.args.get('kode')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM penemuan WHERE kode_barang=%s AND is_arsip = 0",
        (kode,)
    )
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

    kode = data.get('kode')
    status_baru = data.get('status')            # boleh None
    status_barang = data.get('status_barang')   # boleh None

    if not kode:
        return jsonify({
            "success": False,
            "message": "Kode tidak ada"
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(buffered=True)

        update_terakhir = datetime.now().strftime("%Y-%m-%d %H:%M")

        query = """
            UPDATE penemuan
            SET update_terakhir = %s
        """
        params = [update_terakhir]

        if status_baru is not None:
            query += ", status = %s"
            params.append(status_baru)

        if status_barang is not None:
            query += ", status_barang = %s"
            params.append(status_barang)

        query += " WHERE kode_barang = %s"
        params.append(kode)

        cursor.execute(query, tuple(params))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Kode tidak ditemukan"
            }), 404

        # ================================
        # PINDAHKAN KE ARSIP OTOMATIS
        # ================================
        if status_baru == "Selesai":
            pindahkan_ke_arsip(kode, "penemuan")

        return jsonify({
            "success": True,
            "update_terakhir": update_terakhir
        })

    except Exception as e:
        print("❌ Error update_status_penemuan:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()

@admin_bp.route('/klaim/baru', methods=['GET', 'POST'])
def tambah_klaim_penemuan():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    # =====================================================
    # ===============    GET METHOD    ====================
    # =====================================================
    if request.method == "GET":
        kode_barang = request.args.get("kode_barang")
        from_page = request.args.get("from")   # ambil dari args

        if not kode_barang:
            return "Kode barang tidak ditemukan", 400

        cursor.execute(
            "SELECT * FROM penemuan WHERE kode_barang = %s AND is_arsip = 0",
            (kode_barang,)
        )
        laporan = cursor.fetchone()

        cursor.close()
        conn.close()

        return render_template(
            'tambah_klaim_penemuan.html',
            laporan=laporan,
            from_page=from_page
        )

    # =====================================================
    # ===============    POST METHOD   ====================
    # =====================================================
    nama_pelapor = request.form.get("nama", "").strip()
    no_telp = request.form.get("telp", "").strip()
    email = request.form.get("email", "").strip()
    deskripsi_khusus = request.form.get("deskripsiKhusus", "").strip()
    kode_barang = request.form.get("kodeBarang", "").strip()
    kode_laporan_kehilangan = request.form.get("kodeLaporanKehilangan", "").strip() or None

    tanggal_lapor = datetime.now().strftime("%Y-%m-%d")
    waktu_lapor = datetime.now().strftime("%H:%M")

    # 🔥 FIX PALING PENTING
    from_page = request.form.get("from")     # << pakai FORM, bukan ARGS!!

    # Ambil nama barang
    cursor.execute("SELECT nama_barang FROM penemuan WHERE kode_barang = %s", (kode_barang,))
    barang = cursor.fetchone()

    nama_barang = barang['nama_barang']

    kode_baru = generate_kode_klaim(cursor)

    # -----------------------------------------------------
    # Simpan file
    # -----------------------------------------------------
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

    # -----------------------------------------------------
    # Insert ke database
    # -----------------------------------------------------
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

    # =====================================================
    # ============   REDIRECT BERDASARKAN ASAL   ==========
    # =====================================================
    if from_page == "beranda":  
        return redirect(url_for('admin_bp.beranda_admin'))

    return redirect(url_for('admin_bp.daftar_klaim_penemuan'))

@admin_bp.route('/penemuan/edit', methods=['GET', 'POST'])
def edit_penemuan():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_bp.login_admin'))

    kode = request.args.get('kode')
    from_page = request.args.get('from', 'daftar_penemuan')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # =========================
    # GET
    # =========================
    if request.method == 'GET':
        cursor.execute("SELECT * FROM penemuan WHERE kode_barang=%s", (kode,))
        laporan = cursor.fetchone()
        conn.close()

        if not laporan:
            return "Data tidak ditemukan", 404

        return render_template(
            'edit_penemuan.html',
            laporan=laporan,
            role=session.get('role'),
            from_page=from_page
        )

    # =========================
    # POST
    # =========================
    nama_pelapor = request.form['nama_pelapor']
    no_telp = request.form['no_telp']
    email = request.form['email']
    nama_barang = request.form['nama_barang']
    kategori = request.form['kategori']
    lokasi = request.form['lokasi']
    deskripsi = request.form['deskripsi']
    status = request.form['status']                  # status laporan
    status_barang = request.form['status_barang']    # ✅ BARU
    jenis_barang = request.form['jenis_barang']

    update_terakhir = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE penemuan
        SET nama_pelapor=%s,
            no_telp=%s,
            email=%s,
            nama_barang=%s,
            kategori=%s,
            lokasi=%s,
            deskripsi=%s,
            status=%s,
            status_barang=%s,
            jenis_barang=%s,
            update_terakhir=%s
        WHERE kode_barang=%s
    """, (
        nama_pelapor, no_telp, email,
        nama_barang, kategori, lokasi,
        deskripsi, status, status_barang, jenis_barang,
        update_terakhir, kode
    ))

    conn.commit()
    conn.close()

    if from_page == "beranda":
        return redirect(url_for('admin_bp.beranda_admin'))

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
            k.status,
            k.tanggal_lapor   -- 🔥 INI KUNCINYA
        FROM klaim_barang k
        LEFT JOIN penemuan p ON k.kode_barang = p.kode_barang
        ORDER BY k.tanggal_lapor DESC
    """)

    data_klaim = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template(
        "admin/klaim_penemuan.html",
        data_klaim=data_klaim
    )

@admin_bp.route('/penemuan/klaim/update_status', methods=['POST'])
def update_status_klaim():
    if not session.get('admin_logged_in'):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json()
    kode = data.get("kode_laporan")
    status_baru = data.get("status")
    catatan = data.get("catatan_admin") or ""

    if not kode or not status_baru:
        return jsonify({"success": False, "message": "Data tidak lengkap"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # =====================
        # AMBIL KODE BARANG
        # =====================
        cursor.execute("""
            SELECT kode_barang
            FROM klaim_barang
            WHERE kode_laporan = %s
        """, (kode,))
        klaim = cursor.fetchone()

        if not klaim:
            return jsonify({"success": False, "message": "Klaim tidak ditemukan"}), 404

        kode_barang = klaim["kode_barang"]

        # =====================
        # UPDATE STATUS KLAIM
        # =====================
        cursor.execute("""
            UPDATE klaim_barang
            SET status = %s,
                catatan_admin = %s,
                update_terakhir = NOW()
            WHERE kode_laporan = %s
        """, (status_baru, catatan, kode))

        # =====================
        # UPDATE STATUS_BARANG DI PENEMUAN
        # =====================
        if status_baru.lower() == "pending" or status_baru.lower() == "ditolak":
            status_barang = "Tersedia"
        elif status_baru.lower() in ["verifikasi", "siap diambil"]:
            status_barang = "Diklaim"
        else:
            status_barang = None  # status lain tidak diubah

        if status_barang:
            cursor.execute("""
                UPDATE penemuan
                SET status_barang = %s,
                    update_terakhir = NOW()
                WHERE kode_barang = %s
            """, (status_barang, kode_barang))

        if status_baru == "Selesai":
            # update penemuan + pindahkan penemuan ke arsip
            cursor.execute("""
                UPDATE penemuan
                SET status = 'Selesai',
                    status_barang = 'Selesai',
                    update_terakhir = NOW()
                WHERE kode_barang = %s
            """, (kode_barang,))
            conn.commit()
            try:
                pindahkan_ke_arsip(kode_barang, "penemuan")
            except Exception as e:
                print("❌ Error arsip penemuan:", e)

        if status_baru == "Ditolak":
            # pindahkan klaim ke arsip saja, penemuan tetap
            conn.commit()
            try:
                pindahkan_ke_arsip(kode, "klaim_barang")
            except Exception as e:
                print("❌ Error arsip klaim:", e)

        else:
            conn.commit()

        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

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
            k.foto_barang AS foto_barang_klaim,
            k.bukti_laporan,
            p.nama_barang,
            p.kategori,
            p.lokasi,
            p.gambar_barang AS foto_barang_penemuan
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
    
    if data.get("update_terakhir"):
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

    auto_arsip_laporan()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute("SELECT * FROM arsip ORDER BY tanggal_arsip DESC")
    data_arsip = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template(
        'arsip.html',
        role=session.get('role'),
        data_arsip=data_arsip
    )

def auto_arsip_laporan():
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    batas_tanggal = datetime.now() - relativedelta(months=3)
    tanggal_inactive = datetime.now().replace(second=0, microsecond=0)

    # ======================
    # KEHILANGAN
    # ======================
    cur.execute("""
        SELECT kode_kehilangan
        FROM kehilangan
        WHERE is_arsip = 0
          AND (
              tanggal_kehilangan < %s
              OR status IN ('Selesai', 'Barang Tidak Ditemukan')
          )
    """, (batas_tanggal,))

    for row in cur.fetchall():
        pindahkan_ke_arsip(row['kode_kehilangan'], 'kehilangan', tanggal_inactive)

    # ======================
    # PENEMUAN
    # ======================
    cur.execute("""
        SELECT kode_barang
        FROM penemuan
        WHERE is_arsip = 0
          AND tanggal_lapor < %s
    """, (batas_tanggal,))

    for row in cur.fetchall():
        pindahkan_ke_arsip(row['kode_barang'], 'penemuan', tanggal_inactive)

    cur.close()
    db.close()

def pindahkan_ke_arsip(kode, jenis_tabel, tanggal_inactive=None):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    # ======================
    # CEK SUDAH ADA DI ARSIP
    # ======================
    cur.execute("SELECT 1 FROM arsip WHERE kode=%s", (kode,))
    if cur.fetchone():
        cur.close()
        db.close()
        return False

    # ======================
    # AMBIL DATA
    # ======================
    if jenis_tabel == "kehilangan":
        cur.execute("SELECT * FROM kehilangan WHERE kode_kehilangan=%s", (kode,))
        kolom_tanggal = "tanggal_kehilangan"

    elif jenis_tabel == "penemuan":
        cur.execute("SELECT * FROM penemuan WHERE kode_barang=%s", (kode,))
        kolom_tanggal = "tanggal_lapor"

    elif jenis_tabel in ("klaim", "klaim_barang"):
        cur.execute("""
            SELECT k.*, p.nama_barang, p.kategori, p.lokasi, p.gambar_barang
            FROM klaim_barang k
            LEFT JOIN penemuan p ON k.kode_barang = p.kode_barang
            WHERE k.kode_laporan=%s
        """, (kode,))
        kolom_tanggal = "tanggal_lapor"

    else:
        cur.close()
        db.close()
        return False

    data = cur.fetchone()
    if not data:
        cur.close()
        db.close()
        return False

    tanggal_asli = data.get(kolom_tanggal)
    tanggal_arsip = datetime.now().replace(second=0, microsecond=0)

    if jenis_tabel in ("klaim", "klaim_barang"):
        tanggal_inactive = None
    else:
        tanggal_inactive = None if data.get("status") in (
            "Selesai", "Barang Tidak Ditemukan"
        ) else tanggal_inactive

    # ======================
    # INSERT KE ARSIP
    # ======================
    cur.execute("""
        INSERT INTO arsip (
            kode, nama_barang, jenis, kategori, lokasi,
            tanggal, foto, nama_pelapor, no_telp, email,
            status, tanggal_arsip, tanggal_inactive
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        kode,
        data.get("nama_barang") or "-",
        "klaim" if jenis_tabel in ("klaim", "klaim_barang") else jenis_tabel,
        data.get("kategori") or "-",
        data.get("lokasi") or data.get("lokasi_kehilangan") or "-",
        tanggal_asli,
        data.get("gambar_barang") or data.get("foto") or "-",
        data.get("nama_pelapor") or data.get("nama_pengklaim") or "-",
        data.get("no_telp") or "-",
        data.get("email") or "-",
        data.get("status"),
        tanggal_arsip,
        tanggal_inactive
    ))

    # ======================
    # TANDAI SEBAGAI ARSIP
    # ======================
    if jenis_tabel == "kehilangan":
        cur.execute(
            "UPDATE kehilangan SET is_arsip=1 WHERE kode_kehilangan=%s",
            (kode,)
        )
    elif jenis_tabel == "penemuan":
        cur.execute(
            "UPDATE penemuan SET is_arsip=1 WHERE kode_barang=%s",
            (kode,)
        )
    else:
        cur.execute(
            "UPDATE klaim_barang SET is_arsip=1 WHERE kode_laporan=%s",
            (kode,)
        )

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

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    cursor.execute(
        "SELECT * FROM arsip WHERE kode=%s",
        (kode,)
    )
    arsip = cursor.fetchone()

    cursor.close()
    conn.close()

    if not arsip:
        flash("Data arsip tidak ditemukan", "danger")
        return redirect(url_for('admin_bp.arsip'))

    return render_template(
        'detail_arsip.html',
        data=arsip,
        role=session.get('role')
    )

def generate_kode_kehilangan(cursor):
    cursor.execute("SELECT kode_kehilangan FROM kehilangan")
    main_codes = [row['kode_kehilangan'] for row in cursor.fetchall() if row['kode_kehilangan']]

    cursor.execute("SELECT kode FROM arsip WHERE jenis='kehilangan'")
    archive_codes = [row['kode'] for row in cursor.fetchall() if row['kode']]

    all_codes = main_codes + archive_codes
    if not all_codes:
        return "LF-L001"

    max_num = max(
        int(re.search(r"LF-L(\d+)", code).group(1))
        for code in all_codes if re.search(r"LF-L(\d+)", code)
    )
    return f"LF-L{max_num + 1:03d}"

def generate_kode_penemuan(cursor):
    cursor.execute("SELECT kode_barang FROM penemuan")
    main_codes = [row['kode_barang'] for row in cursor.fetchall() if row['kode_barang']]

    cursor.execute("SELECT kode FROM arsip WHERE jenis='penemuan'")
    archive_codes = [row['kode'] for row in cursor.fetchall() if row['kode']]

    all_codes = main_codes + archive_codes
    if not all_codes:
        return "LF-F001"

    max_num = max(
        int(re.search(r"LF-F(\d+)", code).group(1))
        for code in all_codes if re.search(r"LF-F(\d+)", code)
    )
    return f"LF-F{max_num + 1:03d}"

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

    # 🔥 UPDATE SESSION SUPAYA LANGSUNG TAMPIL BARU
    session['admin_email'] = email

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

@admin_bp.app_context_processor
def inject_admin_profile():
    admin_data = None

    if 'admin_id' in session:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, full_name, photo FROM admin WHERE id = %s", (session['admin_id'],))
        admin_data = cursor.fetchone()
        cursor.close()
        conn.close()

    return {"global_admin": admin_data}

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
# ✏ EDIT ADMIN TANPA HASH PASSWORD
# ============================
@admin_bp.route('/kelola_admin/edit/<int:id>', methods=['GET', 'POST'])
def edit_admin(id):
    if not is_super_admin():
        return "Anda tidak memiliki akses!", 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if request.method == 'GET':
        # Ambil data admin
        cursor.execute("SELECT * FROM admin WHERE id=%s", (id,))
        admin_data = cursor.fetchone()
        cursor.close()
        conn.close()

        return render_template(
            'edit_admin.html',
            admin=admin_data,
            role=session.get('role')
        )

    # ========== POST ==========
    full_name = request.form['full_name']
    email = request.form['email']
    phone = request.form.get('phone')
    requested_role = request.form['role']
    password = request.form.get('password')

    # Ambil data admin yang diedit
    cursor.execute("SELECT * FROM admin WHERE id=%s", (id,))
    target_admin = cursor.fetchone()

    # Hitung jumlah super admin
    cursor.execute("SELECT COUNT(*) AS total FROM admin WHERE role='super admin'")
    total_super = cursor.fetchone()['total']

    # ===== Cegah Super Admin terakhir diturunkan =====
    if target_admin['role'] == "super admin" and requested_role != "super admin":
        if total_super <= 1:
            cursor.close()
            conn.close()
            return render_template(
                'edit_admin.html',
                admin=target_admin,
                role=session.get('role'),
                error="Minimal harus ada satu Super Admin. Tidak bisa mengubah role."
            )

    # Kalau target adalah super admin → ROLE TIDAK BOLEH DIUBAH
    final_role = target_admin['role'] if target_admin['role'] == "super admin" else requested_role

    try:
        if password:
            cursor.execute("""
                UPDATE admin
                SET full_name=%s, email=%s, phone=%s, role=%s, password=%s
                WHERE id=%s
            """, (full_name, email, phone, final_role, password, id))
        else:
            cursor.execute("""
                UPDATE admin
                SET full_name=%s, email=%s, phone=%s, role=%s
                WHERE id=%s
            """, (full_name, email, phone, final_role, id))

        conn.commit()
        success = True

    except Exception as e:
        conn.rollback()
        print("Error edit admin:", e)
        success = False
        error_msg = "Terjadi kesalahan saat memperbarui data."

    finally:
        cursor.close()
        conn.close()

    if success:
        return redirect(url_for('admin_bp.kelola_admin'))
    else:
        # load ulang untuk tampilkan pesan error
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM admin WHERE id=%s", (id,))
        admin_data = cursor.fetchone()
        cursor.close()
        conn.close()

        return render_template(
            'edit_admin.html',
            admin=admin_data,
            role=session.get('role'),
            error=error_msg
        )

# ============================
# 🗑 DELETE ADMIN (POST)
# ============================
@admin_bp.route('/kelola_admin/delete/<int:id>', methods=['POST'])
def delete_admin(id):
    if not is_super_admin():
        return {"success": False, "message": "Anda tidak memiliki akses!"}, 403

    if id == session.get('admin_id'):
        return {"success": False, "message": "Tidak bisa menghapus diri sendiri!"}, 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM admin WHERE id=%s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"success": True, "message": "Admin berhasil dihapus!"}
    except Exception as e:
        return {"success": False, "message": f"Gagal menghapus admin: {e}"}, 500

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

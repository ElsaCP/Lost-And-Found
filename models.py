# models.py
from config import get_db_connection
from datetime import datetime

def tambah_riwayat_status(kode_laporan, status, catatan):
    """
    Tambah 1 baris riwayat ke tabel riwayat_klaim.
    Digunakan saat submit klaim (status awal) dan saat admin mengubah status.
    """
    db = get_db_connection()
    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO riwayat_klaim (kode_laporan, status, catatan_admin)
            VALUES (%s, %s, %s)
        """, (kode_laporan, status, catatan))
        db.commit()
    finally:
        cursor.close()
        db.close()

def get_riwayat_status(kode_laporan):
    """
    Mengembalikan list dict riwayat untuk kode_laporan, 
    dengan waktu_update diformat jadi string 'dd/mm/YYYY HH:MM'
    """
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, kode_laporan, status, catatan_admin, waktu_update
            FROM riwayat_klaim
            WHERE kode_laporan = %s
            ORDER BY waktu_update ASC
        """, (kode_laporan,))
        rows = cursor.fetchall()

        # format waktu_update ke string supaya JS tidak bingung
        for r in rows:
            if r.get("waktu_update") is not None:
                # waktu_update biasanya datetime, ubah jadi string dd/mm/YYYY HH:MM
                r["waktu_update"] = r["waktu_update"].strftime("%d/%m/%Y %H:%M")
            else:
                r["waktu_update"] = None
            # sesuaikan nama field catatan jika kolom bernama catatan_admin di DB
            # keep catatan sebagai alias agar frontend tetap kompatibel
            r["catatan"] = r.get("catatan_admin") or ""
        return rows
    finally:
        cursor.close()
        db.close()


def fetch_public_penemuan(q=None, kategori=None, dari=None, hingga=None, page=1, per_page=12):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    where = [
        "jenis_barang = 'Publik'",
        "status_barang = 'Tersedia'"   # ⬅️ TAMBAHAN SAJA
    ]
    params = []

    if q:
        where.append("(LOWER(nama_barang) LIKE %s OR LOWER(kode_barang) LIKE %s)")
        like = f"%{q.lower()}%"
        params.extend([like, like])

    if kategori:
        where.append("kategori = %s")
        params.append(kategori)

    if dari:
        where.append("tanggal_lapor >= %s")
        params.append(dari)

    if hingga:
        where.append("tanggal_lapor <= %s")
        params.append(hingga)

    where_clause = " AND ".join(where)

    cursor.execute(
        f"SELECT COUNT(*) AS cnt FROM penemuan WHERE {where_clause}",
        params
    )
    total = cursor.fetchone()["cnt"]

    offset = (page - 1) * per_page
    cursor.execute(f"""
        SELECT kode_barang, nama_barang, kategori, tanggal_lapor, gambar_barang
        FROM penemuan
        WHERE {where_clause}
        ORDER BY tanggal_lapor DESC
        LIMIT %s OFFSET %s
    """, params + [per_page, offset])

    rows = cursor.fetchall()

    # ⬇️ FORMAT TANGGAL SAJA, JANGAN SENTUH GAMBAR
    for r in rows:
        if r.get("tanggal_lapor"):
            r["tanggal_lapor"] = r["tanggal_lapor"].strftime("%d/%m/%Y")

    cursor.close()
    db.close()
    return rows, total


def get_penemuan_by_kode(kode):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM penemuan WHERE kode_barang = %s", (kode,))
    r = cursor.fetchone()
    if r and r.get('tanggal_lapor'):
        r['tanggal_lapor'] = r['tanggal_lapor'].strftime('%d/%m/%Y')
    cursor.close()
    db.close()
    return r

def fetch_barang_publik_terbaru(limit=4):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT kode_barang, nama_barang, kategori, tanggal_lapor, gambar_barang
        FROM penemuan
        WHERE jenis_barang = 'Publik'
          AND status_barang = 'Tersedia'
        ORDER BY update_terakhir DESC, tanggal_lapor DESC
        LIMIT %s
    """, (limit,))

    items = cursor.fetchall()

    for item in items:
        if item.get("tanggal_lapor"):
            item["tanggal_lapor"] = item["tanggal_lapor"].strftime("%d/%m/%Y")

        # INDEX BUTUH PATH LENGKAP
        if item.get("gambar_barang"):
            item["gambar_barang"] = f"/static/uploads/{item['gambar_barang']}"
        else:
            item["gambar_barang"] = "/static/image/no-image.png"

    cursor.close()
    db.close()
    return items

def insert_klaim_barang(data):
    db = get_db_connection()
    cursor = db.cursor()
    query = """
        INSERT INTO klaim_barang (
            kode_laporan, kode_barang, kode_laporan_kehilangan, nama_barang,
            nama_pelapor, no_telp, email, deskripsi_khusus,
            identitas_diri, bukti_laporan, foto_barang,
            tanggal_lapor, waktu_lapor, status, catatan_admin
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    cursor.execute(query, data)
    db.commit()
    cursor.close()
    db.close()

def fetch_riwayat_klaim(email):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    query = """
        SELECT *
        FROM klaim_barang
        WHERE email = %s
        ORDER BY id DESC
    """
    cursor.execute(query, (email,))
    result = cursor.fetchall()

    cursor.close()
    db.close()
    return result
 
def get_laporan_by_email(email):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    query = """
        SELECT kode_kehilangan, nama_barang, kategori, lokasi, tanggal_submit, status
        FROM kehilangan
        WHERE email = %s
        ORDER BY tanggal_lapor DESC
    """
    cursor.execute(query, (email,))
    hasil = cursor.fetchall()

    cursor.close()
    db.close()

    return hasil

def get_riwayat_klaim_by_email(email):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    query = """
        SELECT *
        FROM klaim_barang
        WHERE email = %s
        ORDER BY id DESC
    """
    cursor.execute(query, (email,))
    result = cursor.fetchall()

    cursor.close()
    db.close()
    return result

def tambah_riwayat_status(kode_laporan, status, catatan):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO riwayat_klaim_barang (kode_laporan, status, catatan)
        VALUES (%s, %s, %s)
    """, (kode_laporan, status, catatan))

    db.commit()
    cursor.close()
    db.close()

def get_riwayat_status(kode_laporan):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT status, catatan, waktu_update
        FROM riwayat_klaim_barang
        WHERE kode_laporan = %s
        ORDER BY waktu_update ASC
    """, (kode_laporan,))

    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data

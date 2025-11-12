# models.py
from config import get_db_connection

def fetch_public_penemuan(q=None, kategori=None, dari=None, hingga=None, page=1, per_page=12):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    where = ["jenis_barang = 'Publik'"]
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
    count_sql = f"SELECT COUNT(*) AS cnt FROM penemuan WHERE {where_clause}"
    cursor.execute(count_sql, params)
    total = cursor.fetchone()['cnt']

    offset = (page - 1) * per_page
    sql = f"""
        SELECT kode_barang, nama_barang, kategori, tanggal_lapor, gambar_barang
        FROM penemuan
        WHERE {where_clause}
        ORDER BY tanggal_lapor DESC
        LIMIT %s OFFSET %s
    """
    cursor.execute(sql, params + [per_page, offset])
    rows = cursor.fetchall()

    # Format tanggal dd/mm/yyyy
    for r in rows:
        if r.get('tanggal_lapor'):
            r['tanggal_lapor'] = r['tanggal_lapor'].strftime('%d/%m/%Y')

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
    """
    Ambil 4 data barang publik terbaru dari tabel penemuan
    berdasarkan tanggal update_terakhir (atau tanggal_lapor kalau tidak ada)
    """
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT kode_barang, nama_barang, kategori, tanggal_lapor, gambar_barang
        FROM penemuan
        WHERE jenis_barang = 'Publik'
        ORDER BY update_terakhir DESC, tanggal_lapor DESC
        LIMIT %s
    """, (limit,))

    items = cursor.fetchall()

    # Format data
    for item in items:
        if item.get("tanggal_lapor"):
            item["tanggal_lapor"] = item["tanggal_lapor"].strftime("%d/%m/%Y")
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
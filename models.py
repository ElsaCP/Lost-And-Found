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

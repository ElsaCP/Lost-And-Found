<?php
// Debug semua error
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Konfigurasi database
$host = "localhost";
$user = "root";    // ganti jika berbeda
$pass = "";        // ganti jika berbeda
$db   = "lost_found";

// Koneksi MySQL
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

// Ambil data POST
$nama_pelapor       = $_POST['nama_pelapor'] ?? '';
$no_telp            = $_POST['no_telp'] ?? '';
$email              = $_POST['email'] ?? '';
$asal_negara        = $_POST['asal_negara'] ?? '';
$kota               = $_POST['kota'] ?? '';
$nama_barang        = $_POST['nama_barang'] ?? '';
$jenis_barang       = $_POST['jenis_barang'] ?? '';
$lokasi_kehilangan  = $_POST['lokasi_kehilangan'] ?? '';
$tanggal_kehilangan = $_POST['tanggal_kehilangan'] ?? '';
$deskripsi          = $_POST['deskripsi'] ?? '';

// Upload foto
$foto_barang = null;
if(isset($_FILES['foto_barang']) && $_FILES['foto_barang']['error'] == 0){
    $ext = pathinfo($_FILES['foto_barang']['name'], PATHINFO_EXTENSION);
    $foto_barang = "uploads/".time()."_".rand(1000,9999).".".$ext;
    if(!move_uploaded_file($_FILES['foto_barang']['tmp_name'], $foto_barang)){
        die("Gagal upload foto. Pastikan folder 'uploads/' ada dan writable.");
    }
}

// Generate kode_laporan otomatis
$result = $conn->query("SELECT id FROM laporan_kehilangan ORDER BY id DESC LIMIT 1");
$last_id = ($result && $result->num_rows > 0) ? $result->fetch_assoc()['id'] + 1 : 1;
$kode_laporan = "LF_L" . str_pad($last_id, 3, "0", STR_PAD_LEFT);

// Prepared statement untuk insert data
$stmt = $conn->prepare("INSERT INTO laporan_kehilangan 
    (kode_laporan, nama_pelapor, no_telp, email, asal_negara, kota, nama_barang, jenis_barang, lokasi_kehilangan, tanggal_kehilangan, deskripsi, foto_barang)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

if(!$stmt){
    die("Prepare statement gagal: " . $conn->error);
}

$stmt->bind_param("ssssssssssss", 
    $kode_laporan, $nama_pelapor, $no_telp, $email, $asal_negara, $kota, 
    $nama_barang, $jenis_barang, $lokasi_kehilangan, 
    $tanggal_kehilangan, $deskripsi, $foto_barang
);

if($stmt->execute()){
    echo "<script>alert('Laporan berhasil dikirim!\nKode Laporan: $kode_laporan'); window.location='indexx.html';</script>";
} else {
    die("Gagal menyimpan laporan: " . $stmt->error);
}

$stmt->close();
$conn->close();
?>
